'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { formatUnits } from 'viem';
import { ArrowLeft, ExternalLink, Loader2, History, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { USDC_CONTRACT_ADDRESS, USDC_DECIMALS } from '@/lib/arc-chain';
import { format } from 'date-fns';

interface TokenTx {
  hash: string;
  from: string;
  to: string;
  value: string;
  timeStamp: string;
  tokenSymbol: string;
}

export default function WalletActivityPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();

  const [mounted, setMounted] = useState(false);
  const [transactions, setTransactions] = useState<TokenTx[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect if not connected
  useEffect(() => {
    if (mounted && !isConnected) {
      router.push('/wallet');
    }
  }, [isConnected, mounted, router]);

  useEffect(() => {
    if (!address) return;

    async function fetchActivity() {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch ERC20 Token Transfers for USDC
        const url = `https://testnet.arcscan.app/api?module=account&action=tokentx&contractaddress=${USDC_CONTRACT_ADDRESS}&address=${address}&sort=desc`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.status === "1" && data.result) {
          setTransactions(data.result);
        } else {
          // It might return status "0" with "No transactions found" which is fine.
          if (data.message && data.message.includes("No")) {
             setTransactions([]);
          } else {
             throw new Error(data.message || "Failed to fetch transactions");
          }
        }
      } catch (err: any) {
        console.error("Fetch activity error:", err);
        setError(err.message || "Network error");
      } finally {
        setIsLoading(false);
      }
    }

    fetchActivity();
  }, [address]);

  if (!mounted || !isConnected) return null;

  return (
    <div className="min-h-screen bg-zinc-950 bg-grid-dots flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between px-5 h-16 bg-zinc-950/90 backdrop-blur border-b border-white/5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/wallet')}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-800 hover:bg-zinc-700 active:scale-95 transition-all"
            aria-label="Back"
          >
            <ArrowLeft className="w-4 h-4 text-zinc-300" />
          </button>
          <span className="font-semibold text-white text-base">Payment History</span>
        </div>
      </header>

      <main className="flex-1 px-5 py-6 flex flex-col gap-4 max-w-md mx-auto w-full">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-8 h-8 text-arc-cyan animate-spin" />
            <p className="text-zinc-500 text-sm animate-pulse">Loading activity...</p>
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
               <History className="w-8 h-8 text-red-400" />
            </div>
            <div>
              <h3 className="text-white font-medium mb-1">Failed to load history</h3>
              <p className="text-zinc-500 text-sm">{error}</p>
            </div>
          </div>
        ) : transactions.length === 0 ? (
           <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
               <History className="w-8 h-8 text-zinc-500" />
            </div>
            <div>
              <h3 className="text-white font-medium mb-1">No Activity Yet</h3>
              <p className="text-zinc-500 text-sm">Your USDC transactions will appear here.</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 pb-8">
            {transactions.map((tx) => {
              const isReceive = tx.to.toLowerCase() === address?.toLowerCase();
              const amountFormatted = Number(formatUnits(BigInt(tx.value), USDC_DECIMALS)).toFixed(2);
              const txDate = new Date(parseInt(tx.timeStamp) * 1000);

              return (
                <a 
                  key={tx.hash}
                  href={`https://testnet.arcscan.app/tx/${tx.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${
                      isReceive 
                        ? 'bg-emerald-500/10 border-emerald-500/20' 
                        : 'bg-zinc-800 border-zinc-700'
                    }`}>
                      {isReceive ? (
                        <ArrowDownLeft className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5 text-zinc-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">
                        {isReceive ? 'Received' : 'Sent'} USDC
                      </p>
                      <p className="text-zinc-500 text-xs mt-0.5">
                        {format(txDate, "MMM d, h:mm a")}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1">
                    <p className={`font-semibold tabular-nums ${
                      isReceive ? 'text-emerald-400' : 'text-white'
                    }`}>
                      {isReceive ? '+' : '-'}{amountFormatted}
                    </p>
                    <ExternalLink className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
