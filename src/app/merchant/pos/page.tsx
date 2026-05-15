'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBillStore } from '@/store/useBillStore';
import { Numpad } from '@/components/Numpad';
import { QRCodeDisplay } from '@/components/QRCodeDisplay';
import { getPusherClient } from '@/lib/pusher-client';

export default function MerchantPOS() {
  const router = useRouter();
  const { 
    currentAmount, 
    activeBillId, 
    billStatus, 
    merchantId,
    merchantAddress,
    setAmount, 
    appendNumber, 
    deleteNumber, 
    setBill, 
    updateStatus, 
    setMerchant,
    reset 
  } = useBillStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Khởi tạo Merchant nếu chưa có
  useEffect(() => {
    async function initMerchant() {
      try {
        const stored = localStorage.getItem('arc_merchant');
        if (stored) {
          const { id, walletAddress } = JSON.parse(stored);
          setMerchant(id, walletAddress);
          setIsLoading(false);
          return;
        }

        // Tạo Merchant mới qua API
        const res = await fetch('/api/merchant/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Arc Local Shop' }),
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create merchant');

        localStorage.setItem('arc_merchant', JSON.stringify(data));
        setMerchant(data.id, data.walletAddress);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    if (!merchantId) {
      initMerchant();
    } else {
      setIsLoading(false);
    }
  }, [merchantId, setMerchant]);

  // 2. Lắng nghe Webhook qua Pusher
  useEffect(() => {
    if (billStatus === 'PENDING' && merchantId) {
      const pusher = getPusherClient();
      const channelName = `merchant-${merchantId}`;
      const channel = pusher.subscribe(channelName);

      channel.bind('bill-paid', (data: { billId: string; txHash: string; amount: number }) => {
        if (data.billId === activeBillId) {
          updateStatus('PAID');
          // Chuyển sang màn hình thành công
          router.push('/merchant/success');
        }
      });

      return () => {
        channel.unbind('bill-paid');
        pusher.unsubscribe(channelName);
      };
    }
  }, [billStatus, merchantId, activeBillId, updateStatus, router]);

  const handleGenerateQR = async () => {
    if (!merchantId || parseFloat(currentAmount) <= 0) return;
    
    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch('/api/bill/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          merchantId, 
          amount: parseFloat(currentAmount) 
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate bill');

      setBill(data.id, 'PENDING');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCancel = () => {
    reset();
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-pulse text-xl text-gray-500">Initializing Store...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center px-4">
        <div className="bg-red-50 text-red-600 p-6 rounded-2xl max-w-md w-full text-center">
          <p className="font-semibold mb-2">Error</p>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-2 bg-red-600 text-white rounded-full hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center px-4 py-8">
      <div className="max-w-md w-full">
        {billStatus === 'IDLE' ? (
          <div className="space-y-8 animate-in fade-in zoom-in duration-300">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold text-gray-900">ArcQRPay</h1>
              <p className="text-gray-500">Enter amount to receive</p>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center justify-center h-32">
              <span className="text-5xl font-bold text-slate-800 tracking-tight">
                {currentAmount} <span className="text-2xl text-gray-400">USDC</span>
              </span>
            </div>

            <Numpad onKeyPress={appendNumber} onDelete={deleteNumber} />

            <button
              onClick={handleGenerateQR}
              disabled={parseFloat(currentAmount) <= 0 || isGenerating}
              className="w-full h-16 mt-8 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-xl font-medium rounded-2xl transition-colors shadow-lg shadow-blue-200"
            >
              {isGenerating ? 'Generating...' : 'Generate QR Code'}
            </button>
          </div>
        ) : (
          <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-500">
            <div className="flex justify-between items-center px-4">
              <h2 className="text-xl font-bold text-gray-900">Awaiting Payment</h2>
              <button 
                onClick={handleCancel}
                className="text-gray-500 hover:text-gray-800 font-medium"
              >
                Cancel
              </button>
            </div>

            {merchantAddress && activeBillId && (
              <QRCodeDisplay 
                merchantAddress={merchantAddress} 
                amount={currentAmount} 
                billId={activeBillId} 
              />
            )}

            <div className="text-center mt-12 animate-pulse text-blue-600 font-medium">
              Listening for network confirmation...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
