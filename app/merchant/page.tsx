'use client';

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, DollarSign, ReceiptText, Store, TrendingUp, Users, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface Stats {
  totalRevenueToday: number;
  transactionsToday: number;
  averageOrderValueToday: number;
  totalRevenueAllTime: number;
  trends: {
    revenue: number;
    transactions: number;
    averageOrderValue: number;
  };
}

interface Transaction {
  id: string;
  fullId: string;
  amount: number;
  status: string;
  time: string;
  txHash: string | null;
  method: string;
}

export default function MerchantDashboard() {
  const [merchantName, setMerchantName] = useState("Store");
  const [stats, setStats] = useState<Stats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const stored = localStorage.getItem('arc_merchant');
        if (!stored) {
          setError("Merchant not initialized. Please go to POS.");
          setIsLoading(false);
          return;
        }

        const { id } = JSON.parse(stored);
        
        const res = await fetch(`/api/merchant/${id}/stats`);
        if (!res.ok) throw new Error("Failed to fetch dashboard data");

        const data = await res.json();
        setMerchantName(data.merchantName);
        setStats(data.stats);
        setTransactions(data.recentTransactions);
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  const formatTrend = (value: number | undefined) => {
    if (value === undefined) return "Live";
    const prefix = value > 0 ? "+" : "";
    return `${prefix}${value.toFixed(1)}%`;
  };

  if (isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-zinc-500 animate-pulse">Loading dashboard insights...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-4">
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-6 rounded-2xl max-w-md">
          <p className="font-bold text-lg mb-2">Something went wrong</p>
          <p className="mb-6">{error}</p>
          {error.includes("not initialized") && (
            <Link 
              href="/merchant/pos" 
              className="px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
            >
              Go to POS to Setup
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Dashboard Overview</h2>
          <p className="text-zinc-500 dark:text-zinc-400">Welcome back, {merchantName}.</p>
        </div>
        <Link 
          href="/merchant/pos" 
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors shadow-lg shadow-blue-500/20"
        >
          <Store className="w-5 h-5" />
          Launch POS Terminal
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Revenue (Today)" 
          value={`$${stats?.totalRevenueToday.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
          trend={formatTrend(stats?.trends?.revenue)} 
          trendUp={(stats?.trends?.revenue || 0) >= 0} 
          icon={<DollarSign className="w-6 h-6 text-emerald-500" />} 
        />
        <StatCard 
          title="Transactions (Today)" 
          value={stats?.transactionsToday.toString() || "0"} 
          trend={formatTrend(stats?.trends?.transactions)} 
          trendUp={(stats?.trends?.transactions || 0) >= 0} 
          icon={<ReceiptText className="w-6 h-6 text-blue-500" />} 
        />
        <StatCard 
          title="Avg Order Value" 
          value={`$${stats?.averageOrderValueToday.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
          trend={formatTrend(stats?.trends?.averageOrderValue)} 
          trendUp={(stats?.trends?.averageOrderValue || 0) >= 0} 
          icon={<TrendingUp className="w-6 h-6 text-purple-500" />} 
        />
        <StatCard 
          title="All-Time Revenue" 
          value={`$${stats?.totalRevenueAllTime.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
          trend="Total" 
          trendUp={true} 
          icon={<Users className="w-6 h-6 text-amber-500" />} 
        />
      </div>

      {/* Recent Transactions */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <h3 className="font-semibold text-lg">Recent Transactions</h3>
          <Link href="/merchant/transactions" className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
            View All <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          {transactions.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-950/50 text-sm text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
                  <th className="p-4 font-medium">Transaction ID</th>
                  <th className="p-4 font-medium">Date/Time</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Method</th>
                  <th className="p-4 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-sm">
                {transactions.map((tx, i) => (
                  <tr key={tx.fullId} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="p-4 font-medium text-zinc-900 dark:text-zinc-100">{tx.id}</td>
                    <td className="p-4 text-zinc-500 dark:text-zinc-400">
                      {format(new Date(tx.time), "MMM d, h:mm a")}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        tx.status === 'PAID' 
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : tx.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="p-4 text-zinc-500 dark:text-zinc-400">{tx.method}</td>
                    <td className="p-4 text-right font-semibold text-zinc-900 dark:text-zinc-100">
                      ${tx.amount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 mb-4">
                <ReceiptText className="w-8 h-8" />
              </div>
              <p className="text-zinc-500">No transactions yet.</p>
              <Link href="/merchant/pos" className="text-blue-600 hover:underline mt-2 inline-block">
                Start your first transaction in POS
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, trend, trendUp, icon }: { title: string, value: string, trend: string, trendUp: boolean, icon: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center">
          {icon}
        </div>
        <div className={`px-2.5 py-1 rounded-full text-xs font-medium ${
          trendUp 
            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' 
            : 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
        }`}>
          {trend}
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{value}</h3>
      </div>
    </div>
  );
}

