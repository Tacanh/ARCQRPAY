'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, ExternalLink, ArrowLeft, Zap } from 'lucide-react';

function SuccessContent() {
  const router = useRouter();
  const params = useSearchParams();
  const txHash = params.get('txHash') ?? '';
  const billId = params.get('billId') ?? '';

  // Haptic feedback on mount
  useEffect(() => {
    if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200]);
  }, []);

  const shortHash = txHash ? `${txHash.slice(0, 10)}…${txHash.slice(-8)}` : '—';
  const explorerUrl = txHash
    ? `https://testnet.arcscan.app/tx/${txHash}`
    : null;

  return (
    <div className="min-h-screen bg-zinc-950 bg-grid-dots flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm flex flex-col items-center gap-6 animate-in fade-in zoom-in-95 duration-500">
        {/* Success icon */}
        <div className="relative">
          <div className="w-28 h-28 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <CheckCircle2 className="w-14 h-14 text-emerald-400" strokeWidth={1.5} />
          </div>
          {/* Pulse rings */}
          <span className="absolute inset-0 rounded-full border border-emerald-500/20 animate-ping" />
        </div>

        {/* Title */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">Payment Sent!</h1>
          <p className="text-zinc-400 text-sm mt-2">
            Your USDC has been transferred on Arc Testnet
          </p>
        </div>

        {/* Transaction card */}
        <div className="w-full rounded-3xl bg-zinc-900 border border-zinc-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-800 flex items-center gap-2">
            <Zap className="w-4 h-4 text-arc-cyan" />
            <span className="text-zinc-300 text-sm font-medium">Transaction Details</span>
          </div>
          <div className="divide-y divide-zinc-800">
            <SuccessRow label="Status" value="Confirmed" valueColor="text-emerald-400" />
            {billId && <SuccessRow label="Bill ID" value={billId.slice(0, 13) + '…'} />}
            <SuccessRow label="Tx Hash" value={shortHash} />
            <SuccessRow label="Network" value="Arc Testnet" />
          </div>
        </div>

        {/* Explorer link */}
        {explorerUrl && (
          <a
            id="success-explorer-link"
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-arc-cyan text-sm font-medium hover:text-arc-cyan/80 transition-colors"
          >
            View on ArcScan <ExternalLink className="w-4 h-4" />
          </a>
        )}

        {/* Actions */}
        <div className="w-full flex flex-col gap-3">
          <button
            id="success-scan-again-btn"
            onClick={() => router.push('/wallet')}
            className="w-full py-4 rounded-2xl bg-arc-cyan text-black font-bold text-sm hover:bg-arc-cyan/90 active:scale-[0.98] transition-all shadow-lg shadow-arc-cyan/25"
          >
            Scan Another QR
          </button>
          <button
            id="success-back-btn"
            onClick={() => router.push('/wallet')}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm hover:bg-zinc-800 active:scale-[0.98] transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Wallet
          </button>
        </div>

        <p className="text-zinc-600 text-xs text-center">
          The merchant's POS has been notified in real-time.
        </p>
      </div>
    </div>
  );
}

function SuccessRow({
  label,
  value,
  valueColor = 'text-zinc-300',
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5">
      <span className="text-zinc-500 text-sm">{label}</span>
      <span className={`text-sm font-medium font-mono ${valueColor}`}>{value}</span>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-arc-cyan/30 border-t-arc-cyan animate-spin" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
