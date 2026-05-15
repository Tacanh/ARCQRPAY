'use client';

import dynamic from 'next/dynamic';
import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useDisconnect, useReadContract } from 'wagmi';
import { arcTestnet, USDC_CONTRACT_ADDRESS, USDC_DECIMALS, ERC20_ABI } from '@/lib/arc-chain';
import { formatUnits } from 'viem';
import Link from 'next/link';
import { ScanLine, Wallet, LogOut, Copy, ExternalLink, CheckCircle2, Zap, Loader2, History } from 'lucide-react';
import AuthWidget from '@/components/wallet/AuthWidget';

// Lazy-load QRScanner to avoid SSR issues with camera APIs
const QRScanner = dynamic(() => import('@/components/wallet/QRScanner'), { ssr: false });

const ARC_QR_SCHEME = 'arcpay://pay';

function parseArcPayURL(url: string) {
  try {
    // Extract query part from deep link or full URL
    const queryPart = url.includes('?') ? url.split('?')[1] : url;
    console.log('queryPart', queryPart);
    const params = new URLSearchParams(queryPart);

    const merchant = params.get('merchant');
    const amount = params.get('amount');
    const billId = params.get('billId');

    if (!merchant || !amount || !billId) return null;
    return { merchant, amount, billId };
  } catch {
    return null;
  }
}

export default function WalletPage() {
  const router = useRouter();

  // Prevent hydration mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Wagmi Hooks
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();

  const [showScanner, setShowScanner] = useState(false);
  const [copied, setCopied] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  const shortAddress = address
    ? `${address.slice(0, 6)}…${address.slice(-4)}`
    : null;

  // Fetch balance using wagmi
  const { data: rawBalance, isLoading: balanceLoading, refetch: fetchBalance } = useReadContract({
    address: USDC_CONTRACT_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && mounted,
    }
  });

  const usdcBalance = rawBalance ? formatUnits(rawBalance as bigint, USDC_DECIMALS) : null;

  const handleCopyAddress = useCallback(async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }, [address]);

  const handleScan = useCallback(
    (data: string) => {
      setScanError(null);
      setShowScanner(false);

      const parsed = parseArcPayURL(data);
      if (!parsed) {
        setScanError('Invalid QR code. Expected an arcpay:// payment link.');
        return;
      }
      router.push(`/wallet/checkout/${parsed.billId}`);
    },
    [router]
  );

  // ── SSR / Hydration guard ────────────────────────────────────────────────
  if (!mounted) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-arc-cyan animate-spin" />
      </div>
    );
  }

  // ── Not logged in — show landing ──────────────────────────────────────────
  if (!isConnected) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 bg-mesh-gradient bg-grid-dots px-6">
        <div className="w-full max-w-sm flex flex-col items-center gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Logo mark */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-arc-cyan/30 to-arc-cyan/5 border border-arc-cyan/30 flex items-center justify-center shadow-2xl shadow-arc-cyan/10">
              <Zap className="w-10 h-10 text-arc-cyan" />
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-bold tracking-tight text-white">ArcPay</h1>
              <p className="text-zinc-400 text-sm mt-1">Instant USDC payments on Arc</p>
            </div>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 justify-center">
            {['Self-Custodial', 'MetaMask', 'Cross-chain'].map((f) => (
              <span
                key={f}
                className="px-3 py-1 rounded-full text-xs font-medium bg-zinc-800/80 text-zinc-300 border border-zinc-700/60"
              >
                {f}
              </span>
            ))}
          </div>

          {/* Auth button */}
          <AuthWidget className="w-full flex flex-col items-center gap-2" />

          <p className="text-zinc-600 text-xs text-center leading-relaxed mt-2">
            By continuing you agree to the Arc Network terms of service.
          </p>
        </div>
      </div>
    );
  }

  // ── Logged in — Wallet Dashboard ─────────────────────────────────────────
  return (
    <>
      {showScanner && (
        <QRScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
      )}

      <div className="min-h-screen flex flex-col bg-zinc-950 bg-grid-dots">
        {/* Header */}
        <header className="sticky top-0 z-20 flex items-center justify-between px-5 h-16 bg-zinc-950/90 backdrop-blur border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-arc-cyan/20 border border-arc-cyan/30 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-arc-cyan" />
            </div>
            <span className="font-bold text-white text-base tracking-tight">ArcPay</span>
          </div>
          <button
            id="wallet-logout-btn"
            onClick={() => disconnect()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-zinc-400 hover:text-red-400 hover:bg-red-500/10 text-sm transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Disconnect</span>
          </button>
        </header>

        <main className="flex-1 px-5 py-6 flex flex-col gap-5 max-w-md mx-auto w-full">
          {/* Balance card */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-arc-cyan/10 via-zinc-900 to-zinc-900 border border-arc-cyan/20 p-6 shadow-2xl shadow-arc-cyan/5">
            {/* Decorative glow */}
            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-arc-cyan/10 blur-2xl" />

            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-zinc-400" />
                  <span className="text-zinc-400 text-sm font-medium">My Wallet</span>
                </div>
                <button
                  id="wallet-refresh-btn"
                  onClick={() => fetchBalance()}
                  disabled={balanceLoading}
                  className="text-xs text-arc-cyan/70 hover:text-arc-cyan transition-colors disabled:opacity-50"
                >
                  {balanceLoading ? 'Loading…' : 'Refresh'}
                </button>
              </div>

              {/* Balance */}
              <div className="mb-5">
                <p className="text-zinc-500 text-xs mb-1 uppercase tracking-widest">USDC Balance</p>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-bold text-white tabular-nums">
                    {usdcBalance === null ? '—' : Number(usdcBalance).toFixed(2)}
                  </span>
                  <span className="text-zinc-400 text-sm mb-1.5 ml-1">USDC</span>
                </div>
              </div>

              {/* Address */}
              {shortAddress && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-3 py-2 rounded-xl bg-zinc-800/60 border border-zinc-700/40">
                    <p className="text-zinc-300 text-xs font-mono truncate">{shortAddress}</p>
                  </div>
                  <button
                    id="wallet-copy-address-btn"
                    onClick={handleCopyAddress}
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-800/60 border border-zinc-700/40 hover:border-arc-cyan/40 hover:bg-arc-cyan/10 transition-all"
                    aria-label="Copy address"
                  >
                    {copied ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-zinc-400" />
                    )}
                  </button>
                  <Link
                    href="/wallet/activity"
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-800/60 border border-zinc-700/40 hover:border-arc-cyan/40 hover:bg-arc-cyan/10 transition-all"
                    aria-label="View Activity"
                  >
                    <History className="w-4 h-4 text-zinc-400" />
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Scan error */}
          {scanError && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <span className="mt-0.5">⚠️</span>
              <span>{scanError}</span>
            </div>
          )}

          {/* Scan CTA */}
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-6">
            <button
              id="wallet-scan-btn"
              onClick={() => {
                setScanError(null);
                setShowScanner(true);
              }}
              className="w-36 h-36 rounded-3xl bg-gradient-to-br from-arc-cyan to-arc-cyan-dark flex flex-col items-center justify-center gap-3 shadow-2xl shadow-arc-cyan/30 hover:shadow-arc-cyan/50 active:scale-95 transition-all duration-200"
            >
              <ScanLine className="w-12 h-12 text-black" strokeWidth={1.5} />
              <span className="text-black font-bold text-sm tracking-wide">SCAN &amp; PAY</span>
            </button>
            <p className="text-zinc-500 text-sm text-center max-w-xs leading-relaxed">
              Point your camera at a merchant's QR code to pay with USDC on Arc Testnet
            </p>
          </div>

          {/* Network badge */}
          <div className="flex justify-center pb-4">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-500 text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Arc Testnet
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
