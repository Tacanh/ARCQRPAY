import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { errorResponse, successResponse } from '@/lib/api-response';

/**
 * GET /api/bill/[id]
 *
 * Returns the current status of a bill.
 * Used as a fallback when the WebSocket connection drops.
 *
 * Response:
 * {
 *   id: string,
 *   status: "PENDING" | "PAID" | "FAILED" | "EXPIRED",
 *   amount: number,
 *   txHash: string | null,
 *   paidAt: string | null
 * }
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const bill = await prisma.bill.findUnique({
      where: { id },
      include: { merchant: { select: { walletAddress: true, name: true } } },
    });

    if (!bill) {
      return errorResponse('NOT_FOUND', `Bill '${id}' not found`, 404);
    }

    return successResponse({
      id: bill.id,
      status: bill.status,
      amount: bill.amount,
      merchantAddress: bill.merchant.walletAddress,
      merchantName: bill.merchant.name,
      txHash: bill.txHash,
      paidAt: bill.paidAt?.toISOString() ?? null,
      createdAt: bill.createdAt.toISOString(),
    });
  } catch (err) {
    console.error('[bill/[id]] Error:', err);
    return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred', 500);
  }
}
