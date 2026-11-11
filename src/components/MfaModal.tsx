import React, { useState, useEffect } from 'react';
import {
  X,
  Fingerprint,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Smartphone,
} from 'lucide-react';
import { getCurrentTotpCode, triggerBiometricVerification } from '../utils/crypto';
import { UserProfile } from '../types';

interface MfaModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  reason?: string;
  onSuccess: () => void;
}

export const MfaModal: React.FC<MfaModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  reason = 'Verify your identity to decrypt restricted clinical records.',
  onSuccess,
}) => {
  const [tab, setTab] = useState<'biometric' | 'totp'>('biometric');
  const [isScanningBio, setIsScanningBio] = useState(false);
  const [bioSuccess, setBioSuccess] = useState(false);
  const [totpDigits, setTotpDigits] = useState(['', '', '', '', '', '']);
  const [currentTotp, setCurrentTotp] = useState<{ code: string; secondsRemaining: number }>({
    code: '123456',
    secondsRemaining: 30,
  });
  const [errorMessage, setErrorMessage] = useState('');

  // Update live TOTP code every second
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      const live = getCurrentTotpCode();
      setCurrentTotp(live);
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const handleStartBiometric = async () => {
    setIsScanningBio(true);
    setErrorMessage('');

    setTimeout(async () => {
      const res = await triggerBiometricVerification();
      setIsScanningBio(false);
      if (res.success) {
        setBioSuccess(true);
        setTimeout(() => {
          onSuccess();
          onClose();
          setBioSuccess(false);
        }, 800);
      } else {
        setErrorMessage('Biometric scan failed. Please use your 6-digit TOTP code.');
      }
    }, 1200);
  };

  const handleTotpChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const newDigits = [...totpDigits];
    newDigits[index] = val.slice(-1);
    setTotpDigits(newDigits);
    setErrorMessage('');

    // Auto-advance
    if (val && index < 5) {
      const nextInput = document.getElementById(`totp-${index + 1}`);
      nextInput?.focus();
    }

    // Auto-submit if all 6 filled
    if (newDigits.every((d) => d !== '') && index === 5) {
      const enteredCode = newDigits.join('');
      if (enteredCode === currentTotp.code || enteredCode === '123456') {
        onSuccess();
        onClose();
      } else {
        setErrorMessage('Invalid 2FA code. Please check your authenticator app.');
      }
    }
  };

  const handleQuickFillTotp = () => {
    const chars = currentTotp.code.split('');
    setTotpDigits(chars);
    setTimeout(() => {
      onSuccess();
      onClose();
    }, 400);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Identity &amp; Biometric Verification
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
          {reason}
        </p>

        {/* Tab switch */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 mt-4 text-xs font-semibold">
          <button
            onClick={() => setTab('biometric')}
            className={`flex-1 py-2 text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
              tab === 'biometric'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-500'
            }`}
          >
            <Fingerprint className="w-4 h-4" />
            <span>Biometric Touch ID</span>
          </button>
          <button
            onClick={() => setTab('totp')}
            className={`flex-1 py-2 text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
              tab === 'totp'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-500'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>2FA Authenticator Code</span>
          </button>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mt-3 p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Biometric View */}
        {tab === 'biometric' && (
          <div className="py-8 flex flex-col items-center justify-center text-center">
            <div
              onClick={handleStartBiometric}
              className={`relative w-24 h-24 rounded-full flex items-center justify-center cursor-pointer transition-all border-2 ${
                bioSuccess
                  ? 'bg-emerald-100 border-emerald-500 text-emerald-600'
                  : isScanningBio
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-400 text-emerald-600 animate-pulse'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-500'
              }`}
            >
              {bioSuccess ? (
                <CheckCircle2 className="w-12 h-12" />
              ) : (
                <Fingerprint className="w-12 h-12" />
              )}
            </div>

            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-4">
              {bioSuccess
                ? 'Biometric Signature Verified!'
                : isScanningBio
                ? 'Scanning optical biometric sensor...'
                : 'Click sensor or place registered finger'}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Registered to: {currentUser.name} ({currentUser.badgeId})
            </p>

            <button
              onClick={handleStartBiometric}
              disabled={isScanningBio || bioSuccess}
              className="mt-5 px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm"
            >
              Simulate Touch ID Scan
            </button>
          </div>
        )}

        {/* TOTP View */}
        {tab === 'totp' && (
          <div className="py-6 space-y-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between">
              <div>
                <span className="text-slate-500 block text-[10px]">Active Authenticator Simulation:</span>
                <span className="font-mono text-base font-bold text-emerald-600 tracking-wider">
                  {currentTotp.code}
                </span>
              </div>
              <div className="text-right">
                <span className="font-mono text-[11px] text-slate-400 block">
                  Expires in {currentTotp.secondsRemaining}s
                </span>
                <button
                  type="button"
                  onClick={handleQuickFillTotp}
                  className="text-xs font-semibold text-emerald-600 hover:underline"
                >
                  Auto-Fill
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 text-center">
                Enter 6-Digit Verification Code
              </label>
              <div className="flex justify-center gap-2">
                {totpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`totp-${idx}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleTotpChange(idx, e.target.value)}
                    className="w-10 h-12 text-center text-lg font-bold font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-emerald-600 focus:border-emerald-600"
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleQuickFillTotp}
                className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg"
              >
                Verify &amp; Unlock
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
