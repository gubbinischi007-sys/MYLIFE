import React, { useState } from 'react';
import Icon from './Icons';
import { CATS, INCOME_SOURCES, fmt, month, today, getSpentForMonth, getDailyAllowance, triggerHaptic } from '../utils/storage';
import { scanReceiptWithGemini } from '../utils/receiptScanner';

const OPACITIES = [1, 0.8, 0.6, 0.45, 0.3, 0.18];

export default function MoneyView({ db, onUpdateDb, initialTab = 'ov', onToast, onToastWithUndo }) {
  const [tab, setTab] = useState(initialTab); // 'ov' | 'in' | 'ex' | 'bg'
  const [isScanning, setIsScanning] = useState(false);

  // Income Form State
  const [editingIncId, setEditingIncId] = useState(null);
  const [incAmt, setIncAmt] = useState('');
  const [incSource, setIncSource] = useState(INCOME_SOURCES[0]);
  const [incNote, setIncNote] = useState('');
  const [incSearch, setIncSearch] = useState('');
  const [incFilterSource, setIncFilterSource] = useState('');
  const [incFilterMonth, setIncFilterMonth] = useState('');

  // Expense Form State
  const [editingExpId, setEditingExpId] = useState(null);
  const [existingReceipt, setExistingReceipt] = useState(null);
  const [expAmt, setExpAmt] = useState('');
  const [expCat, setExpCat] = useState(CATS[0]);
  const [expNote, setExpNote] = useState('');
  const [expReceipt, setExpReceipt] = useState(null);
  const [expSearch, setExpSearch] = useState('');
  const [expFilterCat, setExpFilterCat] = useState('');
  const [expFilterMonth, setExpFilterMonth] = useState('');

  // Budget State
  const [budgetInputs, setBudgetInputs] = useState(db.budget || {});

  const currentMonth = month();
  const monthExpenses = getSpentForMonth(db.tx, currentMonth);
  const spentTotal = monthExpenses.reduce((s, t) => s + (t.amt || 0), 0);
  const incomeTotal = (db.tx || [])
    .filter((t) => t.type === 'income' && t.date && t.date.slice(0, 7) === currentMonth)
    .reduce((s, t) => s + (t.amt || 0), 0);
  const balance = incomeTotal - spentTotal;
  const allowance = getDailyAllowance(db);

  // ---------------- INCOME HANDLERS ----------------
  const handleStartEditInc = (t) => {
    setEditingIncId(t.id);
    setIncAmt(String(t.amt || ''));
    setIncSource(t.source || t.cat || INCOME_SOURCES[0]);
    setIncNote(t.note || '');
    triggerHaptic('light', db.haptics);
  };

  const handleCancelEditInc = () => {
    setEditingIncId(null);
    setIncAmt('');
    setIncSource(INCOME_SOURCES[0]);
    setIncNote('');
  };

  const handleSaveIncome = (e) => {
    e.preventDefault();
    const amt = parseFloat(incAmt);
    if (!amt || amt <= 0) {
      alert('Enter an amount above 0.');
      return;
    }

    if (editingIncId) {
      onUpdateDb((prev) => ({
        ...prev,
        tx: prev.tx.map((t) =>
          t.id === editingIncId
            ? { ...t, type: 'income', amt, cat: incSource, source: incSource, note: incNote.trim() }
            : t
        )
      }));
      handleCancelEditInc();
      triggerHaptic('success', db.haptics);
      if (onToast) onToast('Changes saved.');
      return;
    }

    const newInc = {
      id: Date.now(),
      type: 'income',
      amt,
      cat: incSource,
      source: incSource,
      note: incNote.trim(),
      date: today()
    };
    onUpdateDb((prev) => ({
      ...prev,
      tx: [newInc, ...prev.tx]
    }));
    setIncAmt('');
    setIncNote('');
    triggerHaptic('success', db.haptics);
    if (onToast) onToast('Income saved.');
  };

  // ---------------- EXPENSE HANDLERS ----------------
  const handleStartEditExp = (t) => {
    setEditingExpId(t.id);
    setExpAmt(String(t.amt || ''));
    setExpCat(t.cat || CATS[0]);
    setExpNote(t.note || '');
    setExistingReceipt(t.img || null);
    setExpReceipt(null);
    triggerHaptic('light', db.haptics);
  };

  const handleCancelEditExp = () => {
    setEditingExpId(null);
    setExpAmt('');
    setExpCat(CATS[0]);
    setExpNote('');
    setExpReceipt(null);
    setExistingReceipt(null);
  };

  const handleSaveExpense = (e) => {
    e.preventDefault();
    const amt = parseFloat(expAmt);
    if (!amt || amt <= 0) {
      alert('Enter an amount above 0.');
      return;
    }

    const finalizeExp = (imgData) => {
      const finalImg = imgData !== undefined ? imgData : (editingExpId ? existingReceipt : null);

      if (editingExpId) {
        onUpdateDb((prev) => ({
          ...prev,
          tx: prev.tx.map((t) =>
            t.id === editingExpId
              ? { ...t, type: 'expense', amt, cat: expCat, note: expNote.trim(), img: finalImg }
              : t
          )
        }));
        handleCancelEditExp();
        triggerHaptic('success', db.haptics);
        if (onToast) onToast('Changes saved.');
        return;
      }

      const newExp = {
        id: Date.now(),
        type: 'expense',
        amt,
        cat: expCat,
        note: expNote.trim(),
        date: today(),
        img: finalImg
      };
      onUpdateDb((prev) => ({
        ...prev,
        tx: [newExp, ...prev.tx]
      }));
      setExpAmt('');
      setExpNote('');
      setExpReceipt(null);
      triggerHaptic('success', db.haptics);
      if (onToast) onToast('Expense saved.');
    };

    if (expReceipt) {
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
          finalizeExp(compressed);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(expReceipt);
    } else {
      finalizeExp();
    }
  };

  // ---------------- BILL SCANNER (GEMINI AI) ----------------
  const handleScanReceipt = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setIsScanning(true);
    triggerHaptic('medium', db.haptics);
    if (onToast) onToast('Scanning bill with Gemini AI...');

    try {
      const apiKey = db.geminiApiKey || undefined;
      const result = await scanReceiptWithGemini(file, apiKey);

      if (result.amount > 0) {
        setExpAmt(String(result.amount));
      }
      if (result.category && CATS.includes(result.category)) {
        setExpCat(result.category);
      }
      if (result.note) {
        setExpNote(result.note);
      }
      if (result.imageDataUrl) {
        setExistingReceipt(result.imageDataUrl);
        setExpReceipt(null);
      }

      triggerHaptic('success', db.haptics);
      if (onToast) {
        const amtStr = result.amount ? fmt(result.amount, db.cur) : '';
        onToast(amtStr ? `Bill scanned: ${amtStr} detected! Review & save.` : 'Bill scanned! Review and save.');
      }
    } catch (err) {
      console.error('Scan failed:', err);
      triggerHaptic('warning', db.haptics);
      if (onToast) {
        onToast('Could not read bill. You can enter details manually.');
      }
    } finally {
      setIsScanning(false);
    }
  };

  // ---------------- DELETE WITH UNDO ----------------
  const handleDeleteTx = (id) => {
    const idx = db.tx.findIndex((t) => t.id === id);
    if (idx === -1) return;
    const deletedTx = db.tx[idx];

    triggerHaptic('light', db.haptics);
    onUpdateDb((prev) => ({
      ...prev,
      tx: prev.tx.filter((t) => t.id !== id)
    }));

    if (editingIncId === id) handleCancelEditInc();
    if (editingExpId === id) handleCancelEditExp();

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

  // ---------------- BUDGET HANDLER ----------------
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

  // Income Lists & Filtering
  const allIncomes = (db.tx || []).filter((t) => t.type === 'income');
  const filteredIncomes = allIncomes.filter((t) => {
    if (incFilterSource && (t.source || t.cat) !== incFilterSource) return false;
    if (incFilterMonth && t.date?.slice(0, 7) !== incFilterMonth) return false;
    if (incSearch) {
      const q = incSearch.toLowerCase();
      const match = (t.note + ' ' + (t.source || t.cat || '')).toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  // Expense Lists & Filtering
  const allExpenses = (db.tx || []).filter((t) => t.type === 'expense');
  const filteredExpenses = allExpenses.filter((t) => {
    if (expFilterCat && t.cat !== expFilterCat) return false;
    if (expFilterMonth && t.date?.slice(0, 7) !== expFilterMonth) return false;
    if (expSearch) {
      const q = expSearch.toLowerCase();
      const match = (t.note + ' ' + (t.cat || '')).toLowerCase().includes(q);
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
          aria-pressed={tab === 'in'}
          onClick={() => {
            triggerHaptic('light', db.haptics);
            setTab('in');
          }}
        >
          Income
        </button>
        <button
          aria-pressed={tab === 'ex'}
          onClick={() => {
            triggerHaptic('light', db.haptics);
            setTab('ex');
          }}
        >
          Expenses
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

      {/* INCOME TAB */}
      {tab === 'in' && (
        <div>
          <form onSubmit={handleSaveIncome} className="c">
            <div className="r">
              <input
                id="ia"
                type="number"
                step="0.01"
                placeholder="Income amount"
                value={incAmt}
                onChange={(e) => setIncAmt(e.target.value)}
              />
              <select
                id="is"
                value={incSource}
                onChange={(e) => setIncSource(e.target.value)}
                aria-label="Source"
              >
                {INCOME_SOURCES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="r">
              <input
                id="in_note"
                type="text"
                placeholder="Note (optional)"
                value={incNote}
                onChange={(e) => setIncNote(e.target.value)}
              />
            </div>
            <div className="r" style={{ marginTop: '8px', gap: '8px' }}>
              {editingIncId ? (
                <>
                  <button type="submit" className="p">
                    Save changes
                  </button>
                  <button type="button" onClick={handleCancelEditInc}>
                    Cancel
                  </button>
                </>
              ) : (
                <button type="submit" className="p">
                  Save income
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
                value={incSearch}
                onChange={(e) => setIncSearch(e.target.value)}
              />
            </div>
            <div className="r">
              <select
                value={incFilterSource}
                onChange={(e) => setIncFilterSource(e.target.value)}
                aria-label="Filter source"
              >
                <option value="">All sources</option>
                {INCOME_SOURCES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <input
                type="month"
                value={incFilterMonth}
                onChange={(e) => setIncFilterMonth(e.target.value)}
                aria-label="Filter month"
              />
            </div>
          </div>

          {/* Income Count and List */}
          <div>
            <p className="m">
              {filteredIncomes.length} transaction{filteredIncomes.length === 1 ? '' : 's'}
            </p>
            {allIncomes.length === 0 ? (
              <div className="c">
                <div className="empty-state">
                  <Icon name="money" size={40} />
                  <p>No income added yet. Add your first income above.</p>
                </div>
              </div>
            ) : filteredIncomes.length === 0 ? (
              <div className="c">
                <div className="empty-state">
                  <Icon name="search" size={36} />
                  <p>No matching income.</p>
                </div>
              </div>
            ) : (
              filteredIncomes.map((t) => (
                <div key={t.id} className="c i">
                  <div>
                    <b>{t.note || t.source || t.cat}</b>
                    <div className="m">
                      {t.date} · {t.source || t.cat}
                    </div>
                  </div>
                  <div className="r" style={{ margin: 0, gap: '6px' }}>
                    <b style={{ color: 'var(--ok)' }}>
                      +{fmt(t.amt, db.cur)}
                    </b>
                    <button
                      type="button"
                      onClick={() => handleStartEditInc(t)}
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

      {/* EXPENSES TAB */}
      {tab === 'ex' && (
        <div>
          <form onSubmit={handleSaveExpense} className="c">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontWeight: 700, fontSize: '0.98rem' }}>
                {editingExpId ? 'Edit expense' : 'New expense'}
              </span>
              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  background: isScanning ? 'var(--l)' : 'var(--s)',
                  border: '1px solid var(--t)',
                  borderRadius: '8px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: isScanning ? 'wait' : 'pointer',
                  color: 'var(--t)',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon name={isScanning ? 'scan' : 'camera'} size={15} />
                <span>{isScanning ? 'Scanning...' : 'Scan bill'}</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  disabled={isScanning}
                  onChange={handleScanReceipt}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            <div className="r">
              <input
                id="ea"
                type="number"
                step="0.01"
                placeholder="Expense amount"
                value={expAmt}
                onChange={(e) => setExpAmt(e.target.value)}
              />
              <select
                id="ec"
                value={expCat}
                onChange={(e) => setExpCat(e.target.value)}
                aria-label="Category"
              >
                {CATS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="r">
              <input
                id="en_note"
                type="text"
                placeholder="Note (optional)"
                value={expNote}
                onChange={(e) => setExpNote(e.target.value)}
              />
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '4px' }}>
                <input
                  id="er_receipt"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  aria-label="Receipt photo"
                  onChange={(e) => setExpReceipt(e.target.files?.[0] || null)}
                />
                {existingReceipt && !expReceipt && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <img src={existingReceipt} alt="Receipt thumbnail" className="rc" />
                    <span className="m" style={{ fontSize: '0.75rem' }}>Receipt attached</span>
                    <button
                      type="button"
                      onClick={() => setExistingReceipt(null)}
                      style={{ fontSize: '0.75rem', padding: '2px 6px', background: 'none', border: 'none', color: 'var(--bad)', cursor: 'pointer' }}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="r" style={{ marginTop: '8px', gap: '8px' }}>
              {editingExpId ? (
                <>
                  <button type="submit" className="p">
                    Save changes
                  </button>
                  <button type="button" onClick={handleCancelEditExp}>
                    Cancel
                  </button>
                </>
              ) : (
                <button type="submit" className="p">
                  Save expense
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
                value={expSearch}
                onChange={(e) => setExpSearch(e.target.value)}
              />
            </div>
            <div className="r">
              <select
                value={expFilterCat}
                onChange={(e) => setExpFilterCat(e.target.value)}
                aria-label="Category"
              >
                <option value="">All categories</option>
                {CATS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <input
                type="month"
                value={expFilterMonth}
                onChange={(e) => setExpFilterMonth(e.target.value)}
                aria-label="Month"
              />
            </div>
          </div>

          {/* Expenses Count and List */}
          <div>
            <p className="m">
              {filteredExpenses.length} expense{filteredExpenses.length === 1 ? '' : 's'}
            </p>
            {allExpenses.length === 0 ? (
              <div className="c">
                <div className="empty-state">
                  <Icon name="money" size={40} />
                  <p>No expenses added yet. Add your first expense above.</p>
                </div>
              </div>
            ) : filteredExpenses.length === 0 ? (
              <div className="c">
                <div className="empty-state">
                  <Icon name="search" size={36} />
                  <p>No matching expenses.</p>
                </div>
              </div>
            ) : (
              filteredExpenses.map((t) => (
                <div key={t.id} className="c i">
                  <div>
                    <b>{t.note || t.cat}</b>
                    <div className="m">
                      {t.date} · {t.cat}
                    </div>
                  </div>
                  <div className="r" style={{ margin: 0, gap: '6px' }}>
                    {t.img && <img className="rc" src={t.img} alt="Receipt" />}
                    <b>
                      −{fmt(t.amt, db.cur)}
                    </b>
                    <button
                      type="button"
                      onClick={() => handleStartEditExp(t)}
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