export const K = 'mylife.v1';
export const CATS = ['Food', 'Travel', 'Study', 'Bills', 'Fun', 'Other'];
export const INCOME_SOURCES = ['Salary', 'Pocket money', 'Freelance', 'Gift', 'Other'];

export const ACCENT_COLORS = {
  white: { name: 'Monochrome', hex: '#ffffff' },
  blue: { name: 'Electric Blue', hex: '#3b82f6' },
  green: { name: 'Emerald', hex: '#10b981' },
  purple: { name: 'Purple', hex: '#a855f7' },
  amber: { name: 'Amber', hex: '#f59e0b' }
};

export const INITIAL_DB = {
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
  geminiApiKey: '',
  cur: '₹'
};

export const today = () =>
  new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10);

export const diff = (d) =>
  Math.round((new Date(d) - new Date(today())) / 864e5);

export const when = (d) => {
  const n = diff(d);
  return n === 0
    ? 'Today'
    : n === 1
    ? 'Tomorrow'
    : n < 0
    ? Math.abs(n) + ' days ago'
    : 'In ' + n + ' days';
};

export const month = () => today().slice(0, 7);

export const fmt = (n, cur = '₹') => {
  const num = +n || 0;
  return (num < 0 ? '-' : '') + (cur || '') + Math.abs(num).toFixed(2);
};

export const nextDue = (d, r) => {
  const x = new Date(d);
  if (r === 'daily') x.setDate(x.getDate() + 1);
  else if (r === 'weekly') x.setDate(x.getDate() + 7);
  else x.setMonth(x.getMonth() + 1);
  return x.toISOString().slice(0, 10);
};

export const bd = (b) => {
  if (!b.date) return { n: 999, age: 0 };
  const [Y, M, D] = b.date.split('-').map(Number);
  const n = new Date();
  const t = new Date(n.getFullYear(), n.getMonth(), n.getDate());
  let c = new Date(t.getFullYear(), M - 1, D);
  if (c < t) c = new Date(t.getFullYear() + 1, M - 1, D);
  return { n: Math.round((c - t) / 864e5), age: c.getFullYear() - Y };
};

export const getSoonBirthdays = (bdays = []) => {
  return bdays
    .map((b) => ({ ...b, ...bd(b) }))
    .filter((b) => b.n <= 7)
    .sort((a, b) => a.n - b.n);
};

export const getSpentForMonth = (tx = [], m = month()) => {
  return tx.filter((t) => t.type === 'expense' && t.date && t.date.slice(0, 7) === m);
};

export const getDailyAllowance = (db) => {
  const now = new Date();
  const year = now.getFullYear();
  const monthIdx = now.getMonth();
  const totalDaysInMonth = new Date(year, monthIdx + 1, 0).getDate();
  const currentDay = now.getDate();
  const daysRemaining = Math.max(1, totalDaysInMonth - currentDay + 1);

  const totalBudget = Object.values(db.budget || {}).reduce((s, v) => s + (+v || 0), 0);
  const spentThisMonth = getSpentForMonth(db.tx, month()).reduce((s, t) => s + (t.amt || 0), 0);

  if (totalBudget > 0) {
    const budgetRemaining = totalBudget - spentThisMonth;
    const daily = budgetRemaining > 0 ? budgetRemaining / daysRemaining : 0;
    return {
      daily,
      daysRemaining,
      totalBudget,
      spentThisMonth,
      budgetRemaining,
      hasBudget: true
    };
  }

  // If no budget set, check monthly income
  const incomeThisMonth = (db.tx || [])
    .filter((t) => t.type === 'income' && t.date && t.date.slice(0, 7) === month())
    .reduce((s, t) => s + (t.amt || 0), 0);

  const balanceRemaining = incomeThisMonth - spentThisMonth;
  return {
    daily: balanceRemaining > 0 ? balanceRemaining / daysRemaining : 0,
    daysRemaining,
    totalBudget: incomeThisMonth,
    spentThisMonth,
    budgetRemaining: balanceRemaining,
    hasBudget: false
  };
};

export const triggerHaptic = (type = 'light', enabled = true) => {
  if (!enabled || typeof navigator === 'undefined' || !navigator.vibrate) return;
  try {
    if (type === 'light') navigator.vibrate(12);
    else if (type === 'medium') navigator.vibrate(25);
    else if (type === 'success') navigator.vibrate([15, 30, 20]);
    else if (type === 'warning') navigator.vibrate([30, 40, 30]);
  } catch (e) {}
};

export const getStorageUsage = () => {
  try {
    const raw = localStorage.getItem(K) || '';
    const bytes = new Blob([raw]).size;
    if (bytes < 1024) return bytes + ' bytes';
    return (bytes / 1024).toFixed(1) + ' KB';
  } catch (e) {
    return '0 KB';
  }
};

export const needsBackupWarning = (db) => {
  const totalItems =
    (db.tasks?.length || 0) +
    (db.tx?.length || 0) +
    (db.events?.length || 0) +
    (db.notes?.length || 0) +
    (db.passwords?.length || 0);
  if (totalItems < 3) return false;
  if (!db.bk) return true;
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  return Date.now() - db.bk > thirtyDaysMs;
};

export const loadDb = () => {
  try {
    const raw = localStorage.getItem(K);
    if (!raw) return INITIAL_DB;
    const parsed = JSON.parse(raw);
    const loaded = { ...INITIAL_DB, ...parsed };
    // Automatically migrate currency from old default '$' to Indian Rupee '₹'
    if (!loaded.cur || loaded.cur === '$') {
      loaded.cur = '₹';
    }
    return loaded;
  } catch (e) {
    console.error('Could not load from phone storage', e);
    return INITIAL_DB;
  }
};

export const saveDb = (db) => {
  try {
    localStorage.setItem(K, JSON.stringify(db));
  } catch (e) {
    console.warn('Local storage quota warning:', e);
  }
  // Persist to durable SQLite database on disk
  saveToSqlite(db);
};

let sqliteSaveTimeout = null;

export const saveToSqlite = (db) => {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (sqliteSaveTimeout) clearTimeout(sqliteSaveTimeout);

  return new Promise((resolve) => {
    sqliteSaveTimeout = setTimeout(async () => {
      try {
        const res = await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(db)
        });
        resolve(res.ok);
      } catch (err) {
        // Offline or server not reachable
        resolve(false);
      }
    }, 250);
  });
};

export const syncWithSqlite = async (fallbackDb) => {
  if (typeof window === 'undefined') return fallbackDb;

  try {
    const res = await fetch('/api/db', { cache: 'no-store' });
    if (!res.ok) return fallbackDb;

    const remote = await res.json();
    if (remote.isVercelServerless) {
      return fallbackDb;
    }
    const remoteItemCount =
      (remote.tasks?.length || 0) +
      (remote.tx?.length || 0) +
      (remote.events?.length || 0) +
      (remote.notes?.length || 0) +
      (remote.passwords?.length || 0);

    const localItemCount =
      (fallbackDb?.tasks?.length || 0) +
      (fallbackDb?.tx?.length || 0) +
      (fallbackDb?.events?.length || 0) +
      (fallbackDb?.notes?.length || 0) +
      (fallbackDb?.passwords?.length || 0);

    // If SQLite is empty but local storage has data from before, migrate local data into SQLite
    if (remoteItemCount === 0 && localItemCount > 0) {
      console.log('Migrating local storage data into SQLite database...');
      await saveToSqlite(fallbackDb);
      return fallbackDb;
    }

    const merged = { ...INITIAL_DB, ...remote };
    if (!merged.cur || merged.cur === '$') {
      merged.cur = '₹';
    }

    // Cache to localStorage for instant offline access
    try {
      localStorage.setItem(K, JSON.stringify(merged));
    } catch (e) {}

    return merged;
  } catch (err) {
    console.warn('Could not sync with SQLite, using local copy:', err);
    return fallbackDb;
  }
};

export const checkSqliteStatus = async () => {
  if (typeof window === 'undefined') return { online: false };
  try {
    const res = await fetch('/api/status', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      return { online: true, ...data };
    }
  } catch (e) {}
  return { online: false };
};


export const exportBackup = (db) => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(
    new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' })
  );
  a.download = 'mylife-backup-' + today() + '.json';
  a.click();
  URL.revokeObjectURL(a.href);
};
