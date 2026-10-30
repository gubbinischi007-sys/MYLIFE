import React from 'react';
import { CheckCircle2, Clock, Flame, CalendarDays, Search } from 'lucide-react';

export default function StatsBar({ tasks, activeFilter, onFilterChange, searchQuery, onSearchChange }) {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  const filters = [
    { id: 'all', label: 'All', count: total },
    { id: 'today', label: 'Today', count: tasks.filter(t => !t.completed && t.dueDate === new Date().toISOString().slice(0, 10)).length },
    { id: 'upcoming', label: 'Upcoming', count: tasks.filter(t => !t.completed && t.dueDate && t.dueDate > new Date().toISOString().slice(0, 10)).length },
    { id: 'priority', label: 'Priority 🔥', count: tasks.filter(t => !t.completed && t.priority === 'high').length },
    { id: 'completed', label: 'Done', count: completed }
  ];

  return (
    <div className="space-y-4">
      {/* Progress Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800/80 rounded-3xl p-5 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Daily Momentum</p>
            <h3 className="text-xl font-extrabold text-slate-100 mt-0.5">
              {percentage === 100 && total > 0 ? 'All caught up! 🎉' : `${completed} of ${total} tasks completed`}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {total === 0
                ? 'No tasks created yet. Tap + to get started.'
                : percentage === 100
                ? 'Great job completing everything for today!'
                : `${total - completed} pending tasks to tackle`}
            </p>
          </div>

          {/* Radial / Percentage Badge */}
          <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
            <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-800"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-indigo-500 transition-all duration-500 stroke-linecap-round"
                strokeDasharray={`${percentage}, 100`}
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-xs font-black text-slate-100">{percentage}%</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800/80 rounded-full h-2 mt-4 overflow-hidden">
          <div
            className="bg-gradient-to-r from-indigo-500 to-pink-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Search your tasks..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-2xl bg-slate-900/80 border border-slate-800/80 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/80 transition"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
          >
            Clear
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => onFilterChange(f.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 flex items-center gap-1.5 ${
              activeFilter === f.id
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800/60'
            }`}
          >
            {f.label}
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeFilter === f.id ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {f.count}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

