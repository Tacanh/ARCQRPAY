import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCircleClient, CIRCLE_WALLET_SET_ID, ARC_BLOCKCHAIN_ID } from '@/lib/circle';
import { errorResponse, successResponse } from '@/lib/api-response';

const CreateMerchantSchema = z.object({
  name: z.string().min(1, 'Merchant name is required').max(100),
});

/**
 * POST /api/merchant/create
 *
 * Creates a new Merchant with a Circle Developer-Controlled Wallet on Arc Testnet.
 *
 * Request Body: { name: string }
 *
 * Response:
 * {
 *   id: string,
 *   name: string,
 *   walletAddress: string,
 *   walletId: string
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CreateMerchantSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse('INVALID_REQUEST', parsed.error.issues[0].message);
    }

    const { name } = parsed.data;
    const circle = getCircleClient();

    // 1. Create wallet via Circle API on Arc Testnet
    const walletResponse = await circle.createWallets({
      walletSetId: CIRCLE_WALLET_SET_ID,
      blockchains: [ARC_BLOCKCHAIN_ID],
      count: 1,
      metadata: [{ name: `Merchant: ${name}`, refId: `merchant-${Date.now()}` }],
    });

    const wallet = walletResponse.data?.wallets?.[0];
    if (!wallet || !wallet.address || !wallet.id) {
      return errorResponse('CIRCLE_ERROR', 'Failed to create wallet via Circle API', 500);
    }

    // 2. Persist merchant to DB
    const merchant = await prisma.merchant.create({
      data: {
        name,
        walletAddress: wallet.address,
        walletId: wallet.id,
      },
    });

    return successResponse(
      {
        id: merchant.id,
        name: merchant.name,
        walletAddress: merchant.walletAddress,
        walletId: merchant.walletId,
      },
      201
    );
  } catch (err) {
    console.error('[merchant/create] Error:', err);
    return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred', 500);
  }
}
