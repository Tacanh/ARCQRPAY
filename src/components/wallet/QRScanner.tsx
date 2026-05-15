'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { NotFoundException } from '@zxing/library';
import type { IScannerControls } from '@zxing/browser';
import { Camera, X, Upload, Zap, AlertCircle } from 'lucide-react';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

type ScannerState = 'initializing' | 'scanning' | 'error';

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [state, setState] = useState<ScannerState>('initializing');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const stopScanner = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.stop();
      controlsRef.current = null;
    }
  }, []);

  const handleClose = useCallback(() => {
    stopScanner();
    onClose();
  }, [stopScanner, onClose]);

  const handleScan = useCallback(
    (data: string) => {
      stopScanner();
      if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
      onScan(data);
    },
    [stopScanner, onScan]
  );

  useEffect(() => {
    let mounted = true;

    const startScanner = async () => {
      if (!videoRef.current) return;

      const reader = new BrowserMultiFormatReader();

      try {
        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        const backCamera =
          devices.find(
            (d) =>
              d.label.toLowerCase().includes('back') ||
              d.label.toLowerCase().includes('rear') ||
              d.label.toLowerCase().includes('environment')
          ) ?? devices[0];

        if (!backCamera) throw new Error('No camera found on this device.');

        const controls = await reader.decodeFromVideoDevice(
          backCamera.deviceId,
          videoRef.current,
          (result, err) => {
            if (!mounted) return;
            if (result) {
              handleScan(result.getText());
            }
            if (err && !(err instanceof NotFoundException)) {
              console.warn('[QRScanner] decode error:', err);
            }
          }
        );

        controlsRef.current = controls;
        if (mounted) setState('scanning');
      } catch (err: unknown) {
        if (!mounted) return;
        const msg =
          err instanceof Error
            ? err.message.includes('Permission') || err.message.includes('denied')
              ? 'Camera permission denied. Please allow camera access and retry.'
              : err.message
            : 'Could not access camera.';
        setErrorMsg(msg);
        setState('error');
      }
    };

    startScanner();

    return () => {
      mounted = false;
      stopScanner();
    };
  }, [handleScan, stopScanner]);

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        const reader = new BrowserMultiFormatReader();
        const url = URL.createObjectURL(file);
        const result = await reader.decodeFromImageUrl(url);
        URL.revokeObjectURL(url);
        handleScan(result.getText());
      } catch {
        setErrorMsg('Could not decode QR code from image. Try a clearer photo.');
        setState('error');
      }
    },
    [handleScan]
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-12 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-arc-cyan/20 border border-arc-cyan/30 flex items-center justify-center">
            <Zap className="w-4 h-4 text-arc-cyan" />
          </div>
          <span className="text-white font-semibold text-base tracking-tight">Scan &amp; Pay</span>
        </div>
        <button
          id="scanner-close-btn"
          onClick={handleClose}
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center transition-all"
          aria-label="Close scanner"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Viewfinder */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden">
        {/* Camera feed */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          muted
          autoPlay
        />

        {/* Dark overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-x-0 top-0 h-[30%] bg-black/60" />
          <div className="absolute inset-x-0 bottom-0 h-[30%] bg-black/60" />
          <div className="absolute inset-y-[30%] left-0 right-[calc(50%+110px)] bg-black/60" />
          <div className="absolute inset-y-[30%] left-[calc(50%+110px)] right-0 bg-black/60" />
        </div>

        {/* Scan frame */}
        <div className="relative w-[220px] h-[220px]">
          {/* Corner brackets */}
          <span className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-arc-cyan rounded-tl-lg" />
          <span className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-arc-cyan rounded-tr-lg" />
          <span className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-arc-cyan rounded-bl-lg" />
          <span className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-arc-cyan rounded-br-lg" />

          {/* Animated scan line */}
          {state === 'scanning' && (
            <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-arc-cyan to-transparent animate-scan-line" />
          )}

          {/* Error overlay inside frame */}
          {state === 'error' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-xl p-4 text-center">
              <AlertCircle className="w-10 h-10 text-red-400 mb-2" />
              <p className="text-white text-xs leading-snug">{errorMsg}</p>
            </div>
          )}

          {/* Initializing overlay */}
          {state === 'initializing' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Camera className="w-10 h-10 text-arc-cyan animate-pulse" />
            </div>
          )}
        </div>

        {/* Status label */}
        <div className="absolute bottom-[32%] inset-x-0 flex justify-center pointer-events-none">
          <div className="px-4 py-2 rounded-full bg-black/70 border border-white/10 text-white/80 text-sm font-medium">
            {state === 'initializing' && 'Starting camera…'}
            {state === 'scanning' && 'Point camera at QR code'}
            {state === 'error' && 'Camera unavailable — use upload below'}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="z-10 px-6 pb-10 pt-4 bg-zinc-950 flex flex-col gap-3">
        <button
          id="scanner-upload-btn"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 active:scale-[0.98] transition-all text-white font-medium text-sm"
        >
          <Upload className="w-4 h-4" />
          Upload QR Image
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileUpload}
        />
        <p className="text-center text-zinc-500 text-xs">
          Compatible with arcpay:// payment links
        </p>
      </div>

      <style jsx global>{`
        @keyframes scan-line {
          0% { top: 4px; opacity: 1; }
          50% { opacity: 0.8; }
          100% { top: calc(100% - 4px); opacity: 1; }
        }
        .animate-scan-line {
          animation: scan-line 2s ease-in-out infinite alternate;
        }
      `}</style>
    </div>
  );
}
