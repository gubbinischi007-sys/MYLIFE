import React from 'react';
import { CATS, fmt, month, diff, getSpentForMonth } from '../utils/storage';

export default function ReportsView({ db }) {
  const currentMonth = month();
  const monthExpenses = getSpentForMonth(db.tx, currentMonth);
  const sp = monthExpenses.reduce((s, t) => s + (t.amt || 0), 0);

  const dn = db.tasks.filter((t) => t.done).length;
  const op = db.tasks.filter((t) => !t.done).length;
  const pa = db.assign.filter((a) => !a.done).length;
  const ne = db.events.filter((e) => e.type === 'Exam' && diff(e.date) >= 0).length;

  return (
    <div>
      {/* 4 Cards Grid (IMAGE 4) */}
      <div className="g">
        <div className="c">
          <div className="m">Tasks done</div>
          <div className="big">{dn}</div>
        </div>
        <div className="c">
          <div className="m">Tasks open</div>
          <div className="big">{op}</div>
        </div>
        <div className="c">
          <div className="m">Assignments pending</div>
          <div className="big">{pa}</div>
        </div>
        <div className="c">
          <div className="m">Exams ahead</div>
          <div className="big">{ne}</div>
        </div>
      </div>

      {/* Spending Breakdown */}
      <h2>Spending this month: {fmt(sp, db.cur)}</h2>

      <div>
        {CATS.map((c) => {
          const s = monthExpenses.filter((t) => t.cat === c).reduce((a, t) => a + (t.amt || 0), 0);
          const pct = sp ? (s / sp) * 100 : 0;
          return (
            <div key={c} className="c">
              <div className="i">
                <b>{c}</b>
                <span>{fmt(s, db.cur)}</span>
              </div>
              <div className="bar">
                <i style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
