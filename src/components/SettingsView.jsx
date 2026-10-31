import React, { useState } from 'react';
import { exportBackup, ACCENT_COLORS, getStorageUsage, triggerHaptic, saveDb } from '../utils/storage';

export default function SettingsView({ db, onUpdateDb, onToast }) {
  const [pinInput, setPinInput] = useState('');
  const [msg, setMsg] = useState('');
  const [isChangingPin, setIsChangingPin] = useState(false);

  const storageUsed = getStorageUsage();

  const handleSavePin = (e) => {
    e.preventDefault();
    const clean = pinInput.trim();
    if (clean.length < 4) {
      alert('Use at least 4 digits.');
      return;
    }
    onUpdateDb({
      ...db,
      pin: clean
    });
    setPinInput('');
    setIsChangingPin(false);
    triggerHaptic('success', db.haptics);
    setMsg('PIN saved.');
    setTimeout(() => setMsg(''), 3000);
  };

  const handleClearPin = () => {
    onUpdateDb({
      ...db,
      pin: ''
    });
    setIsChangingPin(false);
    triggerHaptic('light', db.haptics);
    setMsg('PIN removed.');
    setTimeout(() => setMsg(''), 3000);
  };

  const handleRestoreFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        onUpdateDb({
          ...db,
          ...parsed
        });
        triggerHaptic('success', db.haptics);
        alert('Backup restored successfully!');
      } catch (err) {
        alert('That file is not a valid backup.');
      }
    };
    reader.readAsText(file);
  };

  const handleExport = () => {
    exportBackup(db);
    onUpdateDb({
      ...db,
      bk: Date.now()
    });
    triggerHaptic('success', db.haptics);
    if (onToast) onToast('Backup file downloaded!');
  };

  const handleClearCompleted = () => {
    if (confirm('Clear all completed tasks?')) {
      onUpdateDb({
        ...db,
        tasks: db.tasks.filter((t) => !t.done)
      });
      triggerHaptic('light', db.haptics);
      if (onToast) onToast('Completed tasks cleared.');
    }
  };

  const handleResetAll = () => {
    if (confirm('Reset all tasks and settings to default? This will clear everything.')) {
      const clean = {
        tasks: [],
        tx: [],
        budget: {},
        events: [],
        pin: '',
        bk: 0,
        theme: 'dark',
        accent: 'white',
        haptics: true,
        notes: [],
        assign: [],
        bdays: [],
        passwords: [],
        vaultMaster: '',
        cur: '₹'
      };
      saveDb(clean);
      onUpdateDb(clean);
      triggerHaptic('warning', db.haptics);
      if (onToast) onToast('All data has been reset.');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. PREFERENCES */}
      <div>
        <h2 style={{ margin: '0 0 8px 4px', fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#888' }}>
          Preferences
        </h2>
        <div className="c" style={{ padding: '4px 14px' }}>
          {/* Appearance Segmented Pill */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--l)' }}>
            <div>
              <div style={{ fontWeight: 600 }}>Appearance</div>
              <div className="m" style={{ fontSize: '0.8rem' }}>Theme mode</div>
            </div>
            <div className="tabs" style={{ margin: 0 }}>
              {['light', 'dark', 'auto'].map((th) => (
                <button
                  key={th}
                  aria-pressed={(db.theme || 'dark') === th}
                  onClick={() => {
                    triggerHaptic('light', db.haptics);
                    onUpdateDb({ ...db, theme: th });
                  }}
                  style={{ textTransform: 'capitalize', padding: '4px 10px', minHeight: '34px', fontSize: '0.82rem' }}
                >
                  {th === 'light' ? '☀️ Light' : th === 'dark' ? '🌙 Dark' : '⚙️ Auto'}
                </button>
              ))}
            </div>
          </div>

          {/* Accent Color Selector */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--l)', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <div style={{ fontWeight: 600 }}>Accent Color</div>
              <div className="m" style={{ fontSize: '0.8rem' }}>Highlights and buttons</div>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {Object.entries(ACCENT_COLORS).map(([key, item]) => {
                const isSelected = (db.accent || 'white') === key;
                return (
                  <button
                    key={key}
                    type="button"
                    title={item.name}
                    onClick={() => {
                      triggerHaptic('light', db.haptics);
                      onUpdateDb({ ...db, accent: key });
                    }}
                    style={{
                      width: '28px',
                      height: '28px',
                      minHeight: '28px',
                      borderRadius: '50%',
                      background: item.hex,
                      border: isSelected ? '2px solid white' : '1px solid #444',
                      transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                      boxShadow: isSelected ? `0 0 8px ${item.hex}88` : 'none',
                      padding: 0
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* Currency */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--l)' }}>
            <div>
              <div style={{ fontWeight: 600 }}>Currency</div>
              <div className="m" style={{ fontSize: '0.8rem' }}>Display symbol in Money</div>
            </div>
            <select
              value={db.cur || ''}
              onChange={(e) => {
                triggerHaptic('light', db.haptics);
                onUpdateDb({ ...db, cur: e.target.value });
              }}
              style={{ width: '130px', minHeight: '34px', padding: '4px 8px', fontSize: '0.85rem' }}
            >
              <option value="">None</option>
              <option value="₹">₹ (INR)</option>
              <option value="$">$ (USD)</option>
              <option value="€">€ (EUR)</option>
              <option value="£">£ (GBP)</option>
              <option value="¥">¥ (JPY)</option>
            </select>
          </div>

          {/* Haptics & Vibration */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
            <div>
              <div style={{ fontWeight: 600 }}>Haptic Vibrations</div>
              <div className="m" style={{ fontSize: '0.8rem' }}>Tactile feedback on actions</div>
            </div>
            <button
              type="button"
              className={db.haptics !== false ? 'p' : ''}
              onClick={() => {
                const next = !db.haptics;
                onUpdateDb({ ...db, haptics: next });
                triggerHaptic('success', next);
              }}
              style={{ padding: '4px 14px', minHeight: '34px', fontSize: '0.85rem' }}
            >
              {db.haptics !== false ? 'Enabled' : 'Disabled'}
            </button>
          </div>
        </div>
      </div>

      {/* 2. SECURITY */}
      <div>
        <h2 style={{ margin: '0 0 8px 4px', fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#888' }}>
          Security
        </h2>
        <div className="c">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div>
              <div style={{ fontWeight: 600 }}>App Lock PIN</div>
              <div className="m" style={{ fontSize: '0.8rem' }}>Protects against casual snoopers</div>
            </div>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: '6px',
                background: db.pin ? 'var(--t)' : 'var(--s)',
                color: db.pin ? 'var(--bg)' : 'var(--m)',
                border: '1px solid var(--l)'
              }}
            >
              {db.pin ? '● Protected' : 'Off'}
            </span>
          </div>

          {db.pin && !isChangingPin ? (
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => setIsChangingPin(true)}
                style={{ padding: '6px 12px', minHeight: '36px', fontSize: '0.82rem' }}
              >
                Change PIN
              </button>
              <button
                type="button"
                onClick={handleClearPin}
                style={{ padding: '6px 12px', minHeight: '36px', fontSize: '0.82rem', borderColor: 'var(--bad)', color: 'var(--bad)' }}
              >
                Remove PIN
              </button>
            </div>
          ) : (
            <form onSubmit={handleSavePin} style={{ marginTop: '10px' }}>
              <div className="r">
                <input
                  type="password"
                  inputMode="numeric"
                  placeholder={db.pin ? 'Enter new 4+ digits' : 'Choose 4-digit PIN'}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button type="submit" className="p" style={{ minHeight: '40px' }}>
                  Save PIN
                </button>
                {isChangingPin && (
                  <button type="button" onClick={() => setIsChangingPin(false)}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          )}

          {msg && <p className="m" style={{ color: 'var(--ok)', marginTop: '6px' }}>{msg}</p>}
        </div>
      </div>

      {/* 3. RECEIPT SCANNER (AI) */}
      <div>
        <h2 style={{ margin: '0 0 8px 4px', fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#888' }}>
          Receipt Scanner (AI)
        </h2>
        <div className="c">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 600 }}>Gemini 2.5 Flash Vision</div>
              <div className="m" style={{ fontSize: '0.8rem' }}>Reads bills and extracts totals & merchants accurately</div>
            </div>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: '6px',
                background: 'var(--t)',
                color: 'var(--bg)',
                border: '1px solid var(--l)'
              }}
            >
              ● Connected
            </span>
          </div>
        </div>
      </div>

      {/* 4. DATA & STORAGE */}
      <div>
        <h2 style={{ margin: '0 0 8px 4px', fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#888' }}>
          Data & Storage
        </h2>
        <div className="c">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600 }}>Phone Storage Usage</div>
              <div className="m" style={{ fontSize: '0.8rem' }}>Stored locally in your browser</div>
            </div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{storageUsed}</div>
          </div>

          <div className="m" style={{ fontSize: '0.82rem', marginTop: '8px' }}>
            {db.bk ? (
              <span>Last backup: {new Date(db.bk).toLocaleDateString()}</span>
            ) : (
              <span style={{ color: 'var(--bad)' }}>⚠️ No backup saved yet</span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="p"
              onClick={handleExport}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
            >
              ⤓ Export Backup (.json)
            </button>

            <label
              className="c"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                margin: 0,
                padding: '8px 12px',
                fontSize: '0.85rem',
                minHeight: '40px'
              }}
            >
              ⤒ Restore Backup
              <input
                type="file"
                accept="application/json"
                className="hidden"
                style={{ display: 'none' }}
                onChange={handleRestoreFile}
              />
            </label>
          </div>
        </div>
      </div>

      {/* 4. DANGER ZONE & APP INFO */}
      <div>
        <h2 style={{ margin: '0 0 8px 4px', fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#888' }}>
          Maintenance & Info
        </h2>
        <div className="c" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <div style={{ fontWeight: 600 }}>Clear Done Tasks</div>
            <div className="m" style={{ fontSize: '0.8rem' }}>Remove checked-off items</div>
          </div>
          <button
            type="button"
            onClick={handleClearCompleted}
            style={{ fontSize: '0.82rem', minHeight: '34px', padding: '4px 10px' }}
          >
            Clear Done
          </button>
        </div>

        <div className="c" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', borderColor: 'var(--bad)' }}>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--bad)' }}>Reset All Data</div>
            <div className="m" style={{ fontSize: '0.8rem' }}>Restore factory defaults</div>
          </div>
          <button
            type="button"
            onClick={handleResetAll}
            style={{ fontSize: '0.82rem', minHeight: '34px', padding: '4px 10px', borderColor: 'var(--bad)', color: 'var(--bad)' }}
          >
            Reset All
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <img src="/logo.png" alt="MyLife" style={{ width: '48px', height: '48px', borderRadius: '12px', boxShadow: '0 4px 16px rgba(0,0,0,0.5)' }} />
          <span className="m" style={{ fontSize: '0.75rem' }}>MYLIFE PWA v1.1 · 100% Offline & Private</span>
        </div>
      </div>
    </div>
  );
}
