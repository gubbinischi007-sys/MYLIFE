import React, { useState } from 'react';
import Icon from './Icons';
import { diff, when, today, triggerHaptic } from '../utils/storage';

export default function CollegeView({ db, onUpdateDb, onToast, onToastWithUndo }) {
  const [tab, setTab] = useState('ex'); // 'ex' | 'as'

  // Exam form state
  const [editingExamId, setEditingExamId] = useState(null);
  const [examTitle, setExamTitle] = useState('');
  const [examDate, setExamDate] = useState('');

  // Assignment form state
  const [editingAssignId, setEditingAssignId] = useState(null);
  const [assignTitle, setAssignTitle] = useState('');
  const [assignDate, setAssignDate] = useState('');

  // ---------------- EXAMS ----------------
  const handleStartEditExam = (e) => {
    setEditingExamId(e.id);
    setExamTitle(e.title || '');
    setExamDate(e.date || '');
    triggerHaptic('light', db.haptics);
  };

  const handleCancelEditExam = () => {
    setEditingExamId(null);
    setExamTitle('');
    setExamDate('');
  };

  const handleAddExam = (e) => {
    e.preventDefault();
    if (!examTitle.trim() || !examDate) {
      alert('Add a title and a date.');
      return;
    }

    if (editingExamId) {
      onUpdateDb((prev) => ({
        ...prev,
        events: prev.events.map((ev) =>
          ev.id === editingExamId ? { ...ev, title: examTitle.trim(), date: examDate } : ev
        )
      }));
      handleCancelEditExam();
      triggerHaptic('success', db.haptics);
      if (onToast) onToast('Changes saved.');
      return;
    }

    const newExam = {
      id: Date.now(),
      title: examTitle.trim(),
      date: examDate,
      type: 'Exam'
    };
    onUpdateDb((prev) => ({
      ...prev,
      events: [...prev.events, newExam]
    }));
    setExamTitle('');
    setExamDate('');
    triggerHaptic('success', db.haptics);
  };

  const handleDeleteExam = (id) => {
    const idx = db.events.findIndex((e) => e.id === id);
    if (idx === -1) return;
    const deletedExam = db.events[idx];

    triggerHaptic('light', db.haptics);
    onUpdateDb((prev) => ({
      ...prev,
      events: prev.events.filter((e) => e.id !== id)
    }));

    if (editingExamId === id) {
      handleCancelEditExam();
    }

    if (onToastWithUndo) {
      onToastWithUndo('Deleted.', () => {
        onUpdateDb((prev) => {
          const nextEvents = [...prev.events];
          const targetIdx = Math.min(idx, nextEvents.length);
          nextEvents.splice(targetIdx, 0, deletedExam);
          return { ...prev, events: nextEvents };
        });
      });
    }
  };

  // ---------------- ASSIGNMENTS ----------------
  const handleStartEditAssign = (a) => {
    setEditingAssignId(a.id);
    setAssignTitle(a.title || '');
    setAssignDate(a.due || '');
    triggerHaptic('light', db.haptics);
  };

  const handleCancelEditAssign = () => {
    setEditingAssignId(null);
    setAssignTitle('');
    setAssignDate('');
  };

  const handleAddAssign = (e) => {
    e.preventDefault();
    if (!assignTitle.trim()) {
      alert('Enter an assignment title.');
      return;
    }

    if (editingAssignId) {
      onUpdateDb((prev) => ({
        ...prev,
        assign: prev.assign.map((a) =>
          a.id === editingAssignId ? { ...a, title: assignTitle.trim(), due: assignDate } : a
        )
      }));
      handleCancelEditAssign();
      triggerHaptic('success', db.haptics);
      if (onToast) onToast('Changes saved.');
      return;
    }

    const newAssign = {
      id: Date.now(),
      title: assignTitle.trim(),
      due: assignDate,
      done: false
    };
    onUpdateDb((prev) => ({
      ...prev,
      assign: [...prev.assign, newAssign]
    }));
    setAssignTitle('');
    setAssignDate('');
    triggerHaptic('success', db.haptics);
  };

  const handleToggleAssign = (id) => {
    triggerHaptic('medium', db.haptics);
    onUpdateDb((prev) => ({
      ...prev,
      assign: prev.assign.map((a) => (a.id === id ? { ...a, done: !a.done } : a))
    }));
  };

  const handleDeleteAssign = (id) => {
    const idx = db.assign.findIndex((a) => a.id === id);
    if (idx === -1) return;
    const deletedAssign = db.assign[idx];

    triggerHaptic('light', db.haptics);
    onUpdateDb((prev) => ({
      ...prev,
      assign: prev.assign.filter((a) => a.id !== id)
    }));

    if (editingAssignId === id) {
      handleCancelEditAssign();
    }

    if (onToastWithUndo) {
      onToastWithUndo('Deleted.', () => {
        onUpdateDb((prev) => {
          const nextAssign = [...prev.assign];
          const targetIdx = Math.min(idx, nextAssign.length);
          nextAssign.splice(targetIdx, 0, deletedAssign);
          return { ...prev, assign: nextAssign };
        });
      });
    }
  };

  const exams = db.events
    .filter((e) => e.type === 'Exam')
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div>
      {/* Tabs */}
      <div className="tabs">
        <button
          aria-pressed={tab === 'ex'}
          onClick={() => {
            triggerHaptic('light', db.haptics);
            setTab('ex');
          }}
        >
          Exams
        </button>
        <button
          aria-pressed={tab === 'as'}
          onClick={() => {
            triggerHaptic('light', db.haptics);
            setTab('as');
          }}
        >
          Assignments
        </button>
      </div>

      {/* EXAMS TAB */}
      {tab === 'ex' && (
        <div>
          <form onSubmit={handleAddExam} className="c">
            <div className="r">
              <input
                id="ct"
                type="text"
                placeholder="Exam (e.g. Maths)"
                value={examTitle}
                onChange={(e) => setExamTitle(e.target.value)}
              />
              <input
                id="cd"
                type="date"
                aria-label="Exam date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
              />
            </div>
            <div className="r" style={{ marginTop: '8px', gap: '8px' }}>
              {editingExamId ? (
                <>
                  <button type="submit" className="p">
                    Save changes
                  </button>
                  <button type="button" onClick={handleCancelEditExam}>
                    Cancel
                  </button>
                </>
              ) : (
                <button type="submit" className="p">
                  Add exam
                </button>
              )}
            </div>
          </form>

          <div>
            {exams.length > 0 ? (
              exams.map((e) => {
                const daysDiff = diff(e.date);
                const isUrgent = daysDiff >= 0 && daysDiff <= 7;
                return (
                  <div key={e.id} className="c i">
                    <div>
                      <b>{e.title}</b>
                      <div className="m">{e.date}</div>
                    </div>
                    <div className="r" style={{ margin: 0, gap: '6px' }}>
                      <b style={{ color: isUrgent ? 'var(--bad)' : 'var(--a)' }}>
                        {when(e.date)}
                      </b>
                      <button
                        type="button"
                        onClick={() => handleStartEditExam(e)}
                        aria-label="Edit"
                        title="Edit"
                        style={{ padding: '4px 8px', minHeight: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Icon name="edit" size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteExam(e.id)}
                        aria-label="Delete"
                        style={{ padding: '4px 8px', minHeight: '36px' }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty-state">
                <Icon name="college" size={40} />
                <p>No exams yet. Add one above.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ASSIGNMENTS TAB */}
      {tab === 'as' && (
        <div>
          <form onSubmit={handleAddAssign} className="c">
            <div className="r">
              <input
                id="at"
                type="text"
                placeholder="Assignment"
                value={assignTitle}
                onChange={(e) => setAssignTitle(e.target.value)}
              />
              <input
                id="ad"
                type="date"
                aria-label="Due date"
                value={assignDate}
                onChange={(e) => setAssignDate(e.target.value)}
              />
            </div>
            <div className="r" style={{ marginTop: '8px', gap: '8px' }}>
              {editingAssignId ? (
                <>
                  <button type="submit" className="p">
                    Save changes
                  </button>
                  <button type="button" onClick={handleCancelEditAssign}>
                    Cancel
                  </button>
                </>
              ) : (
                <button type="submit" className="p">
                  Add
                </button>
              )}
            </div>
          </form>

          <div>
            {db.assign.length > 0 ? (
              db.assign.map((a) => (
                <div key={a.id} className={`c i ${a.done ? 'done' : ''}`}>
                  <div>
                    <b>{a.title}</b>
                    <div className="m">{a.due ? when(a.due) : 'No date'}</div>
                  </div>
                  <div className="r" style={{ margin: 0, gap: '6px' }}>
                    <button onClick={() => handleToggleAssign(a.id)}>
                      {a.done ? 'Undo' : 'Done'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStartEditAssign(a)}
                      aria-label="Edit"
                      title="Edit"
                      style={{ padding: '4px 8px', minHeight: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Icon name="edit" size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteAssign(a.id)}
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
                <p>No assignments yet. Add one above.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}