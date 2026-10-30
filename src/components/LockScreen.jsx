import React, { useState } from 'react';

export default function LockScreen({ correctPin, onUnlock, onReset }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [showReset, setShowReset] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pin === correctPin) {
      onUnlock();
    } else {
      setError('Wrong PIN.');
      setTimeout(() => setError(''), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#111111] border border-[#2e2e2e] rounded-2xl p-6 text-white shadow-2xl text-center">
        <img
          src="/logo.png"
          alt="MyLife"
          className="w-16 h-16 rounded-2xl mx-auto mb-3 shadow-md"
        />
        <h2 className="text-xl font-bold mb-4 tracking-tight">MYLIFE is locked</h2>
        
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            id="pin"
            type="password"
            inputMode="numeric"
            placeholder="Enter PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            autoFocus
            className="flex-1 bg-[#111111] border border-[#2e2e2e] rounded-lg px-3.5 py-2.5 text-white placeholder-[#777] focus:outline-none focus:border-white text-base"
          />
          <button
            type="submit"
            className="px-5 py-2.5 bg-white text-black font-bold rounded-lg hover:bg-neutral-200 active:scale-95 transition"
          >
            Unlock
          </button>
        </form>

        {error && (
          <div className="mt-3 text-sm text-red-400 font-medium">
            {error}
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-[#242424] text-center">
          {!showReset ? (
            <button
              type="button"
              onClick={() => setShowReset(true)}
              className="text-xs text-[#a3a3a3] hover:text-white underline"
            >
              Forgot PIN?
            </button>
          ) : (
            <div className="text-xs text-[#a3a3a3] space-y-2">
              <p>Resetting will clear the PIN so you can access your data.</p>
              <div className="flex justify-center gap-2">
                <button
                  type="button"
                  onClick={onReset}
                  className="px-3 py-1 bg-red-600 text-white rounded font-medium hover:bg-red-500"
                >
                  Confirm Reset PIN
                </button>
                <button
                  type="button"
                  onClick={() => setShowReset(false)}
                  className="px-3 py-1 bg-[#222] text-white rounded hover:bg-[#333]"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
