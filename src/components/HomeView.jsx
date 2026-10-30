import React from 'react';
import Icon from './Icons';
import { diff, when, fmt, month, getSoonBirthdays, getSpentForMonth, needsBackupWarning, exportBackup, triggerHaptic } from '../utils/storage';

export default function HomeView({ db, onNavigate, onOpenMenu, onOpenSearch, onOpenSpeedAdd, onToast, onUpdateDb }) {
  const soonBdays = getSoonBirthdays(db.bdays);
  const dueTodayTasks = db.tasks.filter((t) => !t.done && t.due && diff(t.due) <= 0).length;
  const pendingAssignments = db.assign.filter((a) => !a.done).length;
  const nextExam = db.events
    .filter((e) => e.type === 'Exam' && diff(e.date) >= 0)
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  const spentThisMonth = getSpentForMonth(db.tx, month()).reduce((s, t) => s + (t.amt || 0), 0);
  const tasksDone = db.tasks.filter((t) => t.done).length;
  const showBackupWarning = needsBackupWarning(db);

  const todayDateString = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  const cards = [
    { id: 'personal', label: 'Personal' },
    { id: 'college', label: 'College' },
    { id: 'money', label: 'Money' },
    { id: 'reports', label: 'Reports' }
  ];

  const handleBackupNow = () => {
    exportBackup(db);
    onUpdateDb({ ...db, bk: Date.now() });
    triggerHaptic('success', db.haptics);
    if (onToast) onToast('Backup file downloaded!');
  };

  return (
    <div>
      {/* Top Header */}
      <div className="top" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          className="bk"
          onClick={() => {
            triggerHaptic('light', db.haptics);
            onOpenMenu();
          }}
          aria-label="Menu"
          style={{ flexShrink: 0 }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <img src="/logo.png" alt="MyLife" style={{ width: '30px', height: '30px', borderRadius: '8px' }} />
          <h1 style={{ margin: 0, fontSize: '1.45rem' }}>MYLIFE</h1>
        </div>

        {/* Global Search Button in Header */}
        <button
          className="bk"
          onClick={() => {
            triggerHaptic('light', db.haptics);
            onOpenSearch();
          }}
          aria-label="Search"
          title="Search (Cmd+K)"
          style={{ flexShrink: 0 }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </button>
      </div>

      {/* Date */}
      <div className="m" style={{ textAlign: 'center' }}>{todayDateString}</div>

      {/* Backup Warning Banner (Point 4, Item 2) */}
      {showBackupWarning && (
        <div className="c warn" style={{ marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <div>
            <b>Backup recommended</b>
            <div className="m" style={{ fontSize: '0.8rem' }}>Your data lives only on this device.</div>
          </div>
          <button
            onClick={handleBackupNow}
            className="p"
            style={{ fontSize: '0.78rem', padding: '4px 10px', minHeight: '34px', shrink: 0 }}
          >
            Back up
          </button>
        </div>
      )}

      {/* Birthday Alerts */}
      {soonBdays.map((b) => (
        <div key={b.id} className="c warn" style={{ marginTop: '8px' }}>
          <b>{b.name}</b> · birthday {b.n === 0 ? 'is today' : b.n === 1 ? 'is tomorrow' : `in ${b.n} days`}
        </div>
      ))}

      {/* 2x2 Grid of Cards */}
      <div className="g" style={{ marginTop: '12px' }}>
        {cards.map((c) => (
          <a
            key={c.id}
            className="c t"
            onClick={() => {
              triggerHaptic('light', db.haptics);
              onNavigate(c.id);
            }}
            tabIndex={0}
            style={{ padding: '22px 14px' }}
          >
            <div style={{ marginBottom: '8px' }}>
              <Icon name={c.id} size={30} />
            </div>
            <div className="big">{c.label}</div>
          </a>
        ))}
      </div>

      {/* Dashboard Section */}
      <h2>Dashboard</h2>
      <div>
        {/* Personal row */}
        <a
          className="t"
          onClick={() => {
            triggerHaptic('light', db.haptics);
            onNavigate('personal');
          }}
          tabIndex={0}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '10px',
            padding: '12px 0',
            borderBottom: '1px solid var(--l)'
          }}
        >
          <b style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Icon name="personal" size={22} />
            Personal
          </b>
          <span className="m">
            {dueTodayTasks} due today
            {soonBdays.length > 0 ? ` · ${soonBdays.length} birthday${soonBdays.length > 1 ? 's' : ''} soon` : ''}
          </span>
        </a>

        {/* College row */}
        <a
          className="t"
          onClick={() => {
            triggerHaptic('light', db.haptics);
            onNavigate('college');
          }}
          tabIndex={0}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '10px',
            padding: '12px 0',
            borderBottom: '1px solid var(--l)'
          }}
        >
          <b style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Icon name="college" size={22} />
            College
          </b>
          <span className="m">
            {nextExam ? `${nextExam.title} · ${when(nextExam.date)}` : `${pendingAssignments} assignments pending`}
          </span>
        </a>

        {/* Money row */}
        <a
          className="t"
          onClick={() => {
            triggerHaptic('light', db.haptics);
            onNavigate('money');
          }}
          tabIndex={0}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '10px',
            padding: '12px 0',
            borderBottom: '1px solid var(--l)'
          }}
        >
          <b style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Icon name="money" size={22} />
            Money
          </b>
          <span className="m">
            {fmt(spentThisMonth, db.cur)} spent this month
          </span>
        </a>

        {/* Reports row */}
        <a
          className="t"
          onClick={() => {
            triggerHaptic('light', db.haptics);
            onNavigate('reports');
          }}
          tabIndex={0}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '10px',
            padding: '12px 0',
            borderBottom: '1px solid var(--l)'
          }}
        >
          <b style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Icon name="reports" size={22} />
            Reports
          </b>
          <span className="m">
            {tasksDone} tasks done · {pendingAssignments} assignments pending
          </span>
        </a>
      </div>

      {/* Floating Speed Add Button (Point 1, Item 3) */}
      <button
        onClick={() => {
          triggerHaptic('medium', db.haptics);
          onOpenSpeedAdd();
        }}
        aria-label="Speed Add"
        style={{
          position: 'fixed',
          right: '20px',
          bottom: 'calc(76px + env(safe-area-inset-bottom, 0px))',
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          background: 'var(--a)',
          color: 'var(--bg)',
          display: 'grid',
          placeItems: 'center',
          boxShadow: '0 6px 20px rgba(0,0,0,0.6)',
          zIndex: 25,
          border: 'none',
          padding: 0
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
    </div>
  );
}
