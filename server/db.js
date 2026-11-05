import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const dataDir = path.join(projectRoot, 'data');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'mylife.db');
const db = new DatabaseSync(dbPath);

// Enable WAL mode for concurrent reads and writes, high performance, and crash resilience
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA synchronous = NORMAL;

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    due TEXT,
    rep TEXT,
    imp INTEGER DEFAULT 0,
    done INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS tx (
    id INTEGER PRIMARY KEY,
    type TEXT NOT NULL,
    amt REAL NOT NULL,
    cat TEXT,
    source TEXT,
    note TEXT,
    date TEXT,
    img TEXT,
    scanned INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    date TEXT,
    type TEXT DEFAULT 'Exam'
  );

  CREATE TABLE IF NOT EXISTS assign (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    due TEXT,
    done INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS bdays (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    date TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY,
    t TEXT NOT NULL,
    d TEXT
  );

  CREATE TABLE IF NOT EXISTS passwords (
    id INTEGER PRIMARY KEY,
    service TEXT NOT NULL,
    user TEXT,
    pass TEXT NOT NULL,
    date TEXT,
    cat TEXT
  );

  CREATE TABLE IF NOT EXISTS deleted (
    id INTEGER PRIMARY KEY,
    type TEXT NOT NULL,
    item TEXT NOT NULL,
    deletedAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    val TEXT
  );
`);

export function getFullDb() {
  const tasks = db.prepare('SELECT * FROM tasks ORDER BY id DESC').all().map((r) => ({
    id: Number(r.id),
    title: r.title,
    due: r.due || '',
    rep: r.rep || '',
    imp: Boolean(r.imp),
    done: Boolean(r.done)
  }));

  const tx = db.prepare('SELECT * FROM tx ORDER BY id DESC').all().map((r) => ({
    id: Number(r.id),
    type: r.type,
    amt: Number(r.amt),
    cat: r.cat || '',
    source: r.source || '',
    note: r.note || '',
    date: r.date || '',
    img: r.img || null,
    scanned: Boolean(r.scanned)
  }));

  const events = db.prepare('SELECT * FROM events ORDER BY date ASC').all().map((r) => ({
    id: Number(r.id),
    title: r.title,
    date: r.date || '',
    type: r.type || 'Exam'
  }));

  const assign = db.prepare('SELECT * FROM assign ORDER BY id DESC').all().map((r) => ({
    id: Number(r.id),
    title: r.title,
    due: r.due || '',
    done: Boolean(r.done)
  }));

  const bdays = db.prepare('SELECT * FROM bdays ORDER BY name ASC').all().map((r) => ({
    id: Number(r.id),
    name: r.name,
    date: r.date
  }));

  const notes = db.prepare('SELECT * FROM notes ORDER BY id DESC').all().map((r) => ({
    id: Number(r.id),
    t: r.t,
    d: r.d || ''
  }));

  const passwords = db.prepare('SELECT * FROM passwords ORDER BY id DESC').all().map((r) => ({
    id: Number(r.id),
    service: r.service,
    user: r.user || '',
    pass: r.pass,
    date: r.date || '',
    cat: r.cat || ''
  }));

  const deleted = db.prepare('SELECT * FROM deleted ORDER BY id DESC').all().map((r) => {
    let item = {};
    try {
      item = JSON.parse(r.item);
    } catch (e) {
      item = {};
    }
    return {
      id: Number(r.id),
      type: r.type,
      item,
      deletedAt: r.deletedAt
    };
  });

  const settingsRows = db.prepare('SELECT * FROM settings').all();
  const settings = {};
  for (const s of settingsRows) {
    settings[s.key] = s.val;
  }

  let budget = {};
  if (settings.budget) {
    try {
      budget = JSON.parse(settings.budget);
    } catch (e) {
      budget = {};
    }
  }

  return {
    tasks,
    tx,
    events,
    assign,
    bdays,
    notes,
    passwords,
    deleted,
    budget,
    pin: settings.pin || '',
    theme: settings.theme || 'dark',
    accent: settings.accent || 'white',
    haptics: settings.haptics !== undefined ? settings.haptics === 'true' : true,
    vaultMaster: settings.vaultMaster || '',
    geminiApiKey: settings.geminiApiKey || '',
    cur: settings.cur || '₹',
    bk: Number(settings.bk) || 0
  };
}

export function saveFullDb(data) {
  if (!data || typeof data !== 'object') return false;

  db.exec('BEGIN TRANSACTION;');
  try {
    // Tasks
    if (Array.isArray(data.tasks)) {
      db.exec('DELETE FROM tasks;');
      const stmt = db.prepare(
        'INSERT INTO tasks (id, title, due, rep, imp, done) VALUES (?, ?, ?, ?, ?, ?);'
      );
      for (const t of data.tasks) {
        stmt.run(
          t.id || Date.now(),
          t.title || '',
          t.due || '',
          t.rep || '',
          t.imp ? 1 : 0,
          t.done ? 1 : 0
        );
      }
    }

    // Transactions
    if (Array.isArray(data.tx)) {
      db.exec('DELETE FROM tx;');
      const stmt = db.prepare(
        'INSERT INTO tx (id, type, amt, cat, source, note, date, img, scanned) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);'
      );
      for (const x of data.tx) {
        stmt.run(
          x.id || Date.now(),
          x.type || 'expense',
          Number(x.amt) || 0,
          x.cat || '',
          x.source || '',
          x.note || '',
          x.date || '',
          x.img || null,
          x.scanned ? 1 : 0
        );
      }
    }

    // Events
    if (Array.isArray(data.events)) {
      db.exec('DELETE FROM events;');
      const stmt = db.prepare('INSERT INTO events (id, title, date, type) VALUES (?, ?, ?, ?);');
      for (const e of data.events) {
        stmt.run(e.id || Date.now(), e.title || '', e.date || '', e.type || 'Exam');
      }
    }

    // Assignments
    if (Array.isArray(data.assign)) {
      db.exec('DELETE FROM assign;');
      const stmt = db.prepare('INSERT INTO assign (id, title, due, done) VALUES (?, ?, ?, ?);');
      for (const a of data.assign) {
        stmt.run(a.id || Date.now(), a.title || '', a.due || '', a.done ? 1 : 0);
      }
    }

    // Birthdays
    if (Array.isArray(data.bdays)) {
      db.exec('DELETE FROM bdays;');
      const stmt = db.prepare('INSERT INTO bdays (id, name, date) VALUES (?, ?, ?);');
      for (const b of data.bdays) {
        stmt.run(b.id || Date.now(), b.name || '', b.date || '');
      }
    }

    // Notes
    if (Array.isArray(data.notes)) {
      db.exec('DELETE FROM notes;');
      const stmt = db.prepare('INSERT INTO notes (id, t, d) VALUES (?, ?, ?);');
      for (const n of data.notes) {
        stmt.run(n.id || Date.now(), n.t || '', n.d || '');
      }
    }

    // Passwords
    if (Array.isArray(data.passwords)) {
      db.exec('DELETE FROM passwords;');
      const stmt = db.prepare(
        'INSERT INTO passwords (id, service, user, pass, date, cat) VALUES (?, ?, ?, ?, ?, ?);'
      );
      for (const p of data.passwords) {
        stmt.run(
          p.id || Date.now(),
          p.service || '',
          p.user || '',
          p.pass || '',
          p.date || '',
          p.cat || ''
        );
      }
    }

    // Recently Deleted
    if (Array.isArray(data.deleted)) {
      db.exec('DELETE FROM deleted;');
      const stmt = db.prepare(
        'INSERT INTO deleted (id, type, item, deletedAt) VALUES (?, ?, ?, ?);'
      );
      for (const d of data.deleted) {
        stmt.run(
          d.id || Date.now(),
          d.type || 'item',
          typeof d.item === 'string' ? d.item : JSON.stringify(d.item || {}),
          d.deletedAt || new Date().toISOString()
        );
      }
    }

    // Settings
    const setStmt = db.prepare(
      'INSERT INTO settings (key, val) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET val = excluded.val;'
    );
    if (data.pin !== undefined) setStmt.run('pin', String(data.pin || ''));
    if (data.theme !== undefined) setStmt.run('theme', String(data.theme || 'dark'));
    if (data.accent !== undefined) setStmt.run('accent', String(data.accent || 'white'));
    if (data.haptics !== undefined) setStmt.run('haptics', String(data.haptics));
    if (data.vaultMaster !== undefined) setStmt.run('vaultMaster', String(data.vaultMaster || ''));
    if (data.geminiApiKey !== undefined) setStmt.run('geminiApiKey', String(data.geminiApiKey || ''));
    if (data.cur !== undefined) setStmt.run('cur', String(data.cur || '₹'));
    if (data.bk !== undefined) setStmt.run('bk', String(data.bk || 0));
    if (data.budget !== undefined) setStmt.run('budget', JSON.stringify(data.budget || {}));

    db.exec('COMMIT;');
    return true;
  } catch (err) {
    db.exec('ROLLBACK;');
    console.error('Error saving to SQLite:', err);
    throw err;
  }
}

export function isDbEmpty() {
  const row = db.prepare(`
    SELECT (
      (SELECT COUNT(*) FROM tasks) +
      (SELECT COUNT(*) FROM tx) +
      (SELECT COUNT(*) FROM events) +
      (SELECT COUNT(*) FROM assign) +
      (SELECT COUNT(*) FROM bdays) +
      (SELECT COUNT(*) FROM notes) +
      (SELECT COUNT(*) FROM passwords)
    ) as total;
  `).get();
  return Number(row.total) === 0;
}

export default db;

