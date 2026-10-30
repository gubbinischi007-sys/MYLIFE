import React, { useState } from 'react';
import { Lock, Delete, KeyRound, AlertTriangle } from 'lucide-react';

export default function PinLockModal({ correctPin, onUnlock, onResetData }) {
  const [enteredPin, setEnteredPin] = useState('');
  const [error, setError] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleDigit = (digit) => {
    if (enteredPin.length < 4) {
      const next = enteredPin + digit;
      setEnteredPin(next);
      setError(false);

      if (next.length === 4) {
        if (next === correctPin) {
          setTimeout(() => {
            onUnlock();
          }, 150);
        } else {
          setTimeout(() => {
            setError(true);
            setEnteredPin('');
          }, 200);
        }
      }
    }
  };

  const handleDelete = () => {
    setEnteredPin(prev => prev.slice(0, -1));
    setError(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-between p-6 select-none animate-fadeIn">
      {/* Top Header */}
      <div className="pt-10 flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 shadow-lg shadow-indigo-500/10">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-100 tracking-tight">App Locked</h2>
        <p className="text-sm text-slate-400 mt-1">Enter your 4-digit security PIN</p>

        {/* PIN Dots */}
        <div className={`flex items-center gap-4 mt-8 ${error ? 'animate-bounce text-rose-500' : ''}`}>
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = idx < enteredPin.length;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  isFilled
                    ? 'bg-indigo-500 scale-125 shadow-lg shadow-indigo-500/50'
                    : 'bg-slate-800 border border-slate-700'
                } ${error ? 'bg-rose-500 border-rose-500' : ''}`}
              />
            );
          })}
        </div>

        {error && (
          <p className="text-xs text-rose-400 font-medium mt-3 animate-fadeIn">
            Incorrect PIN. Try again.
          </p>
        )}
      </div>

      {/* Numeric Keypad */}
      <div className="w-full max-w-xs grid grid-cols-3 gap-4 mb-6">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => handleDigit(String(num))}
            className="h-16 rounded-2xl bg-slate-900/90 hover:bg-slate-800 active:scale-95 border border-slate-800/80 text-2xl font-semibold text-slate-100 transition-all flex items-center justify-center shadow-sm"
          >
            {num}
          </button>
        ))}
        <div className="flex items-center justify-center">
          {/* Empty placeholder */}
        </div>
        <button
          onClick={() => handleDigit('0')}
          className="h-16 rounded-2xl bg-slate-900/90 hover:bg-slate-800 active:scale-95 border border-slate-800/80 text-2xl font-semibold text-slate-100 transition-all flex items-center justify-center shadow-sm"
        >
          0
        </button>
        <button
          onClick={handleDelete}
          className="h-16 rounded-2xl bg-slate-900/50 hover:bg-slate-800 active:scale-95 border border-slate-800/50 text-slate-400 hover:text-slate-200 transition-all flex items-center justify-center"
        >
          <Delete className="w-6 h-6" />
        </button>
      </div>

      {/* Forgot PIN / Reset Link */}
      <div className="pb-4 text-center">
        {!showResetConfirm ? (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="text-xs text-slate-400 hover:text-slate-300 underline underline-offset-4"
          >
            Forgot PIN?
          </button>
        ) : (
          <div className="bg-rose-950/40 border border-rose-900/50 p-4 rounded-xl max-w-xs text-left animate-fadeIn">
            <div className="flex items-center gap-2 text-rose-300 text-xs font-semibold mb-1">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              Reset Security PIN?
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
              Resetting will clear the PIN lock and restore default app settings.
            </p>
            <div className="flex gap-2">
              <button
                onClick={onResetData}
                className="flex-1 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition"
              >
                Reset PIN
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="py-1.5 px-3 text-xs bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

