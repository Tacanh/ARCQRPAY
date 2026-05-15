'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useBillStore } from '@/store/useBillStore';
import { CheckCircle2 } from 'lucide-react';

export default function SuccessScreen() {
  const router = useRouter();
  const { currentAmount, billStatus, reset } = useBillStore();

  useEffect(() => {
    // Nếu vô tình vào trang này mà chưa thanh toán, quay về trang chủ
    if (billStatus !== 'PAID') {
      router.replace('/merchant');
      return;
    }

    // Play success sound
    // Using a base64 encoded simple beep as fallback since we don't have success.mp3 yet
    const audio = new Audio('data:audio/mp3;base64,//OExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq');
    audio.play().catch(e => console.log('Audio autoplay blocked', e));

  }, [billStatus, router]);

  const handleNewPayment = () => {
    reset();
    router.replace('/merchant');
  };

  if (billStatus !== 'PAID') return null;

  return (
    <div className="min-h-screen bg-green-50 flex flex-col items-center justify-center px-4 py-8">
      <div className="max-w-md w-full flex flex-col items-center text-center space-y-8 animate-in zoom-in-95 duration-500">
        
        <div className="w-32 h-32 bg-green-100 rounded-full flex items-center justify-center animate-bounce shadow-xl shadow-green-200">
          <CheckCircle2 size={80} className="text-green-600" />
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Payment Received</h1>
          <p className="text-xl text-gray-600">
            Successfully collected <span className="font-bold text-green-700">{currentAmount} USDC</span>
          </p>
        </div>

        <button
          onClick={handleNewPayment}
          className="w-full h-16 mt-8 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-xl font-medium rounded-2xl transition-colors shadow-lg shadow-green-200"
        >
          New Payment
        </button>
        
      </div>
    </div>
  );
}
