import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getPusherServer, merchantChannel, PUSHER_EVENTS } from '@/lib/pusher-server';
import { errorResponse, successResponse } from '@/lib/api-response';

const SyncBillSchema = z.object({
  billId: z.string().uuid('Invalid billId'),
  txHash: z.string().min(66, 'Invalid txHash').max(66),
});

/**
 * POST /api/bill/sync
 *
 * Called by the Consumer Frontend after it detects a successful on-chain transfer
 * via useWatchContractEvent (Hybrid Listener backup).
 *
 * If Circle Webhook is delayed, this endpoint allows the Consumer Frontend to
 * force-update the bill status in the DB and notify the Merchant POS via Pusher.
 *
 * Request Body: { billId: string, txHash: string }
 *
 * Response:
 * { success: true, billId: string, status: "PAID" }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = SyncBillSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse('INVALID_REQUEST', parsed.error.issues[0].message);
    }

    const { billId, txHash } = parsed.data;

    const bill = await prisma.bill.findUnique({
      where: { id: billId },
      include: { merchant: true },
    });

    if (!bill) {
      return errorResponse('NOT_FOUND', `Bill '${billId}' not found`, 404);
    }

    // Idempotency: already paid — just trigger Pusher again for the POS
    if (bill.status === 'PAID') {
      await getPusherServer().trigger(
        merchantChannel(bill.merchantId),
        PUSHER_EVENTS.BILL_PAID,
        { billId: bill.id, txHash: bill.txHash }
      );
      return successResponse({ success: true, billId: bill.id, status: 'PAID' });
    }

    if (bill.status !== 'PENDING') {
      return errorResponse('INVALID_REQUEST', `Bill is in '${bill.status}' state, cannot sync.`);
    }

    // Update bill to PAID
    const updatedBill = await prisma.bill.update({
      where: { id: billId },
      data: { status: 'PAID', txHash, paidAt: new Date() },
    });

    // Notify the Merchant POS via Pusher WebSocket
    await getPusherServer().trigger(
      merchantChannel(bill.merchantId),
      PUSHER_EVENTS.BILL_PAID,
      { billId: updatedBill.id, txHash }
    );

    return successResponse({ success: true, billId: updatedBill.id, status: 'PAID' });
  } catch (err) {
    console.error('[bill/sync] Error:', err);
    return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred', 500);
  }
}
