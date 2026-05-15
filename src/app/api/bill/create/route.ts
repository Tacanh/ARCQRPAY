import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { errorResponse, successResponse } from '@/lib/api-response';

const CreateBillSchema = z.object({
  merchantId: z.string().uuid('Invalid merchantId'),
  amount: z.number().positive('Amount must be positive'),
});

/**
 * POST /api/bill/create
 *
 * Creates a new bill (invoice) linked to a merchant in PENDING state.
 *
 * Request Body: { merchantId: string, amount: number }
 *
 * Response:
 * {
 *   id: string,
 *   status: "PENDING",
 *   amount: number,
 *   merchantId: string,
 *   merchantAddress: string,
 *   createdAt: string
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CreateBillSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse('INVALID_REQUEST', parsed.error.issues[0].message);
    }

    const { merchantId, amount } = parsed.data;

    // Verify merchant exists
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
    });

    if (!merchant) {
      return errorResponse('NOT_FOUND', `Merchant with id '${merchantId}' not found`, 404);
    }

    const bill = await prisma.bill.create({
      data: {
        merchantId,
        amount,
        status: 'PENDING',
      },
    });

    return successResponse(
      {
        id: bill.id,
        status: bill.status,
        amount: bill.amount,
        merchantId: bill.merchantId,
        merchantAddress: merchant.walletAddress,
        createdAt: bill.createdAt.toISOString(),
      },
      201
    );
  } catch (err) {
    console.error('[bill/create] Error:', err);
    return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred', 500);
  }
}
