'use client';

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ReceiptText, Loader2, Search, Filter, Download } from "lucide-react";
import { format } from "date-fns";

interface Transaction {
  id: string;
  fullId: string;
  amount: number;
  status: string;
  time: string;
  txHash: string | null;
  method: string;
}

export default function MerchantTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function fetchTransactions() {
      try {
        const stored = localStorage.getItem('arc_merchant');
        if (!stored) {
          setError("Merchant not initialized. Please go to POS.");
          setIsLoading(false);
          return;
        }

        const { id } = JSON.parse(stored);
        
        const res = await fetch(`/api/merchant/${id}/transactions`);
        if (!res.ok) throw new Error("Failed to fetch transactions");

        const data = await res.json();
        setTransactions(data.transactions);
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTransactions();
  }, []);

  const handleExportCSV = () => {
    if (transactions.length === 0) return;

    const headers = ["Transaction ID", "Full ID", "Date", "Time", "Status", "Method", "Amount"];
    const csvRows = [
      headers.join(','),
      ...transactions.map(tx => {
        const date = new Date(tx.time);
        return [
          tx.id,
          tx.fullId,
          format(date, "yyyy-MM-dd"),
          format(date, "HH:mm:ss"),
          tx.status,
          tx.method,
          tx.amount.toFixed(2)
        ].join(',');
      })
    ];

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `transactions_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredTransactions = transactions.filter(tx => 
    tx.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    tx.amount.toString().includes(searchTerm)
  );

  if (isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="text-zinc-500 animate-pulse">Loading transaction history...</p>
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
          <h2 className="text-2xl font-bold">Transaction History</h2>
          <p className="text-zinc-500 dark:text-zinc-400">View and manage all your store transactions.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleExportCSV}
            disabled={transactions.length === 0}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-sm font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm flex flex-col">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="relative max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Search by ID or amount..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
        </div>

        <div className="overflow-x-auto flex-1">
          {filteredTransactions.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-950/50 text-sm text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
                  <th className="p-4 font-medium">Transaction ID</th>
                  <th className="p-4 font-medium">Date & Time</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Method</th>
                  <th className="p-4 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-sm">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.fullId} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="p-4 font-medium text-zinc-900 dark:text-zinc-100">{tx.id}</td>
                    <td className="p-4 text-zinc-500 dark:text-zinc-400">
                      {format(new Date(tx.time), "MMM d, yyyy h:mm a")}
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
            <div className="p-16 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 mb-4">
                <ReceiptText className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">No transactions found</h3>
              <p className="text-zinc-500 mt-1">When customers pay you, their transactions will appear here.</p>
              <Link href="/merchant/pos" className="text-blue-600 hover:underline mt-4 inline-block font-medium">
                Open Point of Sale
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
