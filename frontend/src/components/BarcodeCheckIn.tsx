'use client';

import { useState, useRef, useEffect } from 'react';
import { Scan, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';

interface CheckInData {
  success: boolean;
  message: string;
  tokenId?: string;
  queuePosition?: number;
  estimatedWaitTime?: number;
}

interface BarcodeCheckInProps {
  patientId: string;
  onCheckInSuccess?: (data: CheckInData) => void;
}

export function BarcodeCheckIn({ patientId, onCheckInSuccess }: BarcodeCheckInProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedCode, setScannedCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkInResult, setCheckInResult] = useState<CheckInData | null>(null);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isScanning) {
      inputRef.current?.focus();
    }
  }, [isScanning]);

  const handleBarcodeScan = async (code: string) => {
    setLoading(true);
    setError('');
    setCheckInResult(null);

    try {
      console.log('[v0] Processing barcode:', code);
      
      const response = await fetch('/api/queue/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          patientId,
          facilityBarcode: code
        })
      });

      const data = await response.json();

      if (response.ok) {
        setCheckInResult({
          success: true,
          message: 'Check-in successful! You are registered with the triage nurse.',
          ...data
        });
        onCheckInSuccess?.(data);
      } else {
        setError(data.message || 'Check-in failed. Please try again.');
        setCheckInResult({
          success: false,
          message: data.message || 'Check-in failed'
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network error';
      setError(message);
      setCheckInResult({
        success: false,
        message
      });
    } finally {
      setLoading(false);
      setScannedCode('');
      inputRef.current?.focus();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const code = e.target.value;
    setScannedCode(code);

    // Trigger scan on Enter or after barcode length
    if (code.length === 12 || code.endsWith('\n')) {
      handleBarcodeScan(code.replace('\n', ''));
    }
  };

  if (checkInResult && checkInResult.success) {
    return (
      <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-4">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 flex-shrink-0" />
          <div>
            <h3 className="font-bold text-emerald-300">Check-in Successful!</h3>
            <p className="text-sm text-emerald-200 mt-1">{checkInResult.message}</p>
          </div>
        </div>

        {checkInResult.queuePosition && (
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-emerald-500/30">
            <div className="p-3 rounded-lg bg-emerald-500/20">
              <p className="text-xs text-emerald-300 font-semibold mb-1">Queue Position</p>
              <p className="text-2xl font-bold text-emerald-400">{checkInResult.queuePosition}</p>
            </div>
            <div className="p-3 rounded-lg bg-emerald-500/20">
              <p className="text-xs text-emerald-300 font-semibold mb-1">Est. Wait Time</p>
              <p className="text-2xl font-bold text-emerald-400">
                {checkInResult.estimatedWaitTime}m
              </p>
            </div>
          </div>
        )}

        <button
          onClick={() => {
            setCheckInResult(null);
            setIsScanning(true);
          }}
          className="w-full px-4 py-2 text-sm font-bold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-all"
        >
          Scan Another Barcode
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!isScanning ? (
        <button
          onClick={() => setIsScanning(true)}
          className="w-full p-6 rounded-2xl border-2 border-dashed border-cyan-500/50 bg-cyan-500/5 hover:bg-cyan-500/10 transition-all flex flex-col items-center gap-3"
        >
          <Scan className="w-8 h-8 text-cyan-400" />
          <div className="text-center">
            <p className="font-bold text-white">Digital Check-in</p>
            <p className="text-xs text-slate-400 mt-1">Tap to scan facility barcode</p>
          </div>
        </button>
      ) : (
        <div className="p-6 rounded-2xl bg-slate-800/50 border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Scan className="w-5 h-5 text-cyan-400" />
              Ready to Scan
            </h3>
            <button
              onClick={() => setIsScanning(false)}
              className="p-1 hover:bg-slate-700 rounded"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          <input
            ref={inputRef}
            type="text"
            value={scannedCode}
            onChange={handleInputChange}
            placeholder="Position barcode scanner here..."
            className="w-full px-4 py-3 bg-slate-700 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            autoFocus
          />

          {loading && (
            <div className="flex items-center justify-center gap-2 text-cyan-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Processing barcode...</span>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-rose-300">{error}</p>
            </div>
          )}

          <p className="text-xs text-slate-400 text-center">
            Make sure the barcode is clearly visible and the scanner is properly positioned
          </p>
        </div>
      )}
    </div>
  );
}
