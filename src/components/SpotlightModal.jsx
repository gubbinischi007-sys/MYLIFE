import React, { useState, useMemo } from 'react';
import Icon from './Icons';
import { fmt, when } from '../utils/storage';

export default function SpotlightModal({ isOpen, onClose, db, onNavigate }) {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;

    const matchedTasks = (db.tasks || [])
      .filter((t) => t.title?.toLowerCase().includes(q))
      .slice(0, 5);

    const matchedNotes = (db.notes || [])
      .filter((n) => n.t?.toLowerCase().includes(q))
      .slice(0, 5);

    const matchedExams = (db.events || [])
      .filter((e) => e.type === 'Exam' && e.title?.toLowerCase().includes(q))
      .slice(0, 5);

    const matchedAssignments = (db.assign || [])
      .filter((a) => a.title?.toLowerCase().includes(q))
      .slice(0, 5);

    const matchedPasswords = (db.passwords || [])
      .filter((p) => (p.service + ' ' + (p.user || '') + ' ' + (p.cat || '')).toLowerCase().includes(q))
      .slice(0, 5);

    const matchedTx = (db.tx || [])
      .filter((t) => (t.note + ' ' + t.cat).toLowerCase().includes(q))
      .slice(0, 5);

    const totalCount =
      matchedTasks.length +
      matchedNotes.length +
      matchedPasswords.length +
      matchedExams.length +
      matchedAssignments.length +
      matchedTx.length;

    return {
      tasks: matchedTasks,
      notes: matchedNotes,
      passwords: matchedPasswords,
      exams: matchedExams,
      assignments: matchedAssignments,
      tx: matchedTx,
      totalCount
    };
  }, [query, db]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-[2px] flex items-start justify-center p-4 pt-12"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[560px] bg-[#111111] border border-[#2e2e2e] rounded-2xl shadow-2xl overflow-hidden animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#242424]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#a3a3a3] shrink-0">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            autoFocus
            placeholder="Search tasks, notes, exams, money..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none text-white text-base focus:outline-none placeholder-[#666] min-h-[38px] p-0"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-xs text-[#a3a3a3] hover:text-white px-2 py-1"
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs text-[#a3a3a3] hover:text-white border border-[#333] px-2 py-1 rounded"
          >
            Esc
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4">
          {!results ? (
            <div className="py-8 text-center text-xs text-[#777]">
              Type to search across everything in MYLIFE
            </div>
          ) : results.totalCount === 0 ? (
            <div className="py-8 text-center text-xs text-[#777]">
              No matches found for "{query}"
            </div>
          ) : (
            <>
              {/* Tasks */}
              {results.tasks.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-[#888] uppercase tracking-wider px-2 mb-1.5">Tasks</div>
                  <div className="space-y-1">
                    {results.tasks.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => {
                          onNavigate('personal', 'tasks');
                          onClose();
                        }}
                        className="p-2.5 rounded-lg hover:bg-[#1a1a1a] cursor-pointer flex items-center justify-between text-sm"
                      >
                        <span className={t.done ? 'line-through text-[#666]' : 'text-white'}>{t.title}</span>
                        <span className="text-xs text-[#888]">{t.due ? when(t.due) : 'Tasks'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {results.notes.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-[#888] uppercase tracking-wider px-2 mb-1.5">Notes</div>
                  <div className="space-y-1">
                    {results.notes.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          onNavigate('personal', 'notes');
                          onClose();
                        }}
                        className="p-2.5 rounded-lg hover:bg-[#1a1a1a] cursor-pointer flex items-center justify-between text-sm"
                      >
                        <span className="text-white truncate">{n.t}</span>
                        <span className="text-xs text-[#888] shrink-0 ml-2">{n.d}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Passwords */}
              {results.passwords.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-[#888] uppercase tracking-wider px-2 mb-1.5">Passwords</div>
                  <div className="space-y-1">
                    {results.passwords.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          onNavigate('personal', 'passwords');
                          onClose();
                        }}
                        className="p-2.5 rounded-lg hover:bg-[#1a1a1a] cursor-pointer flex items-center justify-between text-sm"
                      >
                        <div>
                          <span className="text-white font-semibold">{p.service}</span>
                          {p.user && <span className="text-xs text-[#888] ml-2">({p.user})</span>}
                        </div>
                        <span className="text-xs text-[#888]">{p.cat || 'Password'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Exams & Assignments */}
              {(results.exams.length > 0 || results.assignments.length > 0) && (
                <div>
                  <div className="text-[11px] font-bold text-[#888] uppercase tracking-wider px-2 mb-1.5">College</div>
                  <div className="space-y-1">
                    {results.exams.map((e) => (
                      <div
                        key={e.id}
                        onClick={() => {
                          onNavigate('college');
                          onClose();
                        }}
                        className="p-2.5 rounded-lg hover:bg-[#1a1a1a] cursor-pointer flex items-center justify-between text-sm"
                      >
                        <span className="text-white">Exam: {e.title}</span>
                        <span className="text-xs text-[#888]">{when(e.date)}</span>
                      </div>
                    ))}
                    {results.assignments.map((a) => (
                      <div
                        key={a.id}
                        onClick={() => {
                          onNavigate('college');
                          onClose();
                        }}
                        className="p-2.5 rounded-lg hover:bg-[#1a1a1a] cursor-pointer flex items-center justify-between text-sm"
                      >
                        <span className={a.done ? 'line-through text-[#666]' : 'text-white'}>Assignment: {a.title}</span>
                        <span className="text-xs text-[#888]">{a.due ? when(a.due) : ''}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Transactions */}
              {results.tx.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-[#888] uppercase tracking-wider px-2 mb-1.5">Money</div>
                  <div className="space-y-1">
                    {results.tx.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => {
                          onNavigate('money');
                          onClose();
                        }}
                        className="p-2.5 rounded-lg hover:bg-[#1a1a1a] cursor-pointer flex items-center justify-between text-sm"
                      >
                        <span className="text-white">{t.note || t.cat}</span>
                        <span className="text-xs font-semibold text-white">{fmt(t.amt, db.cur)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

