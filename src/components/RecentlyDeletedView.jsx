import React, { useState } from 'react';
import Icon from './Icons';
import { fmt, triggerHaptic } from '../utils/storage';

export default function RecentlyDeletedView({ db, onUpdateDb, onToast }) {
  const [filter, setFilter] = useState('all'); // 'all' | 'tasks' | 'money' | 'college' | 'personal'
  const deleted = db.deleted || [];

  const handleRestore = (entry) => {
    triggerHaptic('success', db.haptics);
    const { type, item, id } = entry;

    onUpdateDb((prev) => {
      const nextDb = {
        ...prev,
        deleted: (prev.deleted || []).filter((d) => d.id !== id)
      };

      if (type === 'task') {
        nextDb.tasks = [item, ...(prev.tasks || [])];
      } else if (type === 'tx') {
        nextDb.tx = [item, ...(prev.tx || [])];
      } else if (type === 'exam') {
        nextDb.events = [item, ...(prev.events || [])];
      } else if (type === 'assign') {
        nextDb.assign = [item, ...(prev.assign || [])];
      } else if (type === 'note') {
        nextDb.notes = [item, ...(prev.notes || [])];
      } else if (type === 'bday') {
        nextDb.bdays = [item, ...(prev.bdays || [])];
      } else if (type === 'password') {
        nextDb.passwords = [item, ...(prev.passwords || [])];
      }

      return nextDb;
    });

    const label = item?.title || item?.name || item?.service || item?.note || (item?.amt ? fmt(item.amt, db.cur) : 'Item');
    if (onToast) onToast(`Restored "${label}"`);
  };

  const handlePermanentDelete = (id) => {
    triggerHaptic('warning', db.haptics);
    onUpdateDb((prev) => ({
      ...prev,
      deleted: (prev.deleted || []).filter((d) => d.id !== id)
    }));
    if (onToast) onToast('Item permanently deleted.');
  };

  const handleEmptyTrash = () => {
    if (deleted.length === 0) return;
    if (confirm('Permanently delete all items in Recently Deleted? This cannot be undone.')) {
      triggerHaptic('warning', db.haptics);
      onUpdateDb((prev) => ({
        ...prev,
        deleted: []
      }));
      if (onToast) onToast('Trash emptied.');
    }
  };

  const getItemCategory = (type) => {
    if (type === 'task') return 'tasks';
    if (type === 'tx') return 'money';
    if (type === 'exam' || type === 'assign') return 'college';
    return 'personal'; // note, bday, password
  };

  const filteredItems = deleted.filter((d) => {
    if (filter === 'all') return true;
    return getItemCategory(d.type) === filter;
  });

  const counts = {
    all: deleted.length,
    tasks: deleted.filter((d) => getItemCategory(d.type) === 'tasks').length,
    money: deleted.filter((d) => getItemCategory(d.type) === 'money').length,
    college: deleted.filter((d) => getItemCategory(d.type) === 'college').length,
    personal: deleted.filter((d) => getItemCategory(d.type) === 'personal').length
  };

  const renderItemDetails = (entry) => {
    const { type, item } = entry;
    if (!item) return <div className="m">Unknown item</div>;

    if (type === 'task') {
      return (
        <div>
          <b>{item.title}</b>
          <div className="m" style={{ fontSize: '0.8rem' }}>
            {item.due ? `Due: ${item.due}` : 'No due date'}
            {item.imp ? ' · Important' : ''}
          </div>
        </div>
      );
    }

    if (type === 'tx') {
      const isExp = item.type === 'expense';
      return (
        <div>
          <b>
            <span style={{ color: isExp ? 'var(--bad)' : 'var(--ok)' }}>
              {isExp ? '-' : '+'}{fmt(item.amt, db.cur)}
            </span>
            {' '}· {item.cat || item.source || 'Transaction'}
          </b>
          {item.note && <div className="m" style={{ fontSize: '0.8rem' }}>{item.note}</div>}
          <div className="m" style={{ fontSize: '0.75rem' }}>{item.date}</div>
        </div>
      );
    }

    if (type === 'exam') {
      return (
        <div>
          <b>Exam: {item.title}</b>
          <div className="m" style={{ fontSize: '0.8rem' }}>Date: {item.date}</div>
        </div>
      );
    }

    if (type === 'assign') {
      return (
        <div>
          <b>Assignment: {item.title}</b>
          <div className="m" style={{ fontSize: '0.8rem' }}>
            {item.due ? `Due: ${item.due}` : 'No due date'}
          </div>
        </div>
      );
    }

    if (type === 'note') {
      return (
        <div>
          <b>{item.t ? (item.t.length > 60 ? item.t.slice(0, 60) + '…' : item.t) : 'Empty note'}</b>
          <div className="m" style={{ fontSize: '0.8rem' }}>Created: {item.d || 'Recent'}</div>
        </div>
      );
    }

    if (type === 'bday') {
      return (
        <div>
          <b>Birthday: {item.name}</b>
          <div className="m" style={{ fontSize: '0.8rem' }}>Date: {item.date}</div>
        </div>
      );
    }

    if (type === 'password') {
      return (
        <div>
          <b>Password: {item.service}</b>
          {item.user && <div className="m" style={{ fontSize: '0.8rem' }}>Username: {item.user}</div>}
        </div>
      );
    }

    return <div><b>Item</b></div>;
  };

  const getBadge = (type) => {
    const labels = {
      task: 'Task',
      tx: 'Money',
      exam: 'Exam',
      assign: 'Assignment',
      note: 'Note',
      bday: 'Birthday',
      password: 'Vault'
    };
    return labels[type] || 'Item';
  };

  const formatDeletedTime = (isoString) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  return (
    <div>
      {/* Header bar with count & Empty Trash */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div className="m" style={{ fontSize: '0.85rem' }}>
          {deleted.length} {deleted.length === 1 ? 'item' : 'items'} in trash
        </div>
        {deleted.length > 0 && (
          <button
            type="button"
            onClick={handleEmptyTrash}
            style={{
              padding: '4px 10px',
              minHeight: '32px',
              fontSize: '0.8rem',
              color: 'var(--bad)',
              borderColor: 'var(--bad)'
            }}
          >
            Empty Trash
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="tabs">
        {[
          { id: 'all', label: `All (${counts.all})` },
          { id: 'tasks', label: `Tasks (${counts.tasks})` },
          { id: 'money', label: `Money (${counts.money})` },
          { id: 'college', label: `College (${counts.college})` },
          { id: 'personal', label: `Personal (${counts.personal})` }
        ].map((t) => (
          <button
            key={t.id}
            aria-pressed={filter === t.id}
            onClick={() => {
              triggerHaptic('light', db.haptics);
              setFilter(t.id);
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Items List */}
      <div style={{ marginTop: '12px' }}>
        {filteredItems.length > 0 ? (
          filteredItems.map((entry) => (
            <div
              key={entry.id}
              className="c"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                padding: '12px 14px'
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: 'var(--s)',
                      border: '1px solid var(--l)',
                      color: 'var(--m)'
                    }}
                  >
                    {getBadge(entry.type)}
                  </span>
                  <span className="m" style={{ fontSize: '0.72rem' }}>
                    {formatDeletedTime(entry.deletedAt)}
                  </span>
                </div>
                {renderItemDetails(entry)}
              </div>

              {/* Actions: Restore & Permanent Delete */}
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', shrink: 0 }}>
                <button
                  type="button"
                  className="p"
                  onClick={() => handleRestore(entry)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.8rem',
                    minHeight: '34px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="Restore this item"
                >
                  Restore
                </button>
                <button
                  type="button"
                  onClick={() => handlePermanentDelete(entry.id)}
                  style={{
                    padding: '6px 10px',
                    fontSize: '0.8rem',
                    minHeight: '34px',
                    color: 'var(--bad)',
                    borderColor: 'var(--l)'
                  }}
                  aria-label="Delete permanently"
                  title="Delete permanently"
                >
                  ✕
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state" style={{ textAlign: 'center', padding: '40px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px', opacity: 0.5 }}>
              <Icon name="deleted" size={48} />
            </div>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '1.05rem' }}>
              {filter === 'all' ? 'Trash is empty' : `No deleted ${filter} items`}
            </h3>
            <p className="m" style={{ fontSize: '0.85rem', margin: 0 }}>
              Items you delete will appear here so you can restore them anytime.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
