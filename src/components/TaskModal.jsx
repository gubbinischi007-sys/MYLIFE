import React, { useState, useEffect } from 'react';
import { X, Calendar, Flag, Repeat, Tag, Check, Sparkles } from 'lucide-react';

export default function TaskModal({ isOpen, onClose, onSave, taskToEdit, categories }) {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState(categories[0]?.id || 'personal');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [repeat, setRepeat] = useState('');

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title || '');
      setNotes(taskToEdit.notes || '');
      setCategory(taskToEdit.category || categories[0]?.id || 'personal');
      setPriority(taskToEdit.priority || 'medium');
      setDueDate(taskToEdit.dueDate || '');
      setRepeat(taskToEdit.repeat || '');
    } else {
      setTitle('');
      setNotes('');
      setCategory(categories[0]?.id || 'personal');
      setPriority('medium');
      setDueDate(new Date().toISOString().slice(0, 10));
      setRepeat('');
    }
  }, [taskToEdit, isOpen, categories]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      id: taskToEdit ? taskToEdit.id : `task-${Date.now()}`,
      title: title.trim(),
      notes: notes.trim(),
      category,
      priority,
      dueDate,
      repeat,
      completed: taskToEdit ? taskToEdit.completed : false,
      createdAt: taskToEdit ? taskToEdit.createdAt : Date.now()
    });

    onClose();
  };

  const setDatePreset = (daysOffset) => {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    setDueDate(d.toISOString().slice(0, 10));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-lg bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-100">
              {taskToEdit ? 'Edit Task' : 'Create New Task'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Task Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Task Title *</label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g., Complete project report, buy groceries..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          {/* Notes / Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Notes (Optional)</label>
            <textarea
              rows={2}
              placeholder="Additional details, checklist, links..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition resize-none"
            />
          </div>

          {/* Due Date & Quick Presets */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                Due Date
              </label>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setDatePreset(0)}
                  className="px-2 py-0.5 text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md transition"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setDatePreset(1)}
                  className="px-2 py-0.5 text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md transition"
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  onClick={() => setDatePreset(7)}
                  className="px-2 py-0.5 text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md transition"
                >
                  +1 Week
                </button>
              </div>
            </div>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          {/* Priority Level */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Flag className="w-3.5 h-3.5 text-indigo-400" />
              Priority Level
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'low', label: 'Low', color: 'border-blue-500/40 text-blue-400 bg-blue-500/10' },
                { id: 'medium', label: 'Medium', color: 'border-amber-500/40 text-amber-400 bg-amber-500/10' },
                { id: 'high', label: 'High 🔥', color: 'border-rose-500/40 text-rose-400 bg-rose-500/10' },
                { id: 'none', label: 'None', color: 'border-slate-700 text-slate-400 bg-slate-800/40' }
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPriority(p.id)}
                  className={`py-2 px-2 text-xs font-medium rounded-xl border transition-all text-center ${
                    priority === p.id
                      ? `${p.color} ring-2 ring-indigo-500 font-bold scale-[1.02]`
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:bg-slate-800/50'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-indigo-400" />
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition ${
                    category === c.id
                      ? `${c.bg} ring-2 ring-indigo-500 font-semibold shadow-sm`
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Recurrence */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Repeat className="w-3.5 h-3.5 text-indigo-400" />
              Repeat Routine
            </label>
            <select
              value={repeat}
              onChange={(e) => setRepeat(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-indigo-500 transition"
            >
              <option value="">Do not repeat (One-time)</option>
              <option value="daily">Daily (Every day)</option>
              <option value="weekdays">Weekdays (Mon - Fri)</option>
              <option value="weekly">Weekly (Every week)</option>
              <option value="monthly">Monthly (Every month)</option>
            </select>
          </div>

          {/* Modal Actions */}
          <div className="pt-3 pb-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-800 bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 active:scale-95 text-white font-bold text-sm shadow-lg shadow-indigo-500/20 transition flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              {taskToEdit ? 'Save Changes' : 'Add Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

