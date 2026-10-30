import React, { useState, useEffect } from 'react';
import Icon from './Icons';
import { diff, when, nextDue, bd, getSoonBirthdays, today, triggerHaptic } from '../utils/storage';

export default function PersonalView({ db, onUpdateDb, currentSubtab, onSubtabChange, onToast, onToastWithUndo }) {
  const [taskFilter, setTaskFilter] = useState('today'); // 'today' | 'up' | 'imp' | 'done'

  // Task form state
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDue, setTaskDue] = useState(today());
  const [taskRepeat, setTaskRepeat] = useState('');
  const [taskImp, setTaskImp] = useState(false);

  // Birthday form state
  const [editingBdayId, setEditingBdayId] = useState(null);
  const [bdayName, setBdayName] = useState('');
  const [bdayDate, setBdayDate] = useState('');

  // Note form state
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [noteText, setNoteText] = useState('');

  // Password & Vault form state
  const [editingPwdId, setEditingPwdId] = useState(null);
  const [pwdSearch, setPwdSearch] = useState('');
  const [isVaultUnlocked, setIsVaultUnlocked] = useState(false);
  const [setupMaster, setSetupMaster] = useState('');
  const [setupConfirm, setSetupConfirm] = useState('');
  const [setupError, setSetupError] = useState('');
  const [unlockInput, setUnlockInput] = useState('');
  const [unlockError, setUnlockError] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const [pwdService, setPwdService] = useState('');
  const [pwdUser, setPwdUser] = useState('');
  const [pwdPass, setPwdPass] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [showMap, setShowMap] = useState({});

  // Auto-lock vault when leaving the passwords tab or resetting editing
  useEffect(() => {
    if (currentSubtab !== 'passwords') {
      setIsVaultUnlocked(false);
      setUnlockInput('');
      setUnlockError('');
      setDeleteConfirmId(null);
      setEditingPwdId(null);
      setPwdSearch('');
    }
    if (currentSubtab !== 'tasks') {
      setEditingTaskId(null);
    }
    if (currentSubtab !== 'bday') {
      setEditingBdayId(null);
    }
    if (currentSubtab !== 'notes') {
      setEditingNoteId(null);
    }
  }, [currentSubtab]);

  const soonBdays = getSoonBirthdays(db.bdays);
  const openTasksCount = db.tasks.filter((x) => !x.done).length;
  const bdaysCount = db.bdays.length;
  const notesCount = db.notes.length;

  // ---------------- TASKS ----------------
  const handleStartEditTask = (task) => {
    setEditingTaskId(task.id);
    setTaskTitle(task.title || '');
    setTaskDue(task.due || '');
    setTaskRepeat(task.rep || '');
    setTaskImp(Boolean(task.imp));
    triggerHaptic('light', db.haptics);
  };

  const handleCancelEditTask = () => {
    setEditingTaskId(null);
    setTaskTitle('');
    setTaskDue(today());
    setTaskRepeat('');
    setTaskImp(false);
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    if (editingTaskId) {
      onUpdateDb((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === editingTaskId
            ? { ...t, title: taskTitle.trim(), due: taskDue, rep: taskRepeat, imp: taskImp }
            : t
        )
      }));
      handleCancelEditTask();
      triggerHaptic('success', db.haptics);
      if (onToast) onToast('Changes saved.');
      return;
    }

    const newTask = {
      id: Date.now(),
      title: taskTitle.trim(),
      due: taskDue,
      rep: taskRepeat,
      imp: taskImp,
      done: false
    };
    onUpdateDb((prev) => ({
      ...prev,
      tasks: [newTask, ...prev.tasks]
    }));
    setTaskTitle('');
    triggerHaptic('success', db.haptics);
  };

  const handleToggleTask = (id) => {
    triggerHaptic('medium', db.haptics);
    onUpdateDb((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => {
        if (t.id === id) {
          if (t.rep && !t.done && t.due) {
            return { ...t, due: nextDue(t.due, t.rep) };
          }
          return { ...t, done: !t.done };
        }
        return t;
      })
    }));
  };

  const handleDeleteTask = (id) => {
    const idx = db.tasks.findIndex((t) => t.id === id);
    if (idx === -1) return;
    const deletedTask = db.tasks[idx];

    triggerHaptic('light', db.haptics);
    onUpdateDb((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== id)
    }));

    if (editingTaskId === id) {
      handleCancelEditTask();
    }

    if (onToastWithUndo) {
      onToastWithUndo('Deleted.', () => {
        onUpdateDb((prev) => {
          const nextTasks = [...prev.tasks];
          const targetIdx = Math.min(idx, nextTasks.length);
          nextTasks.splice(targetIdx, 0, deletedTask);
          return { ...prev, tasks: nextTasks };
        });
      });
    }
  };

  // ---------------- BIRTHDAYS ----------------
  const handleStartEditBday = (b) => {
    setEditingBdayId(b.id);
    setBdayName(b.name || '');
    setBdayDate(b.date || '');
    triggerHaptic('light', db.haptics);
  };

  const handleCancelEditBday = () => {
    setEditingBdayId(null);
    setBdayName('');
    setBdayDate('');
  };

  const handleAddBday = (e) => {
    e.preventDefault();
    if (!bdayName.trim() || !bdayDate) return;

    if (editingBdayId) {
      onUpdateDb((prev) => ({
        ...prev,
        bdays: prev.bdays.map((b) =>
          b.id === editingBdayId ? { ...b, name: bdayName.trim(), date: bdayDate } : b
        )
      }));
      handleCancelEditBday();
      triggerHaptic('success', db.haptics);
      if (onToast) onToast('Changes saved.');
      return;
    }

    const newBday = {
      id: Date.now(),
      name: bdayName.trim(),
      date: bdayDate
    };
    onUpdateDb((prev) => ({
      ...prev,
      bdays: [...prev.bdays, newBday]
    }));
    setBdayName('');
    setBdayDate('');
    triggerHaptic('success', db.haptics);
  };

  const handleDeleteBday = (id) => {
    const idx = db.bdays.findIndex((b) => b.id === id);
    if (idx === -1) return;
    const deletedBday = db.bdays[idx];

    triggerHaptic('light', db.haptics);
    onUpdateDb((prev) => ({
      ...prev,
      bdays: prev.bdays.filter((b) => b.id !== id)
    }));

    if (editingBdayId === id) {
      handleCancelEditBday();
    }

    if (onToastWithUndo) {
      onToastWithUndo('Deleted.', () => {
        onUpdateDb((prev) => {
          const nextBdays = [...prev.bdays];
          const targetIdx = Math.min(idx, nextBdays.length);
          nextBdays.splice(targetIdx, 0, deletedBday);
          return { ...prev, bdays: nextBdays };
        });
      });
    }
  };

  // ---------------- NOTES ----------------
  const handleStartEditNote = (n) => {
    setEditingNoteId(n.id);
    setNoteText(n.t || '');
    triggerHaptic('light', db.haptics);
  };

  const handleCancelEditNote = () => {
    setEditingNoteId(null);
    setNoteText('');
  };

  const handleAddNote = (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    if (editingNoteId) {
      onUpdateDb((prev) => ({
        ...prev,
        notes: prev.notes.map((n) =>
          n.id === editingNoteId ? { ...n, t: noteText.trim() } : n
        )
      }));
      handleCancelEditNote();
      triggerHaptic('success', db.haptics);
      if (onToast) onToast('Changes saved.');
      return;
    }

    const newNote = {
      id: Date.now(),
      t: noteText.trim(),
      d: today()
    };
    onUpdateDb((prev) => ({
      ...prev,
      notes: [newNote, ...prev.notes]
    }));
    setNoteText('');
    triggerHaptic('success', db.haptics);
  };

  const handleDeleteNote = (id) => {
    const idx = db.notes.findIndex((n) => n.id === id);
    if (idx === -1) return;
    const deletedNote = db.notes[idx];

    triggerHaptic('light', db.haptics);
    onUpdateDb((prev) => ({
      ...prev,
      notes: prev.notes.filter((n) => n.id !== id)
    }));

    if (editingNoteId === id) {
      handleCancelEditNote();
    }

    if (onToastWithUndo) {
      onToastWithUndo('Deleted.', () => {
        onUpdateDb((prev) => {
          const nextNotes = [...prev.notes];
          const targetIdx = Math.min(idx, nextNotes.length);
          nextNotes.splice(targetIdx, 0, deletedNote);
          return { ...prev, notes: nextNotes };
        });
      });
    }
  };

  // ---------------- PASSWORDS & VAULT ----------------
  const handleCreateMaster = (e) => {
    e.preventDefault();
    if (setupMaster.length < 6) {
      setSetupError('Master password must be at least 6 characters.');
      triggerHaptic('warning', db.haptics);
      return;
    }
    if (setupMaster !== setupConfirm) {
      setSetupError('Passwords do not match. Please try again.');
      triggerHaptic('warning', db.haptics);
      return;
    }
    onUpdateDb((prev) => ({
      ...prev,
      vaultMaster: setupMaster
    }));
    setIsVaultUnlocked(true);
    setSetupMaster('');
    setSetupConfirm('');
    setSetupError('');
    triggerHaptic('success', db.haptics);
    if (onToast) onToast('Master password set! Vault unlocked.');
  };

  const handleUnlockVault = (e) => {
    e.preventDefault();
    if (unlockInput === db.vaultMaster) {
      setIsVaultUnlocked(true);
      setUnlockInput('');
      setUnlockError('');
      triggerHaptic('success', db.haptics);
      if (onToast) onToast('Vault unlocked.');
    } else {
      setUnlockError('Incorrect master password.');
      triggerHaptic('warning', db.haptics);
    }
  };

  const handleLockVault = () => {
    setIsVaultUnlocked(false);
    setUnlockInput('');
    setUnlockError('');
    setDeleteConfirmId(null);
    setEditingPwdId(null);
    triggerHaptic('light', db.haptics);
    if (onToast) onToast('Vault locked.');
  };

  const handleEraseVault = () => {
    if (confirm('Erase vault? This will delete all saved passwords and reset your master password.')) {
      onUpdateDb((prev) => ({
        ...prev,
        vaultMaster: '',
        passwords: []
      }));
      setIsVaultUnlocked(false);
      setUnlockInput('');
      setUnlockError('');
      setEditingPwdId(null);
      triggerHaptic('warning', db.haptics);
      if (onToast) onToast('Vault erased. You can set a new master password.');
    }
  };

  const handleStartEditPwd = (p) => {
    setEditingPwdId(p.id);
    setPwdService(p.service || '');
    setPwdUser(p.user || '');
    setPwdPass(p.pass || '');
    setShowNewPass(false);
    triggerHaptic('light', db.haptics);
  };

  const handleCancelEditPwd = () => {
    setEditingPwdId(null);
    setPwdService('');
    setPwdUser('');
    setPwdPass('');
    setShowNewPass(false);
  };

  const handleAddPassword = (e) => {
    e.preventDefault();
    if (!pwdService.trim()) {
      alert('Please enter which account it is for (for example “Gmail”).');
      return;
    }
    if (!pwdPass) {
      alert('Please enter or generate a password.');
      return;
    }

    if (editingPwdId) {
      onUpdateDb((prev) => ({
        ...prev,
        passwords: (prev.passwords || []).map((p) =>
          p.id === editingPwdId
            ? { ...p, service: pwdService.trim(), user: pwdUser.trim(), pass: pwdPass }
            : p
        )
      }));
      handleCancelEditPwd();
      triggerHaptic('success', db.haptics);
      if (onToast) onToast('Changes saved.');
      return;
    }

    const newEntry = {
      id: Date.now(),
      service: pwdService.trim(),
      user: pwdUser.trim(),
      pass: pwdPass,
      date: today()
    };
    onUpdateDb((prev) => ({
      ...prev,
      passwords: [newEntry, ...(prev.passwords || [])]
    }));
    setPwdService('');
    setPwdUser('');
    setPwdPass('');
    setShowNewPass(false);
    triggerHaptic('success', db.haptics);
    if (onToast) onToast('Entry added to vault!');
  };

  // Two-tap delete for sensitive passwords
  const handleDeleteClick = (id) => {
    if (deleteConfirmId === id) {
      onUpdateDb((prev) => ({
        ...prev,
        passwords: (prev.passwords || []).filter((p) => p.id !== id)
      }));
      if (editingPwdId === id) {
        handleCancelEditPwd();
      }
      setDeleteConfirmId(null);
      triggerHaptic('light', db.haptics);
      if (onToast) onToast('Entry deleted.');
    } else {
      setDeleteConfirmId(id);
      triggerHaptic('warning', db.haptics);
      setTimeout(() => {
        setDeleteConfirmId((prev) => (prev === id ? null : prev));
      }, 4000);
    }
  };

  const handleCopyText = (text, label = 'Password') => {
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    triggerHaptic('success', db.haptics);
    if (onToast) onToast(`${label} copied!`);
  };

  const handleGeneratePassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*';
    let res = '';
    for (let i = 0; i < 16; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPwdPass(res);
    setShowNewPass(true);
    triggerHaptic('light', db.haptics);
    if (onToast) onToast('Generated 16-character password!');
  };

  const toggleShowPassword = (id) => {
    triggerHaptic('light', db.haptics);
    setShowMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Filtered collections
  const filteredTasks = db.tasks.filter((t) => {
    if (taskFilter === 'done') return t.done;
    if (t.done) return false;
    if (taskFilter === 'today') return (t.due && diff(t.due) <= 0) || !t.due;
    if (taskFilter === 'imp') return t.imp;
    if (taskFilter === 'up') return t.due && diff(t.due) > 0;
    return true;
  }).sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999'));

  const sortedBdays = db.bdays
    .map((b) => ({ ...b, ...bd(b) }))
    .sort((a, b) => a.n - b.n);

  const passwordsList = db.passwords || [];
  const filteredPasswords = passwordsList.filter((p) => {
    if (!pwdSearch.trim()) return true;
    const q = pwdSearch.toLowerCase();
    return (p.service || '').toLowerCase().includes(q) || (p.user || '').toLowerCase().includes(q);
  });

  const tabs = [
    { id: 'tasks', label: 'Tasks', count: `${openTasksCount} open`, icon: 'tasks' },
    { id: 'bday', label: 'Birthdays', count: `${bdaysCount} saved`, icon: 'bday' },
    { id: 'notes', label: 'Notes', count: `${notesCount} notes`, icon: 'notes' },
    {
      id: 'passwords',
      label: 'Passwords',
      count: db.vaultMaster ? 'Encrypted' : 'Not set up',
      icon: 'passwords'
    }
  ];

  return (
    <div>
      {/* Birthday alerts banner */}
      {soonBdays.map((b) => (
        <div key={b.id} className="c warn">
          <b>{b.name}</b> · birthday {b.n === 0 ? 'is today' : b.n === 1 ? 'is tomorrow' : `in ${b.n} days`}
        </div>
      ))}

      {/* Tabs */}
      <div className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            aria-pressed={currentSubtab === tab.id}
            onClick={() => {
              triggerHaptic('light', db.haptics);
              onSubtabChange(currentSubtab === tab.id ? null : tab.id);
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* When no subtab is selected: show the 4 cards grid */}
      {!currentSubtab && (
        <div className="g" style={{ marginTop: '8px' }}>
          {tabs.map((tab) => (
            <a
              key={tab.id}
              className="c t"
              onClick={() => {
                triggerHaptic('light', db.haptics);
                onSubtabChange(tab.id);
              }}
              tabIndex={0}
              style={{ cursor: 'pointer' }}
            >
              <div style={{ marginBottom: '8px' }}>
                <Icon name={tab.icon} size={28} />
              </div>
              <div className="big">{tab.label}</div>
              <div className="m">{tab.count}</div>
            </a>
          ))}
        </div>
      )}

      {/* TASKS SUBTAB */}
      {currentSubtab === 'tasks' && (
        <div>
          <h2>Tasks</h2>
          <form onSubmit={handleAddTask} className="c">
            <div className="r">
              <input
                id="tt"
                type="text"
                placeholder="What needs doing?"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
              />
              <input
                id="td"
                type="date"
                aria-label="Due date"
                value={taskDue}
                onChange={(e) => setTaskDue(e.target.value)}
              />
            </div>
            <div className="r">
              <select
                id="tr"
                aria-label="Repeat"
                value={taskRepeat}
                onChange={(e) => setTaskRepeat(e.target.value)}
              >
                <option value="">No repeat</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  id="ti"
                  type="checkbox"
                  checked={taskImp}
                  onChange={(e) => setTaskImp(e.target.checked)}
                />
                <span>Important</span>
              </label>

              {editingTaskId ? (
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                  <button type="button" onClick={handleCancelEditTask}>
                    Cancel
                  </button>
                  <button type="submit" className="p">
                    Save changes
                  </button>
                </div>
              ) : (
                <button type="submit" className="p" style={{ marginLeft: 'auto' }}>
                  Add task
                </button>
              )}
            </div>
          </form>

          <div className="tabs">
            {[
              { id: 'today', label: 'Today' },
              { id: 'up', label: 'Upcoming' },
              { id: 'imp', label: 'Important' },
              { id: 'done', label: 'Done' }
            ].map((f) => (
              <button
                key={f.id}
                aria-pressed={taskFilter === f.id}
                onClick={() => {
                  triggerHaptic('light', db.haptics);
                  setTaskFilter(f.id);
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div>
            {filteredTasks.length > 0 ? (
              filteredTasks.map((t) => (
                <div key={t.id} className={`c i ${t.done ? 'done' : ''}`}>
                  <div>
                    <b>
                      {t.imp ? '★ ' : ''}
                      {t.title}
                    </b>
                    <div className="m">
                      {t.due ? when(t.due) : 'No date'}
                      {t.rep ? ` · repeats ${t.rep}` : ''}
                    </div>
                  </div>
                  <div className="r" style={{ margin: 0, gap: '6px' }}>
                    <button onClick={() => handleToggleTask(t.id)}>
                      {t.done ? 'Undo' : 'Done'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStartEditTask(t)}
                      aria-label="Edit"
                      title="Edit"
                      style={{ padding: '4px 8px', minHeight: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Icon name="edit" size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteTask(t.id)}
                      aria-label="Delete"
                      style={{ padding: '4px 8px', minHeight: '36px' }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <Icon name="tasks" size={40} />
                <p>{db.tasks.length === 0 ? 'No tasks yet. Add one above.' : 'No tasks in this view.'}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* BIRTHDAYS SUBTAB */}
      {currentSubtab === 'bday' && (
        <div>
          <h2>Birthdays</h2>
          <form onSubmit={handleAddBday} className="c">
            <div className="r">
              <input
                id="bn"
                type="text"
                placeholder="Name"
                value={bdayName}
                onChange={(e) => setBdayName(e.target.value)}
              />
              <input
                id="bt"
                type="date"
                aria-label="Birthday"
                value={bdayDate}
                onChange={(e) => setBdayDate(e.target.value)}
              />
            </div>
            <div className="r" style={{ gap: '8px' }}>
              {editingBdayId ? (
                <>
                  <button type="submit" className="p">
                    Save changes
                  </button>
                  <button type="button" onClick={handleCancelEditBday}>
                    Cancel
                  </button>
                </>
              ) : (
                <button type="submit" className="p">
                  Save birthday
                </button>
              )}
            </div>
            <div className="m" style={{ marginTop: '6px' }}>
              Saved on this device until you remove it. Reminders start 7 days before.
            </div>
          </form>

          <div>
            {sortedBdays.length > 0 ? (
              sortedBdays.map((b) => (
                <div key={b.id} className="c i">
                  <div>
                    <b>{b.name}</b>
                    <div className="m">
                      {new Date(b.date + 'T00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'long' })}
                      {b.age > 0 && b.age < 121 ? ` · turns ${b.age}` : ''}
                    </div>
                  </div>
                  <div className="r" style={{ margin: 0, gap: '6px' }}>
                    <b>{b.n === 0 ? 'Today' : b.n === 1 ? 'Tomorrow' : `In ${b.n} days`}</b>
                    <button
                      type="button"
                      onClick={() => handleStartEditBday(b)}
                      aria-label="Edit"
                      title="Edit"
                      style={{ padding: '4px 8px', minHeight: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Icon name="edit" size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteBday(b.id)}
                      aria-label="Delete"
                      style={{ padding: '4px 8px', minHeight: '36px' }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <Icon name="bday" size={40} />
                <p>No birthdays yet. Add one above.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* NOTES SUBTAB */}
      {currentSubtab === 'notes' && (
        <div>
          <h2>Notes</h2>
          <form onSubmit={handleAddNote} className="c">
            <div className="r" style={{ gap: '8px' }}>
              <input
                id="nt"
                type="text"
                placeholder="Write a note"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
              />
              {editingNoteId ? (
                <>
                  <button type="submit" className="p" style={{ whiteSpace: 'nowrap' }}>
                    Save changes
                  </button>
                  <button type="button" onClick={handleCancelEditNote} style={{ whiteSpace: 'nowrap' }}>
                    Cancel
                  </button>
                </>
              ) : (
                <button type="submit" className="p">
                  Save
                </button>
              )}
            </div>
          </form>

          <div>
            {db.notes.length > 0 ? (
              db.notes.map((n) => (
                <div key={n.id} className="c i">
                  <div>
                    {n.t}
                    <div className="m">{n.d}</div>
                  </div>
                  <div className="r" style={{ margin: 0, gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => handleStartEditNote(n)}
                      aria-label="Edit"
                      title="Edit"
                      style={{ padding: '4px 8px', minHeight: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Icon name="edit" size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteNote(n.id)}
                      aria-label="Delete"
                      style={{ padding: '4px 8px', minHeight: '36px' }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <Icon name="notes" size={40} />
                <p>No notes yet. Add one above.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PASSWORDS SUBTAB */}
      {currentSubtab === 'passwords' && (
        <div>
          {!db.vaultMaster ? (
            /* First Time: Create Master Password of at least 6 characters */
            <div className="c" style={{ padding: '24px 18px', textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'var(--s)', border: '1px solid var(--t)', display: 'grid', placeItems: 'center' }}>
                  <Icon name="passwords" size={26} />
                </div>
              </div>
              <h2 style={{ margin: '0 0 6px', fontSize: '1.25rem' }}>Set Master Password</h2>
              <p className="m" style={{ fontSize: '0.85rem', marginBottom: '18px' }}>
                Create a master password of at least 6 characters to secure your personal vault.
              </p>

              <form onSubmit={handleCreateMaster} style={{ textAlign: 'left' }}>
                <div style={{ marginBottom: '10px' }}>
                  <input
                    type="password"
                    placeholder="Master password (at least 6 characters)"
                    value={setupMaster}
                    onChange={(e) => setSetupMaster(e.target.value)}
                    required
                    style={{ width: '100%' }}
                  />
                </div>
                <div style={{ marginBottom: '14px' }}>
                  <input
                    type="password"
                    placeholder="Confirm master password"
                    value={setupConfirm}
                    onChange={(e) => setSetupConfirm(e.target.value)}
                    required
                    style={{ width: '100%' }}
                  />
                </div>

                {setupError && (
                  <p className="m" style={{ color: 'var(--bad)', marginBottom: '12px', fontSize: '0.85rem' }}>
                    {setupError}
                  </p>
                )}

                <button type="submit" className="p" style={{ width: '100%', minHeight: '44px', fontSize: '0.92rem' }}>
                  Create Master Password
                </button>
              </form>
            </div>
          ) : !isVaultUnlocked ? (
            /* Locked State */
            <div className="c" style={{ padding: '16px 14px' }}>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '12px' }}>
                Vault locked
              </div>

              <form onSubmit={handleUnlockVault}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="password"
                    autoFocus
                    placeholder="Master password"
                    value={unlockInput}
                    onChange={(e) => setUnlockInput(e.target.value)}
                    required
                    style={{ flex: 1, minHeight: '44px' }}
                  />
                  <button
                    type="submit"
                    className="p"
                    style={{ minHeight: '44px', padding: '0 20px', fontWeight: 700 }}
                  >
                    Unlock
                  </button>
                </div>

                {unlockError && (
                  <p className="m" style={{ color: 'var(--bad)', marginTop: '8px', fontSize: '0.85rem' }}>
                    {unlockError}
                  </p>
                )}

                <div style={{ marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={handleEraseVault}
                    style={{ fontSize: '0.88rem', padding: '8px 14px', minHeight: '38px', borderRadius: '8px' }}
                  >
                    Forgot it? Erase vault
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Unlocked State */
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <h2 style={{ margin: 0 }}>Password Vault</h2>
                <button
                  type="button"
                  onClick={handleLockVault}
                  style={{ fontSize: '0.82rem', padding: '5px 12px', minHeight: '34px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  🔒 Lock vault
                </button>
              </div>

              {/* Add / Edit Entry Form */}
              <form onSubmit={handleAddPassword} className="c" style={{ padding: '16px', marginBottom: '16px' }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '10px' }}>
                  {editingPwdId ? 'Edit entry' : 'Add an entry'}
                </div>

                <div className="r">
                  <input
                    type="text"
                    placeholder="Account (for example “Gmail”)"
                    value={pwdService}
                    onChange={(e) => setPwdService(e.target.value)}
                    required
                    style={{ flex: 1 }}
                  />
                </div>

                <div className="r">
                  <input
                    type="text"
                    placeholder="Username or email"
                    value={pwdUser}
                    onChange={(e) => setPwdUser(e.target.value)}
                    style={{ flex: 1 }}
                  />
                </div>

                <div className="r">
                  <div style={{ display: 'flex', flex: 1, gap: '6px' }}>
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      placeholder="Password"
                      value={pwdPass}
                      onChange={(e) => setPwdPass(e.target.value)}
                      required
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      style={{ padding: '0 10px', fontSize: '0.82rem' }}
                    >
                      {showNewPass ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    title="Generate 16-character password"
                    style={{ fontSize: '0.82rem', padding: '0 12px', whiteSpace: 'nowrap' }}
                  >
                    Generate
                  </button>
                </div>

                {editingPwdId ? (
                  <div className="r" style={{ marginTop: '12px', gap: '8px' }}>
                    <button type="button" onClick={handleCancelEditPwd} style={{ flex: 1, minHeight: '40px' }}>
                      Cancel
                    </button>
                    <button type="submit" className="p" style={{ flex: 1, minHeight: '40px' }}>
                      Save changes
                    </button>
                  </div>
                ) : (
                  <div className="r" style={{ marginTop: '12px' }}>
                    <button type="submit" className="p" style={{ width: '100%', minHeight: '40px' }}>
                      Save password
                    </button>
                  </div>
                )}
              </form>

              {/* Your List */}
              <div>
                <h2 style={{ margin: '0 0 10px', fontSize: '1rem' }}>
                  Your list ({passwordsList.length})
                </h2>

                {/* Password Search Box (appears when at least one password is saved) */}
                {passwordsList.length > 0 && (
                  <div style={{ marginBottom: '14px', position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, pointerEvents: 'none', display: 'flex' }}>
                      <Icon name="search" size={16} />
                    </div>
                    <input
                      type="text"
                      placeholder="Search account or username..."
                      value={pwdSearch}
                      onChange={(e) => setPwdSearch(e.target.value)}
                      style={{ width: '100%', paddingLeft: '38px', minHeight: '40px' }}
                    />
                  </div>
                )}

                {passwordsList.length === 0 ? (
                  <div className="empty-state">
                    <Icon name="passwords" size={40} />
                    <p>No passwords yet. Add one above.</p>
                  </div>
                ) : filteredPasswords.length === 0 ? (
                  <div className="empty-state">
                    <Icon name="search" size={36} />
                    <p>No matching passwords.</p>
                  </div>
                ) : (
                  filteredPasswords.map((p) => {
                    const isShown = Boolean(showMap[p.id]);
                    const isConfirmingDelete = deleteConfirmId === p.id;

                    return (
                      <div key={p.id} className="c" style={{ padding: '16px', marginBottom: '12px' }}>
                        {/* Account Name */}
                        <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '2px' }}>
                          {p.service}
                        </div>

                        {/* Username */}
                        {p.user && (
                          <div className="m" style={{ fontSize: '0.88rem', marginBottom: '8px' }}>
                            {p.user}
                          </div>
                        )}

                        {/* Password Hidden as Dots */}
                        <div
                          style={{
                            fontFamily: isShown ? 'inherit' : 'monospace',
                            fontSize: isShown ? '1rem' : '1.35rem',
                            letterSpacing: isShown ? 'normal' : '2px',
                            padding: '6px 0',
                            wordBreak: 'break-all'
                          }}
                        >
                          {isShown ? p.pass : '••••••••••••'}
                        </div>

                        {/* Buttons: Show/Hide, Copy, Edit, Delete (with two-tap "Sure?") */}
                        <div style={{ display: 'flex', gap: '8px', marginTop: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={() => toggleShowPassword(p.id)}
                            style={{ fontSize: '0.82rem', padding: '5px 12px', minHeight: '34px' }}
                          >
                            {isShown ? 'Hide' : 'Show'}
                          </button>

                          <button
                            type="button"
                            className="p"
                            onClick={() => handleCopyText(p.pass, 'Password')}
                            style={{ fontSize: '0.82rem', padding: '5px 14px', minHeight: '34px' }}
                          >
                            Copy
                          </button>

                          <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleStartEditPwd(p)}
                              aria-label="Edit"
                              title="Edit"
                              style={{
                                fontSize: '0.82rem',
                                padding: '5px 10px',
                                minHeight: '34px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <Icon name="edit" size={14} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteClick(p.id)}
                              style={{
                                fontSize: '0.82rem',
                                padding: '5px 12px',
                                minHeight: '34px',
                                borderColor: isConfirmingDelete ? 'var(--bad)' : 'var(--l)',
                                background: isConfirmingDelete ? 'var(--bad)' : 'var(--s)',
                                color: isConfirmingDelete ? '#ffffff' : 'var(--m)',
                                fontWeight: isConfirmingDelete ? 700 : 500,
                                transition: 'all 0.15s ease'
                              }}
                            >
                              {isConfirmingDelete ? 'Sure?' : 'Delete'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}