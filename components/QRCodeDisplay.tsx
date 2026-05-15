'use client';

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QRCodeDisplayProps {
  merchantAddress: string;
  amount: string;
  billId: string;
}

export function QRCodeDisplay({ merchantAddress, amount, billId }: QRCodeDisplayProps) {
  // Spec: arcpay://pay?merchant=[ADDRESS]&amount=[AMOUNT]&billId=[ID]
  const uri = `arcpay://pay?merchant=${merchantAddress}&amount=${amount}&billId=${billId}`;

  return (
    <div className="flex flex-col items-center justify-center space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-xl">
        <QRCodeSVG 
          value={uri} 
          size={280} 
          level="H"
          includeMargin={true}
          bgColor="#ffffff"
          fgColor="#0f172a" // slate-900
        />
      </div>
      
      <div className="text-center space-y-2">
        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Please scan to pay</p>
        <p className="text-4xl font-bold text-slate-900">{amount} USDC</p>
      </div>

      <div className="text-xs text-gray-400 font-mono break-all px-8 text-center max-w-sm">
        Bill ID: {billId.split('-')[0]}...
      </div>
    </div>
  );
}
