import React, { useState } from 'react';
import { X, Lock, Unlock, Download, Upload, Trash2, Smartphone, ShieldCheck, Check } from 'lucide-react';

export default function SettingsModal({
  isOpen,
  onClose,
  data,
  onUpdatePin,
  onExportBackup,
  onImportBackup,
  onClearCompleted,
  onResetAll
}) {
  const [pinInput, setPinInput] = useState('');
  const [pinMessage, setPinMessage] = useState('');
  const [isChangingPin, setIsChangingPin] = useState(false);

  if (!isOpen) return null;

  const handleSavePin = (e) => {
    e.preventDefault();
    if (pinInput.length !== 4 || !/^\d{4}$/.test(pinInput)) {
      setPinMessage('PIN must be exactly 4 digits');
      return;
    }
    onUpdatePin(pinInput);
    setPinMessage('PIN saved successfully!');
    setPinInput('');
    setIsChangingPin(false);
    setTimeout(() => setPinMessage(''), 2500);
  };

  const handleRemovePin = () => {
    onUpdatePin('');
    setPinMessage('PIN removed.');
    setIsChangingPin(false);
    setTimeout(() => setPinMessage(''), 2500);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          onImportBackup(parsed);
          alert('Backup restored successfully!');
          onClose();
        } catch (err) {
          alert('Invalid backup file. Please select a valid TaskPulse JSON file.');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-lg bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
              <Smartphone className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-100">App Settings & Storage</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 text-slate-300 text-sm">
          {/* Phone Storage Notice */}
          <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Phone Offline Storage</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                All your tasks and categories are stored directly on your phone's browser storage. No cloud account or external servers needed.
              </p>
            </div>
          </div>

          {/* Privacy PIN Lock */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {data.pin ? (
                  <Lock className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Unlock className="w-4 h-4 text-slate-400" />
                )}
                <h4 className="text-sm font-semibold text-slate-100">Privacy App Lock</h4>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-md font-semibold ${data.pin ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'}`}>
                {data.pin ? 'Active' : 'Disabled'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Requires a 4-digit PIN every time the app opens on your phone.
            </p>

            {data.pin && !isChangingPin ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsChangingPin(true)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium rounded-xl transition"
                >
                  Change PIN
                </button>
                <button
                  type="button"
                  onClick={handleRemovePin}
                  className="px-3 py-1.5 bg-rose-950/40 border border-rose-900/60 hover:bg-rose-900/60 text-rose-300 text-xs font-medium rounded-xl transition"
                >
                  Remove PIN
                </button>
              </div>
            ) : (
              <form onSubmit={handleSavePin} className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="Enter 4 digits"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-center tracking-widest font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                  >
                    Save PIN
                  </button>
                  {isChangingPin && (
                    <button
                      type="button"
                      onClick={() => setIsChangingPin(false)}
                      className="px-3 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            )}

            {pinMessage && (
              <p className="text-xs text-indigo-400 font-medium mt-2 animate-fadeIn">{pinMessage}</p>
            )}
          </div>

          {/* Backup & Restore */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3">
            <h4 className="text-sm font-semibold text-slate-100">Backup & Restore</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Export your data as a JSON file to transfer between devices or create a safety backup.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={onExportBackup}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl transition"
              >
                <Download className="w-3.5 h-3.5 text-indigo-400" />
                Export Backup (.json)
              </button>

              <label className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl transition cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-emerald-400" />
                Restore Backup
                <input
                  type="file"
                  accept="application/json"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-900/30 space-y-3">
            <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider">Clean Up</h4>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  if (confirm('Clear all completed tasks?')) {
                    onClearCompleted();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 text-xs font-medium rounded-xl transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear Completed Tasks
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm('Reset all tasks and settings to initial state? This cannot be undone.')) {
                    onResetAll();
                    onClose();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs font-medium rounded-xl transition"
              >
                Reset All Data
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

