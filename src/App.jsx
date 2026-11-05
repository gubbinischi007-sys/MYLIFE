import React, { useState, useEffect } from 'react';
import { loadDb, saveDb, syncWithSqlite, getSoonBirthdays, ACCENT_COLORS, triggerHaptic } from './utils/storage';
import Icon from './components/Icons';
import Navigation from './components/Navigation';
import LockScreen from './components/LockScreen';
import HomeView from './components/HomeView';
import PersonalView from './components/PersonalView';
import CollegeView from './components/CollegeView';
import MoneyView from './components/MoneyView';
import ReportsView from './components/ReportsView';
import SettingsView from './components/SettingsView';
import RecentlyDeletedView from './components/RecentlyDeletedView';
import SpeedAddModal from './components/SpeedAddModal';
import SpotlightModal from './components/SpotlightModal';

export default function App() {
  const [db, setDb] = useState(loadDb);
  const [isLocked, setIsLocked] = useState(Boolean(loadDb().pin));
  const [page, setPage] = useState('home');
  const [pt, setPt] = useState(null); // Personal subtab: null | 'tasks' | 'bday' | 'notes'
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSpeedAddOpen, setIsSpeedAddOpen] = useState(false);
  const [speedAddTab, setSpeedAddTab] = useState('task');
  const [toast, setToast] = useState(null); // { message, onUndo }
  const toastTimeoutRef = React.useRef(null);
  const [hist, setHist] = useState([]);

  // Opening screen state: shows only the logo for 2 seconds, fades out in 0.3 seconds
  const [showOpening, setShowOpening] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFadingOut(true);
      const fadeTimer = setTimeout(() => {
        setShowOpening(false);
      }, 300); // 0.3s fade-out
      return () => clearTimeout(fadeTimer);
    }, 2000); // 2 seconds logo screen

    return () => clearTimeout(timer);
  }, []);

  // Sync with SQLite backend on launch
  useEffect(() => {
    let isMounted = true;
    syncWithSqlite(db).then((synced) => {
      if (isMounted && synced) {
        setDb(synced);
        if (synced.pin) {
          setIsLocked(true);
        }
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Persist DB changes to phone local storage and SQLite
  useEffect(() => {
    saveDb(db);
  }, [db]);

  // Apply theme & accent color attribute
  useEffect(() => {
    const root = document.documentElement;
    if (db.theme === 'light') {
      root.setAttribute('data-theme', 'light');
    } else {
      root.removeAttribute('data-theme');
    }

    const accentHex = ACCENT_COLORS[db.accent]?.hex || '#ffffff';
    root.style.setProperty('--a', accentHex);
  }, [db.theme, db.accent]);

  // Handle PWA shortcut URL hashes on load
  useEffect(() => {
    const hash = window.location.hash;
    if (hash === '#quick-task') {
      setSpeedAddTab('task');
      setIsSpeedAddOpen(true);
    } else if (hash === '#quick-expense') {
      setSpeedAddTab('expense');
      setIsSpeedAddOpen(true);
    } else if (hash === '#quick-note') {
      setSpeedAddTab('note');
      setIsSpeedAddOpen(true);
    }
  }, []);

  // Global keyboard shortcut: Cmd+K / Ctrl+K for search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const showToast = (message) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message, onUndo: null });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const showToastWithUndo = (message, onUndo) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ message, onUndo });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 6000);
  };

  const handleToastUndo = () => {
    if (toast?.onUndo) {
      toast.onUndo();
      triggerHaptic('success', db.haptics);
    }
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast(null);
  };

  // Birthday reminder alert on first load if unlocked (after opening screen)
  useEffect(() => {
    if (!isLocked && !showOpening) {
      const soon = getSoonBirthdays(db.bdays);
      if (soon.length > 0) {
        showToast(`${soon.length} birthday${soon.length > 1 ? 's' : ''} coming up this week`);
      }
    }
  }, [isLocked, showOpening]);

  const navigateTo = (nextPage, nextPt = null) => {
    triggerHaptic('light', db.haptics);
    setHist((prev) => [...prev, { page, pt }]);
    setPage(nextPage);
    setPt(nextPt);
    window.scrollTo(0, 0);
  };

  const handleBack = () => {
    triggerHaptic('light', db.haptics);
    if (page === 'personal' && pt !== null) {
      setPt(null);
      return;
    }
    if (hist.length > 0) {
      const prev = hist[hist.length - 1];
      setHist((h) => h.slice(0, -1));
      setPage(prev.page);
      setPt(prev.pt);
    } else {
      setPage('home');
      setPt(null);
    }
    window.scrollTo(0, 0);
  };

  const pageTitles = {
    personal: 'Personal',
    college: 'College',
    money: 'Money',
    deleted: 'Recently Deleted',
    reports: 'Reports',
    settings: 'Settings'
  };

  return (
    <div>
      {/* Opening Logo Screen (shows only the logo for 2 seconds, fades out in 0.3 seconds) */}
      {showOpening && (
        <div
          id="opening-screen"
          className={isFadingOut ? 'fade-out' : ''}
          aria-hidden={isFadingOut}
        >
          <img
            src="/logo.png"
            alt="MyLife"
          />
        </div>
      )}

      {/* PIN Lock Screen Overlay if PIN is configured */}
      {isLocked && db.pin && (
        <LockScreen
          correctPin={db.pin}
          onUnlock={() => {
            triggerHaptic('success', db.haptics);
            setIsLocked(false);
          }}
          onReset={() => {
            const updated = { ...db, pin: '' };
            setDb(updated);
            setIsLocked(false);
          }}
        />
      )}

      {/* Main View Container */}
      <main id="v">
        {/* Top bar for sub-pages */}
        {page !== 'home' && (
          <div className="top">
            <button
              className="bk"
              onClick={handleBack}
              aria-label="Back"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 5l-7 7 7 7" />
              </svg>
            </button>

            <h1 style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <Icon name={page} size={24} />
              {pageTitles[page]}
            </h1>

            {/* Quick Search in Subpages */}
            <button
              className="bk mb"
              onClick={() => {
                triggerHaptic('light', db.haptics);
                setIsSearchOpen(true);
              }}
              aria-label="Search"
              style={{ marginRight: '6px' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </button>

            {/* Menu Button */}
            <button
              className="bk"
              onClick={() => {
                triggerHaptic('light', db.haptics);
                setIsMenuOpen(true);
              }}
              aria-label="Menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
          </div>
        )}

        {/* Dynamic Route Pages */}
        {page === 'home' && (
          <HomeView
            db={db}
            onNavigate={(p, sub = null) => navigateTo(p, sub)}
            onOpenMenu={() => setIsMenuOpen(true)}
            onOpenSearch={() => setIsSearchOpen(true)}
            onOpenSpeedAdd={() => {
              setSpeedAddTab('task');
              setIsSpeedAddOpen(true);
            }}
            onToast={showToast}
            onUpdateDb={setDb}
          />
        )}
        {page === 'personal' && (
          <PersonalView
            db={db}
            onUpdateDb={setDb}
            currentSubtab={pt}
            onToast={showToast}
            onToastWithUndo={showToastWithUndo}
            onSubtabChange={(newPt) => {
              if (!pt && newPt) {
                setHist((prev) => [...prev, { page: 'personal', pt: null }]);
              }
              setPt(newPt);
            }}
          />
        )}
        {page === 'college' && (
          <CollegeView
            db={db}
            onUpdateDb={setDb}
            onToast={showToast}
            onToastWithUndo={showToastWithUndo}
          />
        )}
        {page === 'money' && (
          <MoneyView
            db={db}
            onUpdateDb={setDb}
            onToast={showToast}
            onToastWithUndo={showToastWithUndo}
          />
        )}
        {page === 'deleted' && (
          <RecentlyDeletedView
            db={db}
            onUpdateDb={setDb}
            onToast={showToast}
            onToastWithUndo={showToastWithUndo}
          />
        )}
        {page === 'reports' && (
          <ReportsView
            db={db}
          />
        )}
        {page === 'settings' && (
          <SettingsView
            db={db}
            onUpdateDb={setDb}
            onToast={showToast}
          />
        )}
      </main>

      {/* Global Search Modal (Cmd+K) */}
      <SpotlightModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        db={db}
        onNavigate={(targetPage, subtab) => {
          navigateTo(targetPage, subtab);
        }}
      />

      {/* Speed Add Bottom Sheet Modal */}
      <SpeedAddModal
        isOpen={isSpeedAddOpen}
        onClose={() => setIsSpeedAddOpen(false)}
        defaultTab={speedAddTab}
        db={db}
        onUpdateDb={setDb}
        onToast={showToast}
      />

      {/* Toast Alert with Undo */}
      {toast && (
        <div id="toast">
          <span>{toast.message}</span>
          {toast.onUndo && (
            <button onClick={handleToastUndo} type="button">
              Undo
            </button>
          )}
        </div>
      )}

      {/* Navigation (Bottom Bar + Drawer Menu) */}
      <Navigation
        activePage={page}
        onNavigate={(p) => navigateTo(p, null)}
        isMenuOpen={isMenuOpen}
        onCloseMenu={() => setIsMenuOpen(false)}
      />
    </div>
  );
}
