import React, { useState, useEffect } from 'react';
import { Download, Share, PlusSquare, X } from 'lucide-react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode
    const inStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    setIsStandalone(inStandalone);

    // Check if iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  if (isStandalone || dismissed || (!deferredPrompt && !isIOS)) {
    return null;
  }

  return (
    <div className="mx-4 mt-2 mb-4 p-3.5 bg-gradient-to-r from-indigo-950/80 via-slate-900 to-indigo-950/80 border border-indigo-500/30 rounded-2xl shadow-xl flex items-center justify-between gap-3 text-slate-100">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
          <Download className="w-5 h-5 animate-pulse" />
        </div>
        <div className="truncate">
          <p className="text-xs font-bold text-indigo-300">Install Mobile App</p>
          <p className="text-[11px] text-slate-400 truncate">Run directly from your phone screen offline</p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleInstallClick}
          className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white rounded-xl shadow-md transition"
        >
          Install
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="p-1.5 text-slate-500 hover:text-slate-300 transition"
          aria-label="Dismiss banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* iOS Instructions Sheet */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100">Install on iPhone / iPad</h3>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="py-4 space-y-3.5 text-xs text-slate-300">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">1</div>
                <p>Tap the <strong className="text-indigo-400 inline-flex items-center gap-1"><Share className="w-3.5 h-3.5 inline" /> Share</strong> button in Safari's bottom toolbar.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">2</div>
                <p>Scroll down and select <strong className="text-indigo-400 inline-flex items-center gap-1"><PlusSquare className="w-3.5 h-3.5 inline" /> Add to Home Screen</strong>.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">3</div>
                <p>Tap <strong>Add</strong> in the top corner. TaskPulse is now installed on your phone!</p>
              </div>
            </div>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 font-semibold text-white rounded-xl transition text-xs"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

