import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { errorResponse, successResponse } from '@/lib/api-response';

/**
 * GET /api/merchant/[id]/stats
 * 
 * Fetches real-time statistics and recent transactions for a specific merchant.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: merchantId } = await params;

  try {
    // 1. Verify merchant exists
    const merchant = await prisma.merchant.findUnique({
      where: { id: merchantId },
    });

    if (!merchant) {
      return errorResponse('NOT_FOUND', 'Merchant not found', 404);
    }

    // 2. Define "Today" and "Yesterday" time ranges
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);

    // 3. Fetch Statistics
    const [
      totalRevenueToday,
      totalTransactionsToday,
      totalRevenueYesterday,
      totalTransactionsYesterday,
      recentTransactions,
      totalRevenueAllTime,
    ] = await Promise.all([
      // Total Revenue (Today)
      prisma.bill.aggregate({
        _sum: { amount: true },
        where: {
          merchantId,
          status: 'PAID',
          paidAt: { gte: startOfToday },
        },
      }),
      // Total Transactions (Today)
      prisma.bill.count({
        where: {
          merchantId,
          status: 'PAID',
          paidAt: { gte: startOfToday },
        },
      }),
      // Total Revenue (Yesterday)
      prisma.bill.aggregate({
        _sum: { amount: true },
        where: {
          merchantId,
          status: 'PAID',
          paidAt: { gte: startOfYesterday, lt: startOfToday },
        },
      }),
      // Total Transactions (Yesterday)
      prisma.bill.count({
        where: {
          merchantId,
          status: 'PAID',
          paidAt: { gte: startOfYesterday, lt: startOfToday },
        },
      }),
      // Recent Transactions (Last 10)
      prisma.bill.findMany({
        where: { merchantId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      // Total Revenue (All Time) for general stats
      prisma.bill.aggregate({
        _sum: { amount: true },
        where: {
          merchantId,
          status: 'PAID',
        },
      }),
    ]);

    const revenueToday = totalRevenueToday._sum.amount || 0;
    const revenueYesterday = totalRevenueYesterday._sum.amount || 0;
    const averageOrderValueToday = totalTransactionsToday > 0 
      ? revenueToday / totalTransactionsToday 
      : 0;
    const averageOrderValueYesterday = totalTransactionsYesterday > 0
      ? revenueYesterday / totalTransactionsYesterday
      : 0;

    // Helper to calculate percentage change
    const calcTrend = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    const revenueTrend = calcTrend(revenueToday, revenueYesterday);
    const transactionsTrend = calcTrend(totalTransactionsToday, totalTransactionsYesterday);
    const aovTrend = calcTrend(averageOrderValueToday, averageOrderValueYesterday);

    return successResponse({
      merchantName: merchant.name,
      stats: {
        totalRevenueToday: revenueToday,
        transactionsToday: totalTransactionsToday,
        averageOrderValueToday,
        totalRevenueAllTime: totalRevenueAllTime._sum.amount || 0,
        trends: {
          revenue: revenueTrend,
          transactions: transactionsTrend,
          averageOrderValue: aovTrend,
        }
      },
      recentTransactions: recentTransactions.map((tx: any) => ({
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
    console.error(`[merchant/${merchantId}/stats] Error:`, err);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch merchant statistics', 500);
  }
}
