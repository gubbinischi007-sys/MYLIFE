import React from 'react';
import { Check, Calendar, Repeat, Flame, Trash2, Edit2, AlertCircle } from 'lucide-react';

export default function TaskCard({ task, category, onToggle, onEdit, onDelete }) {
  const isDone = task.completed;
  
  // Due date formatting
  const getDueStatus = () => {
    if (!task.dueDate) return null;
    const today = new Date().toISOString().slice(0, 10);
    const d1 = new Date(today);
    const d2 = new Date(task.dueDate);
    const diffDays = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)}d overdue`, isOverdue: true };
    }
    if (diffDays === 0) {
      return { text: 'Today', isToday: true };
    }
    if (diffDays === 1) {
      return { text: 'Tomorrow', isUpcoming: true };
    }
    return { text: `In ${diffDays}d`, isUpcoming: true };
  };

  const dueStatus = getDueStatus();

  return (
    <div
      className={`group relative p-4 rounded-2xl border transition-all duration-200 select-none ${
        isDone
          ? 'bg-slate-900/40 border-slate-800/50 opacity-60'
          : 'bg-slate-900/90 border-slate-800/80 hover:border-slate-700 shadow-sm'
      }`}
    >
      <div className="flex items-start gap-3.5">
        {/* Custom Circular Checkbox */}
        <button
          onClick={() => onToggle(task.id)}
          className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200 active:scale-90 ${
            isDone
              ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20'
              : task.priority === 'high'
              ? 'border-rose-500/80 hover:bg-rose-500/10'
              : 'border-slate-600 hover:border-indigo-400 hover:bg-indigo-500/10'
          }`}
          aria-label={isDone ? 'Mark task incomplete' : 'Mark task complete'}
        >
          {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
        </button>

        {/* Task Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4
              className={`text-sm font-semibold tracking-tight transition-all duration-150 break-words ${
                isDone ? 'line-through text-slate-500' : 'text-slate-100'
              }`}
            >
              {task.title}
            </h4>

            {/* High Priority Badge */}
            {task.priority === 'high' && !isDone && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-rose-500/15 text-rose-400 border border-rose-500/30">
                <Flame className="w-3 h-3 text-rose-500" />
                Urgent
              </span>
            )}
          </div>

          {/* Optional Notes */}
          {task.notes && (
            <p className={`text-xs mt-1 leading-relaxed ${isDone ? 'line-through text-slate-600' : 'text-slate-400'}`}>
              {task.notes}
            </p>
          )}

          {/* Metadata Badges (Category, Due Date, Repeat) */}
          <div className="flex items-center gap-2 mt-2.5 flex-wrap text-[11px]">
            {/* Category */}
            {category && (
              <span className={`px-2 py-0.5 rounded-lg border font-medium ${category.bg}`}>
                {category.name}
              </span>
            )}

            {/* Due Date */}
            {dueStatus && (
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border font-medium ${
                  dueStatus.isOverdue && !isDone
                    ? 'bg-rose-950/40 text-rose-300 border-rose-800/60'
                    : dueStatus.isToday && !isDone
                    ? 'bg-amber-950/40 text-amber-300 border-amber-800/60 font-semibold'
                    : 'bg-slate-800/60 text-slate-400 border-slate-700/60'
                }`}
              >
                {dueStatus.isOverdue && !isDone ? (
                  <AlertCircle className="w-3 h-3 text-rose-400" />
                ) : (
                  <Calendar className="w-3 h-3 text-slate-400" />
                )}
                {dueStatus.text}
              </span>
            )}

            {/* Repeat Indicator */}
            {task.repeat && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-950/30 text-indigo-300 border border-indigo-800/40 capitalize">
                <Repeat className="w-3 h-3" />
                {task.repeat}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 shrink-0 pt-0.5">
          <button
            onClick={() => onEdit(task)}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
            aria-label="Edit task"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition"
            aria-label="Delete task"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

