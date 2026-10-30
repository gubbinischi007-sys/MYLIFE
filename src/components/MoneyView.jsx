import React, { useState } from 'react';
import Icon from './Icons';
import { CATS, fmt, month, today, getSpentForMonth, getDailyAllowance, triggerHaptic } from '../utils/storage';

const OPACITIES = [1, 0.8, 0.6, 0.45, 0.3, 0.18];

export default function MoneyView({ db, onUpdateDb, initialTab = 'ov', onToast, onToastWithUndo }) {
  const [tab, setTab] = useState(initialTab); // 'ov' | 'tx' | 'bg'

  // Transaction Form State
  const [editingTxId, setEditingTxId] = useState(null);
  const [existingReceipt, setExistingReceipt] = useState(null);
  const [txType, setTxType] = useState('expense');
  const [txAmt, setTxAmt] = useState('');
  const [txCat, setTxCat] = useState(CATS[0]);
  const [txNote, setTxNote] = useState('');
  const [txReceipt, setTxReceipt] = useState(null);

  // Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterMonth, setFilterMonth] = useState('');

  // Budget State
  const [budgetInputs, setBudgetInputs] = useState(db.budget || {});

  const currentMonth = month();
  const monthExpenses = getSpentForMonth(db.tx, currentMonth);
  const spentTotal = monthExpenses.reduce((s, t) => s + (t.amt || 0), 0);
  const incomeTotal = db.tx
    .filter((t) => t.type === 'income' && t.date && t.date.slice(0, 7) === currentMonth)
    .reduce((s, t) => s + (t.amt || 0), 0);
  const balance = incomeTotal - spentTotal;
  const allowance = getDailyAllowance(db);

  // Start Editing Transaction
  const handleStartEditTx = (t) => {
    setEditingTxId(t.id);
    setTxType(t.type || 'expense');
    setTxAmt(String(t.amt || ''));
    setTxCat(t.cat || CATS[0]);
    setTxNote(t.note || '');
    setExistingReceipt(t.img || null);
    setTxReceipt(null);
    triggerHaptic('light', db.haptics);
  };

  const handleCancelEditTx = () => {
    setEditingTxId(null);
    setTxAmt('');
    setTxNote('');
    setTxReceipt(null);
    setExistingReceipt(null);
  };

  // Add / Edit Transaction
  const handleSaveTx = (e) => {
    e.preventDefault();
    const amt = parseFloat(txAmt);
    if (!amt || amt <= 0) {
      alert('Enter an amount above 0.');
      return;
    }

    const finalizeTx = (imgData) => {
      // If a new receipt was chosen, imgData is the compressed new data url.
      // If editing and no new receipt chosen, keep the existing receipt photo.
      const finalImg = imgData !== undefined ? imgData : (editingTxId ? existingReceipt : null);

      if (editingTxId) {
        onUpdateDb((prev) => ({
          ...prev,
          tx: prev.tx.map((t) =>
            t.id === editingTxId
              ? { ...t, type: txType, amt, cat: txCat, note: txNote.trim(), img: finalImg }
              : t
          )
        }));
        handleCancelEditTx();
        triggerHaptic('success', db.haptics);
        if (onToast) onToast('Changes saved.');
        return;
      }

      const newTx = {
        id: Date.now(),
        type: txType,
        amt,
        cat: txCat,
        note: txNote.trim(),
        date: today(),
        img: finalImg
      };
      onUpdateDb((prev) => ({
        ...prev,
        tx: [newTx, ...prev.tx]
      }));
      setTxAmt('');
      setTxNote('');
      setTxReceipt(null);
      triggerHaptic('success', db.haptics);
    };

    if (txReceipt) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const scale = Math.min(1, 480 / img.width);
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const compressed = canvas.toDataURL('image/jpeg', 0.5);
          finalizeTx(compressed);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(txReceipt);
    } else {
      finalizeTx();
    }
  };

  // Delete Transaction with Undo
  const handleDeleteTx = (id) => {
    const idx = db.tx.findIndex((t) => t.id === id);
    if (idx === -1) return;
    const deletedTx = db.tx[idx];

    triggerHaptic('light', db.haptics);
    onUpdateDb((prev) => ({
      ...prev,
      tx: prev.tx.filter((t) => t.id !== id)
    }));

    if (editingTxId === id) {
      handleCancelEditTx();
    }

    if (onToastWithUndo) {
      onToastWithUndo('Deleted.', () => {
        onUpdateDb((prev) => {
          const nextTx = [...prev.tx];
          const targetIdx = Math.min(idx, nextTx.length);
          nextTx.splice(targetIdx, 0, deletedTx);
          return { ...prev, tx: nextTx };
        });
      });
    }
  };

  const handleSaveBudget = (e) => {
    e.preventDefault();
    onUpdateDb((prev) => ({
      ...prev,
      budget: budgetInputs
    }));
    triggerHaptic('success', db.haptics);
    alert('Budget saved.');
  };

  // 6-month bars
  const last6Months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
    const spentInM = getSpentForMonth(db.tx, key).reduce((s, t) => s + (t.amt || 0), 0);
    last6Months.push({
      key,
      label: d.toLocaleDateString(undefined, { month: 'short' }),
      amount: spentInM
    });
  }
  const maxMonthSpent = Math.max(...last6Months.map((m) => m.amount), 1);

  // Donut chart calculations
  const catSpending = CATS.map((c) => ({
    name: c,
    amount: monthExpenses.filter((t) => t.cat === c).reduce((a, t) => a + (t.amt || 0), 0)
  }));
  const totalCatSpent = catSpending.reduce((a, c) => a + c.amount, 0);

  // Filtered transactions
  const filteredTx = db.tx.filter((t) => {
    if (filterType && t.type !== filterType) return false;
    if (filterCat && t.cat !== filterCat) return false;
    if (filterMonth && t.date?.slice(0, 7) !== filterMonth) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match = (t.note + ' ' + t.cat).toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <div>
      {/* Tabs */}
      <div className="tabs">
        <button
          aria-pressed={tab === 'ov'}
          onClick={() => {
            triggerHaptic('light', db.haptics);
            setTab('ov');
          }}
        >
          Overview
        </button>
        <button
          aria-pressed={tab === 'tx'}
          onClick={() => {
            triggerHaptic('light', db.haptics);
            setTab('tx');
          }}
        >
          Transactions
        </button>
        <button
          aria-pressed={tab === 'bg'}
          onClick={() => {
            triggerHaptic('light', db.haptics);
            setTab('bg');
          }}
        >
          Budget
        </button>
      </div>

      {/* OVERVIEW TAB */}
      {tab === 'ov' && (
        <div>
          {/* Top 3 Metric Cards */}
          <div className="g">
            <div className="c">
              <div className="m">Income</div>
              <div className="big">{fmt(incomeTotal, db.cur)}</div>
            </div>
            <div className="c">
              <div className="m">Spent</div>
              <div className="big">{fmt(spentTotal, db.cur)}</div>
            </div>
            <div className="c">
              <div className="m">Balance</div>
              <div className="big">{fmt(balance, db.cur)}</div>
            </div>
          </div>

          {/* Daily Spending Allowance */}
          <div className="c" style={{ marginTop: '10px' }}>
            <div className="m">Daily Spending Allowance</div>
            <div className="big" style={{ margin: '4px 0' }}>
              {fmt(allowance.daily, db.cur)}
              <span className="m" style={{ fontSize: '1rem', fontWeight: 500 }}> / day</span>
            </div>
            <div className="m" style={{ fontSize: '0.8rem' }}>
              {allowance.hasBudget
                ? `Based on ${fmt(allowance.budgetRemaining, db.cur)} budget remaining across ${allowance.daysRemaining} days left this month.`
                : allowance.budgetRemaining > 0
                ? `Based on your ${fmt(allowance.budgetRemaining, db.cur)} net balance for the remaining ${allowance.daysRemaining} days.`
                : `Set category budgets in the "Budget" tab to calculate your target daily pace.`}
            </div>
          </div>

          {/* Spending by Category */}
          <h2>Spending by category</h2>
          {totalCatSpent > 0 ? (
            <div className="c" style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
              <svg viewBox="0 0 42 42" style={{ width: '150px', height: '150px' }} role="img" aria-label="Spending by category">
                <circle r="15.9155" cx="21" cy="21" fill="none" stroke="var(--l)" strokeWidth="6" />
                {(() => {
                  let offset = 0;
                  return catSpending.map((d, i) => {
                    const p = (d.amount / totalCatSpent) * 100;
                    const el = (
                      <circle
                        key={d.name}
                        r="15.9155"
                        cx="21"
                        cy="21"
                        fill="none"
                        stroke="var(--t)"
                        strokeOpacity={OPACITIES[i]}
                        strokeWidth="6"
                        strokeDasharray={`${p} ${100 - p}`}
                        strokeDashoffset={-offset}
                        transform="rotate(-90 21 21)"
                      />
                    );
                    offset += p;
                    return el;
                  });
                })()}
                <text x="21" y="22.5" textAnchor="middle" fontSize="4" fontWeight="700" fill="var(--t)">
                  {fmt(totalCatSpent, db.cur)}
                </text>
              </svg>
              <div>
                {catSpending.map((d, i) =>
                  d.amount > 0 ? (
                    <div key={d.name} className="r" style={{ margin: '4px 0' }}>
                      <i style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--t)', opacity: OPACITIES[i], display: 'inline-block' }} />
                      {d.name} <span className="m">{Math.round((d.amount / totalCatSpent) * 100)}%</span>
                    </div>
                  ) : null
                )}
              </div>
            </div>
          ) : (
            <div className="c">
              <div className="empty-state">
                <Icon name="money" size={40} />
                <p>No spending this month yet.</p>
              </div>
            </div>
          )}

          {/* Last 6 Months */}
          <h2>Last 6 months</h2>
          <div className="c">
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '130px' }}>
              {last6Months.map((item) => (
                <div key={item.key} style={{ flex: 1 }} title={fmt(item.amount, db.cur)}>
                  <div
                    style={{
                      height: `${Math.round((item.amount / maxMonthSpent) * 120)}px`,
                      minHeight: '2px',
                      background: 'var(--t)',
                      borderRadius: '4px 4px 0 0'
                    }}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              {last6Months.map((item) => (
                <div key={item.key} className="m" style={{ flex: 1, textAlign: 'center', fontSize: '.72rem' }}>
                  {item.label}
                </div>
              ))}
            </div>
          </div>

          {/* Budget Progress */}
          <h2>Budget progress</h2>
          {CATS.map((c) => {
            const s = monthExpenses.filter((t) => t.cat === c).reduce((a, t) => a + (t.amt || 0), 0);
            const B = +db.budget[c] || 0;
            const p = B ? s / B : 0;
            return (
              <div key={c} className={`c ${p >= 1 ? 'over' : p >= 0.8 ? 'warn' : ''}`}>
                <div className="i">
                  <b>{c}</b>
                  <span>
                    {fmt(s, db.cur)}
                    {B ? ' / ' + fmt(B, db.cur) : ''}
                  </span>
                </div>
                {B > 0 && (
                  <>
                    <div className="bar">
                      <i style={{ width: `${Math.min(100, p * 100)}%` }} />
                    </div>
                    <div className="m">
                      {p >= 1 ? 'Over budget' : p >= 0.8 ? 'Over 80% used' : `${Math.round(p * 100)}% used`}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TRANSACTIONS TAB */}
      {tab === 'tx' && (
        <div>
          <form onSubmit={handleSaveTx} className="c">
            <div className="r">
              <select
                id="xt"
                value={txType}
                onChange={(e) => setTxType(e.target.value)}
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
              <input
                id="xa"
                type="number"
                step="0.01"
                placeholder="Amount"
                value={txAmt}
                onChange={(e) => setTxAmt(e.target.value)}
              />
              <select
                id="xc"
                value={txCat}
                onChange={(e) => setTxCat(e.target.value)}
              >
                {CATS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="r">
              <input
                id="xn"
                type="text"
                placeholder="Note (optional)"
                value={txNote}
                onChange={(e) => setTxNote(e.target.value)}
              />
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '4px' }}>
                <input
                  id="xr"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  aria-label="Receipt photo"
                  onChange={(e) => setTxReceipt(e.target.files?.[0] || null)}
                />
                {editingTxId && existingReceipt && !txReceipt && (
                  <span className="m" style={{ fontSize: '0.75rem' }}>Receipt attached (choose new file to replace)</span>
                )}
              </div>
            </div>
            <div className="r" style={{ marginTop: '8px', gap: '8px' }}>
              {editingTxId ? (
                <>
                  <button type="submit" className="p">
                    Save changes
                  </button>
                  <button type="button" onClick={handleCancelEditTx}>
                    Cancel
                  </button>
                </>
              ) : (
                <button type="submit" className="p">
                  Save transaction
                </button>
              )}
            </div>
          </form>

          {/* Filter Bar */}
          <div className="c">
            <div className="r">
              <input
                type="text"
                placeholder="Search notes or category"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="r">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                aria-label="Type"
              >
                <option value="">All types</option>
                <option value="expense">Expenses</option>
                <option value="income">Income</option>
              </select>
              <select
                value={filterCat}
                onChange={(e) => setFilterCat(e.target.value)}
                aria-label="Category"
              >
                <option value="">All categories</option>
                {CATS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <input
                type="month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                aria-label="Month"
              />
            </div>
          </div>

          {/* Transactions List */}
          <div>
            <p className="m">
              {filteredTx.length} transaction{filteredTx.length === 1 ? '' : 's'}
            </p>
            {db.tx.length === 0 ? (
              <div className="empty-state">
                <Icon name="money" size={40} />
                <p>No transactions yet. Add one above.</p>
              </div>
            ) : filteredTx.length === 0 ? (
              <div className="empty-state">
                <Icon name="search" size={36} />
                <p>No matching transactions.</p>
              </div>
            ) : (
              filteredTx.map((t) => (
                <div key={t.id} className="c i">
                  <div>
                    <b>{t.note || t.cat}</b>
                    <div className="m">
                      {t.date} · {t.cat}
                    </div>
                  </div>
                  <div className="r" style={{ margin: 0, gap: '6px' }}>
                    {t.img && <img className="rc" src={t.img} alt="Receipt" />}
                    <b style={{ color: t.type === 'income' ? 'var(--ok)' : 'var(--t)' }}>
                      {t.type === 'income' ? '+' : '−'}
                      {fmt(t.amt, db.cur)}
                    </b>
                    <button
                      type="button"
                      onClick={() => handleStartEditTx(t)}
                      aria-label="Edit"
                      title="Edit"
                      style={{ padding: '4px 8px', minHeight: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Icon name="edit" size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteTx(t.id)}
                      aria-label="Delete"
                      style={{ padding: '4px 8px', minHeight: '36px' }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* BUDGET TAB */}
      {tab === 'bg' && (
        <div>
          <p className="m">Monthly limit per category. You get a warning at 80% and 100%.</p>
          <form onSubmit={handleSaveBudget} style={{ marginTop: '8px' }}>
            {CATS.map((c) => (
              <div key={c} className="c i">
                <b>{c}</b>
                <input
                  type="number"
                  id={`b_${c}`}
                  value={budgetInputs[c] ?? ''}
                  placeholder="0"
                  style={{ width: '110px' }}
                  onChange={(e) =>
                    setBudgetInputs({
                      ...budgetInputs,
                      [c]: parseFloat(e.target.value) || 0
                    })
                  }
                />
              </div>
            ))}
            <div style={{ marginTop: '12px' }}>
              <button type="submit" className="p">
                Save budget
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}