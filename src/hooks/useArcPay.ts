'use client';

import { useState, useCallback } from 'react';
import { parseUnits } from 'viem';
import { useAccount, useWalletClient } from 'wagmi';
import { AppKit, Blockchain } from '@circle-fin/app-kit';
import { createViemAdapterFromProvider } from '@circle-fin/adapter-viem-v2';
import {
  arcTestnet,
  USDC_CONTRACT_ADDRESS,
  USDC_DECIMALS,
  ERC20_ABI,
} from '@/lib/arc-chain';

export type PaymentStatus =
  | 'idle'
  | 'preparing'
  | 'signing'
  | 'broadcasting'
  | 'confirming'
  | 'success'
  | 'error';

export interface PaymentResult {
  txHash: string;
  billId: string;
}

export interface UseArcPayOptions {
  merchantAddress: string;
  amount: string; // decimal string, e.g. "12.50"
  billId: string;
}

export function useArcPay({ merchantAddress, amount, billId }: UseArcPayOptions) {
  const { address, isConnected, chainId, connector } = useAccount();
  const { data: walletClient } = useWalletClient();

  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PaymentResult | null>(null);

  const pay = useCallback(async (): Promise<PaymentResult | null> => {
    if (!isConnected || !address || !connector) {
      setError('No wallet connected');
      setStatus('error');
      return null;
    }

    setError(null);
    setStatus('preparing');

    try {
      console.log('[useArcPay] Starting payment flow...', { merchantAddress, amount, billId, currentChainId: chainId });
      
      // ── Step 1: Ensure we are on Arc Testnet ──────────────────────────────
      if (chainId !== arcTestnet.id) {
        setStatus('preparing');
        console.log(`[useArcPay] Switching chain from ${chainId} to ${arcTestnet.id}...`);
        
        if (!walletClient) throw new Error('Wallet client not ready');
        
        try {
          await walletClient.switchChain({ id: arcTestnet.id });
          console.log('[useArcPay] Chain switch successful');
        } catch (err: any) {
          console.error('[useArcPay] Chain switch error:', err);
          throw new Error('Please switch your wallet to Arc Testnet to continue.');
        }
        
        // Wait for wagmi and wallet to settle
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // ── Step 2: Initialize AppKit with fresh provider ───────────────────
      const provider = await connector.getProvider();
      const adapter = await createViemAdapterFromProvider({ provider: provider as any });
      const kit = new AppKit();

      setStatus('signing');
      console.log('[useArcPay] Requesting signature via AppKit...');

      const sendResult = await kit.send({
        from: { adapter, chain: Blockchain.Arc_Testnet },
        to: merchantAddress,
        amount,
        token: 'USDC',
      });

      console.log('[useArcPay] AppKit Send Result:', sendResult);

      if (!sendResult.txHash) {
        throw new Error('Transaction was not broadcasted. No hash received.');
      }

      // ── Step 3: Confirming ───────────────────────────────────────────────
      setStatus('confirming');
      console.log('[useArcPay] Transaction hash:', sendResult.txHash);

      // Optimistic sync with backend
      await fetch('/api/bill/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billId, txHash: sendResult.txHash }),
      });
      console.log('[useArcPay] Backend synced');

      const payResult: PaymentResult = { txHash: sendResult.txHash, billId };
      setResult(payResult);
      setStatus('success');
      return payResult;

    } catch (err: unknown) {
      console.error('[useArcPay] Payment Error:', err);
      const message = err instanceof Error ? err.message : 'Payment failed. Please check your wallet.';
      
      // Special check for user rejection
      if (message.toLowerCase().includes('user rejected') || message.toLowerCase().includes('user denied')) {
        setError('Transaction cancelled by user.');
      } else {
        setError(message);
      }
      
      setStatus('error');
      return null;
    }
  }, [isConnected, address, connector, chainId, walletClient, merchantAddress, amount, billId]);

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setResult(null);
  }, []);

  // Return isLoggedIn as an alias for isConnected to preserve backwards compat with the rest of the UI
  return { pay, status, error, result, reset, isLoggedIn: isConnected };
}
