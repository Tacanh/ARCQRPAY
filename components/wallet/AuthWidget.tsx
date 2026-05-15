'use client';

import { useConnect } from 'wagmi';

export default function AuthWidget({ className }: { className?: string }) {
  const { connectors, connect, isPending } = useConnect();

  return (
    <div className={className}>
      {connectors.map((connector) => (
        <button
          key={connector.uid}
          onClick={() => connect({ connector })}
          disabled={isPending}
          className="flex w-full justify-center items-center gap-2 px-5 py-4 mb-2 rounded-2xl bg-arc-cyan text-black font-semibold text-sm tracking-tight hover:bg-arc-cyan/90 active:scale-95 transition-all shadow-lg shadow-arc-cyan/25 disabled:opacity-50"
        >
          {isPending ? 'Connecting...' : `Connect ${connector.name}`}
        </button>
      ))}
    </div>
  );
}
