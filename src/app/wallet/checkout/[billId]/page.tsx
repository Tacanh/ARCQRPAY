'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { formatUnits } from 'viem';
import {
  arcPublicClient,
  arcTestnet,
  USDC_CONTRACT_ADDRESS,
  USDC_DECIMALS,
  ERC20_ABI,
} from '@/lib/arc-chain';
import { useArcPay } from '@/hooks/useArcPay';
import {
  ArrowLeft,
  ShieldCheck,
  Zap,
  AlertCircle,
  Loader2,
  ChevronRight,
  GitMerge,
} from 'lucide-react';

interface BillData {
  id: string;
  status: string;
  amount: number;
  merchantAddress: string;
  merchantName: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  idle: { label: 'Ready', color: 'text-zinc-400' },
  preparing: { label: 'Preparing…', color: 'text-zinc-300' },
  signing: { label: 'Awaiting signature…', color: 'text-arc-cyan' },
  broadcasting: { label: 'Broadcasting…', color: 'text-arc-cyan' },
  confirming: { label: 'Confirming on-chain…', color: 'text-amber-400' },
  success: { label: 'Payment complete!', color: 'text-emerald-400' },
  error: { label: 'Payment failed', color: 'text-red-400' },
};

export default function CheckoutPage({
  params,
}: {
  params: Promise<{ billId: string }>;
}) {
  const { billId } = use(params);
  const router = useRouter();
  
  // Prevent hydration mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Use Wagmi instead of Dynamic
  const { isConnected, address, chainId: currentChainId } = useAccount();

  const [bill, setBill] = useState<BillData | null>(null);
  const [billLoading, setBillLoading] = useState(true);
  const [billError, setBillError] = useState<string | null>(null);

  const [userBalance, setUserBalance] = useState<bigint | null>(null);

  // ── Fetch bill data ────────────────────────────────────────────────────
  useEffect(() => {
    if (!billId) return;
    setBillLoading(true);
    fetch(`/api/bill/${billId}`)
      .then(async (r) => {
        const json = await r.json();
        if (r.ok) {
          setBill(json);
        } else {
          setBillError(json.message ?? 'Failed to load bill.');
        }
      })
      .catch(() => setBillError('Network error. Could not load bill.'))
      .finally(() => setBillLoading(false));
  }, [billId]);

  // ── Fetch wallet chain + balance ────────────────────────────────────────
  const fetchWalletInfo = useCallback(async () => {
    if (!address) return;
    try {
      const raw = await arcPublicClient.readContract({
        address: USDC_CONTRACT_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [address],
      });
      setUserBalance(raw as bigint);
    } catch {
      // non-fatal
    }
  }, [address]);

  useEffect(() => {
    if (isConnected) fetchWalletInfo();
  }, [isConnected, fetchWalletInfo]);

  // ── Payment hook ──────────────────────────────────────────────────────
  const { pay, status, error: payError, result } = useArcPay({
    merchantAddress: bill?.merchantAddress ?? '',
    amount: bill ? String(bill.amount) : '0',
    billId,
  });

  // Redirect on success
  useEffect(() => {
    if (status === 'success' && result) {
      router.push(`/wallet/success?billId=${billId}&txHash=${result.txHash}`);
    }
  }, [status, result, billId, router]);

  // ── Redirect if not logged in ──────────────────────────────────────────
  useEffect(() => {
    if (!isConnected) router.push('/wallet');
  }, [isConnected, router]);

  const isOnArc = currentChainId === arcTestnet.id;
  const isLoading = ['preparing', 'signing', 'broadcasting', 'confirming'].includes(status);
  const amountRaw = bill ? BigInt(Math.round(bill.amount * 10 ** USDC_DECIMALS)) : BigInt(0);
  const hasSufficientBalance =
    userBalance !== null && userBalance >= amountRaw;

  // ── SSR / Hydration guard ────────────────────────────────────────────────
  if (!mounted) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-arc-cyan animate-spin" />
          <p className="text-zinc-400 text-sm">Initializing wallet…</p>
        </div>
      </div>
    );
  }

  // ── Loading skeleton ──────────────────────────────────────────────────
  if (billLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-arc-cyan animate-spin" />
          <p className="text-zinc-400 text-sm">Loading payment details…</p>
        </div>
      </div>
    );
  }

  if (billError || !bill) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-6 gap-4">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <p className="text-white font-semibold text-lg">Bill Not Found</p>
        <p className="text-zinc-400 text-sm text-center">{billError}</p>
        <button
          onClick={() => router.push('/wallet')}
          className="mt-2 px-5 py-2.5 rounded-2xl bg-zinc-800 text-white text-sm hover:bg-zinc-700 transition"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (bill.status === 'PAID') {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-6 gap-4">
        <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
          <ShieldCheck className="w-10 h-10 text-emerald-400" />
        </div>
        <p className="text-white font-semibold text-xl">Already Paid</p>
        <p className="text-zinc-400 text-sm text-center">
          This bill has already been settled.
        </p>
        <button
          onClick={() => router.push('/wallet')}
          className="mt-2 px-5 py-2.5 rounded-2xl bg-zinc-800 text-white text-sm hover:bg-zinc-700 transition"
        >
          Return to Wallet
        </button>
      </div>
    );
  }

  const { label: statusLabel, color: statusColor } = STATUS_LABELS[status] ?? STATUS_LABELS.idle;

  return (
    <div className="min-h-screen bg-zinc-950 bg-grid-dots flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 px-5 h-16 border-b border-white/5 bg-zinc-950/90 backdrop-blur">
        <button
          id="checkout-back-btn"
          onClick={() => router.push('/wallet')}
          disabled={isLoading}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-800 hover:bg-zinc-700 active:scale-95 transition-all disabled:opacity-40"
          aria-label="Back"
        >
          <ArrowLeft className="w-4 h-4 text-zinc-300" />
        </button>
        <h1 className="font-semibold text-white text-base">Confirm Payment</h1>
      </header>

      <main className="flex-1 px-5 py-6 flex flex-col gap-4 max-w-md mx-auto w-full">
        {/* Merchant + Amount card */}
        <div className="rounded-3xl bg-zinc-900 border border-zinc-800 overflow-hidden">
          {/* Top section */}
          <div className="px-6 pt-6 pb-5 border-b border-zinc-800 flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-2xl bg-arc-cyan/10 border border-arc-cyan/20 flex items-center justify-center mb-1">
              <Zap className="w-7 h-7 text-arc-cyan" />
            </div>
            <p className="text-zinc-400 text-sm">{bill.merchantName}</p>
            <div className="flex items-end gap-1">
              <span className="text-5xl font-bold text-white tabular-nums">
                {Number(bill.amount).toFixed(2)}
              </span>
              <span className="text-zinc-400 text-lg mb-1.5 ml-1">USDC</span>
            </div>
          </div>

          {/* Details rows */}
          <div className="divide-y divide-zinc-800">
            <DetailRow label="Merchant Address" value={`${bill.merchantAddress.slice(0,8)}…${bill.merchantAddress.slice(-6)}`} />
            <DetailRow label="Bill ID" value={billId.slice(0, 13) + '…'} />
            <DetailRow
              label="Payment Method"
              value={
                isOnArc
                  ? 'Direct Pay (Arc Testnet)'
                  : 'Unified Balance (Cross-chain)'
              }
              badge={isOnArc ? null : <GitMerge className="w-3.5 h-3.5 text-arc-cyan" />}
            />
            {userBalance !== null && (
              <DetailRow
                label="Your USDC Balance"
                value={`${Number(formatUnits(userBalance, USDC_DECIMALS)).toFixed(2)} USDC`}
                valueColor={hasSufficientBalance ? 'text-emerald-400' : 'text-red-400'}
              />
            )}
          </div>
        </div>

        {/* Cross-chain info banner */}
        {!isOnArc && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-2xl bg-arc-cyan/5 border border-arc-cyan/15 text-zinc-300 text-sm">
            <GitMerge className="w-4 h-4 text-arc-cyan mt-0.5 shrink-0" />
            <p>
              Your wallet is on a different chain. Payment will be routed via{' '}
              <span className="text-arc-cyan font-medium">Circle Unified Balance</span>{' '}
              — no manual bridging needed.
            </p>
          </div>
        )}

        {/* Pay error */}
        {payError && (
          <div className="flex items-start gap-3 px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <p>{payError}</p>
          </div>
        )}

        {/* Status indicator */}
        {status !== 'idle' && (
          <div className={`text-center text-sm font-medium ${statusColor}`}>
            {isLoading && (
              <Loader2 className="inline w-4 h-4 mr-2 animate-spin" />
            )}
            {statusLabel}
          </div>
        )}

        {/* Pay button */}
        <div className="mt-auto pt-2">
          <button
            id="checkout-pay-btn"
            onClick={pay}
            disabled={isLoading || !hasSufficientBalance}
            className="w-full py-4 rounded-2xl bg-arc-cyan text-black font-bold text-base tracking-tight flex items-center justify-center gap-2 shadow-2xl shadow-arc-cyan/25 hover:bg-arc-cyan/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <ShieldCheck className="w-5 h-5" />
            )}
            {isLoading ? 'Processing ⚡️' : `Pay ⚡️ ${Number(bill.amount).toFixed(2)} USDC`}
            {!isLoading && <ChevronRight className="w-4 h-4 ml-auto" />}
          </button>

          {!hasSufficientBalance && userBalance !== null && (
            <p className="text-center text-red-400 text-xs mt-2">
              Insufficient USDC balance for this payment.
            </p>
          )}

          <p className="text-center text-zinc-600 text-xs mt-3">
            Secured by Circle App Kit · Arc Testnet
          </p>
        </div>
      </main>
    </div>
  );
}

function DetailRow({
  label,
  value,
  valueColor = 'text-zinc-300',
  badge,
}: {
  label: string;
  value: string;
  valueColor?: string;
  badge?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-6 py-3.5">
      <span className="text-zinc-500 text-sm">{label}</span>
      <div className="flex items-center gap-1.5">
        {badge}
        <span className={`text-sm font-medium ${valueColor} font-mono`}>{value}</span>
      </div>
    </div>
  );
}
