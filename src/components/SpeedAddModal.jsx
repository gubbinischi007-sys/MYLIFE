import React, { useState } from 'react';
import { CATS, today, triggerHaptic } from '../utils/storage';

export default function SpeedAddModal({ isOpen, onClose, defaultTab = 'task', db, onUpdateDb, onToast }) {
  const [tab, setTab] = useState(defaultTab); // 'task' | 'expense' | 'note'

  // Task fields
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDue, setTaskDue] = useState(today());
  const [taskImp, setTaskImp] = useState(false);

  // Expense fields
  const [expenseAmt, setExpenseAmt] = useState('');
  const [expenseCat, setExpenseCat] = useState(CATS[0]);
  const [expenseNote, setExpenseNote] = useState('');

  // Note fields
  const [noteText, setNoteText] = useState('');

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();

    if (tab === 'task') {
      if (!taskTitle.trim()) return alert('Enter a task description.');
      const newTask = {
        id: Date.now(),
        title: taskTitle.trim(),
        due: taskDue,
        rep: '',
        imp: taskImp,
        done: false
      };
      onUpdateDb({ ...db, tasks: [newTask, ...db.tasks] });
      setTaskTitle('');
      triggerHaptic('success', db.haptics);
      onToast('Task added!');
    } else if (tab === 'expense') {
      const amt = parseFloat(expenseAmt);
      if (!amt || amt <= 0) return alert('Enter a valid amount.');
      const newTx = {
        id: Date.now(),
        type: 'expense',
        amt,
        cat: expenseCat,
        note: expenseNote.trim(),
        date: today(),
        img: null
      };
      onUpdateDb({ ...db, tx: [newTx, ...db.tx] });
      setExpenseAmt('');
      setExpenseNote('');
      triggerHaptic('success', db.haptics);
      onToast('Expense logged!');
    } else if (tab === 'note') {
      if (!noteText.trim()) return alert('Write something first.');
      const newNote = {
        id: Date.now(),
        t: noteText.trim(),
        d: today()
      };
      onUpdateDb({ ...db, notes: [newNote, ...db.notes] });
      setNoteText('');
      triggerHaptic('success', db.haptics);
      onToast('Note saved!');
    }

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] flex items-end justify-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[640px] bg-[#111111] border-t border-[#2e2e2e] rounded-t-2xl p-5 shadow-2xl animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#242424]">
          <h3 className="text-base font-bold text-white tracking-tight">Quick Add</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-white/60 flex items-center justify-center text-white hover:bg-white hover:text-black transition"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Tab Pills */}
        <div className="tabs" style={{ marginTop: '12px' }}>
          {[
            { id: 'task', label: '+ Task' },
            { id: 'expense', label: '+ Expense' },
            { id: 'note', label: '+ Note' }
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={tab === t.id}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="space-y-3 pt-2">
          {tab === 'task' && (
            <>
              <input
                type="text"
                autoFocus
                placeholder="What needs doing?"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                className="w-full"
              />
              <div className="r">
                <input
                  type="date"
                  value={taskDue}
                  onChange={(e) => setTaskDue(e.target.value)}
                  style={{ flex: 1 }}
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', padding: '0 8px' }}>
                  <input
                    type="checkbox"
                    checked={taskImp}
                    onChange={(e) => setTaskImp(e.target.checked)}
                  />
                  <span>Important</span>
                </label>
              </div>
            </>
          )}

          {tab === 'expense' && (
            <>
              <div className="r">
                <input
                  type="number"
                  step="0.01"
                  autoFocus
                  placeholder="Amount"
                  value={expenseAmt}
                  onChange={(e) => setExpenseAmt(e.target.value)}
                  style={{ flex: 1 }}
                />
                <select
                  value={expenseCat}
                  onChange={(e) => setExpenseCat(e.target.value)}
                  style={{ width: '130px' }}
                >
                  {CATS.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <input
                type="text"
                placeholder="Note (optional)"
                value={expenseNote}
                onChange={(e) => setExpenseNote(e.target.value)}
                className="w-full"
              />
            </>
          )}

          {tab === 'note' && (
            <textarea
              autoFocus
              rows={3}
              placeholder="Write down a thought, reminder or note..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="w-full bg-[#111111] border border-[#2e2e2e] rounded-lg p-3 text-white text-sm focus:outline-none"
            />
          )}

          <div style={{ paddingTop: '8px' }}>
            <button
              type="submit"
              className="p w-full py-2.5"
            >
              Save Now
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

