import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { errorResponse, successResponse } from '@/lib/api-response';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: merchantId } = await params;

  try {
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
    });

    if (!merchant) {
      return errorResponse('NOT_FOUND', 'Merchant not found', 404);
    }

    const transactions = await prisma.bill.findMany({
      where: { merchantId },
      orderBy: { createdAt: 'desc' },
      take: 100, // For MVP, just return the last 100
    });

    return successResponse({
      transactions: transactions.map((tx: any) => ({
        id: tx.id.substring(0, 8).toUpperCase(),
        fullId: tx.id,
        amount: tx.amount,
        status: tx.status,
        time: tx.paidAt || tx.createdAt,
        txHash: tx.txHash,
        method: tx.txHash ? 'On-chain' : 'Pending',
      })),
    });
  } catch (err) {
    console.error(`[merchant/${merchantId}/transactions] Error:`, err);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch transactions', 500);
  }
}
