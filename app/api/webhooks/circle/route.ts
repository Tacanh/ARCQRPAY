import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { getPusherServer, merchantChannel, PUSHER_EVENTS } from '@/lib/pusher-server';
import { errorResponse, successResponse } from '@/lib/api-response';

// ── Types from Circle's Webhook payload ──────────────────────────────────────

interface CircleTransferPayload {
  clientId: string;
  notificationType: string;
  version: number;
  customAttributes: Record<string, string>;
  transfer: {
    id: string;
    state: string; // "COMPLETE", "FAILED"
    amounts: Array<{ amount: string; currency: string }>;
    destinationAddress: string;
    transactionHash: string;
    createDate: string;
    updateDate: string;
  };
}

// ── SNS Signature Verification ───────────────────────────────────────────────

/**
 * Circle delivers webhooks via Amazon SNS.
 * We must verify the SNS signature to prevent spoofed webhook calls
 * that could fraudulently mark bills as PAID.
 *
 * Reference: https://developers.circle.com/developer/docs/circle-webhooks
 */
function verifySNSSignature(req: NextRequest, rawBody: string): boolean {
  // In MVP / Testnet mode, allow bypass via env flag (useful for ngrok local dev)
  if (process.env.CIRCLE_SKIP_WEBHOOK_VERIFY === 'true') {
    console.warn('[webhook] ⚠️ SNS signature verification BYPASSED (dev mode)');
    return true;
  }

  const publicKey = process.env.CIRCLE_WEBHOOK_PUBLIC_KEY;
  if (!publicKey) {
    console.error('[webhook] CIRCLE_WEBHOOK_PUBLIC_KEY is not set');
    return false;
  }

  const signature = req.headers.get('x-circle-signature');
  if (!signature) return false;

  try {
    const verifier = crypto.createVerify('SHA256withRSA');
    verifier.update(rawBody);
    return verifier.verify(publicKey, signature, 'base64');
  } catch {
    return false;
  }
}

// ── Handler ──────────────────────────────────────────────────────────────────

/**
 * POST /api/webhooks/circle
 *
 * Circle calls this endpoint when a wallet receives an inbound USDC transfer.
 * Security: SNS signature is verified before any DB mutation.
 *
 * Flow:
 *  1. Verify signature
 *  2. Only process COMPLETE transfers
 *  3. Find the Merchant by destination address
 *  4. Find the most recent PENDING bill matching the amount
 *  5. Mark bill as PAID, save txHash
 *  6. Trigger Pusher event to notify the Merchant POS WebSocket
 */
export async function POST(req: NextRequest) {
  let rawBody: string;

  try {
    rawBody = await req.text();
  } catch {
    return errorResponse('INVALID_REQUEST', 'Could not read request body');
  }

  // 1. Verify SNS signature
  if (!verifySNSSignature(req, rawBody)) {
    console.warn('[webhook] Invalid signature, rejecting request');
    return errorResponse('WEBHOOK_INVALID', 'Invalid webhook signature', 401);
  }

  let payload: CircleTransferPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return errorResponse('INVALID_REQUEST', 'Malformed JSON payload');
  }

  // 2. Only process completed inbound transfers
  if (payload.notificationType !== 'transfers') {
    return successResponse({ ignored: true, reason: 'Not a transfer event' });
  }

  const { transfer } = payload;

  if (transfer.state !== 'COMPLETE') {
    console.log(`[webhook] Ignoring transfer with state: ${transfer.state}`);
    return successResponse({ ignored: true, reason: `Transfer state is ${transfer.state}` });
  }

  const receivedAmount = parseFloat(transfer.amounts?.[0]?.amount ?? '0');
  const destinationAddress = transfer.destinationAddress?.toLowerCase();
  const txHash = transfer.transactionHash;

  if (!destinationAddress || !txHash || receivedAmount <= 0) {
    return errorResponse('INVALID_REQUEST', 'Missing transfer fields');
  }

  // 3. Find the merchant by wallet address (case-insensitive)
  const merchant = await prisma.merchant.findFirst({
    where: { walletAddress: { equals: destinationAddress, mode: 'insensitive' } },
  });

  if (!merchant) {
    console.log(`[webhook] No merchant found for address: ${destinationAddress}`);
    return successResponse({ ignored: true, reason: 'Merchant not found' });
  }

  // 4. Find the oldest PENDING bill that matches the amount (within 0.0001 USDC tolerance)
  const AMOUNT_TOLERANCE = 0.0001;
  const bill = await prisma.bill.findFirst({
    where: {
      merchantId: merchant.id,
      status: 'PENDING',
      amount: {
        gte: receivedAmount - AMOUNT_TOLERANCE,
        lte: receivedAmount + AMOUNT_TOLERANCE,
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  if (!bill) {
    console.log(
      `[webhook] No matching PENDING bill for merchant ${merchant.id} with amount ${receivedAmount}`
    );
    return successResponse({ ignored: true, reason: 'No matching bill' });
  }

  // Idempotency guard — don't double-process
  if (bill.txHash === txHash) {
    return successResponse({ success: true, note: 'Already processed' });
  }

  // 5. Update bill to PAID
  await prisma.bill.update({
    where: { id: bill.id },
    data: { status: 'PAID', txHash, paidAt: new Date() },
  });

  console.log(`[webhook] ✅ Bill ${bill.id} marked PAID — txHash: ${txHash}`);

  // 6. Notify the Merchant POS Dashboard via Pusher WebSocket
  try {
    await getPusherServer().trigger(
      merchantChannel(merchant.id),
      PUSHER_EVENTS.BILL_PAID,
      { billId: bill.id, txHash, amount: receivedAmount }
    );
  } catch (pusherErr) {
    // Non-fatal — bill is already marked PAID in DB
    console.error('[webhook] Pusher trigger failed:', pusherErr);
  }

  return successResponse({ success: true, billId: bill.id });
}
