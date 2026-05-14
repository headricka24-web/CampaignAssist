'use client'

import { useState, useEffect, useCallback } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

type TxType = 'income' | 'expense'

type Transaction = {
  id:            string
  type:          TxType
  category:      string
  amount:        number
  vendor:        string | null
  description:   string | null
  txDate:        string
  paymentMethod: string | null
  notes:         string | null
}

type Summary = {
  transactions: Transaction[]
  income:       number
  expense:      number
  balance:      number
}

type FormData = {
  type:          TxType
  category:      string
  amount:        string
  vendor:        string
  description:   string
  txDate:        string
  paymentMethod: string
  notes:         string
}

// ── Constants ─────────────────────────────────────────────────────────────────

const INCOME_CATS  = ['Donations', 'In-Kind', 'Loan', 'Refund', 'Other']
const EXPENSE_CATS = ['Staff', 'Advertising', 'Events', 'Printing', 'Travel', 'Consulting', 'Legal', 'Office', 'Polling', 'Other']
const PAY_METHODS  = ['check', 'card', 'cash', 'transfer', 'in-kind']

const CAT_COLORS: Record<string, string> = {
  Donations:   'bg-emerald-100 text-emerald-800',
  'In-Kind':   'bg-teal-100 text-teal-800',
  Loan:        'bg-cyan-100 text-cyan-800',
  Refund:      'bg-sky-100 text-sky-800',
  Staff:       'bg-rose-100 text-rose-800',
  Advertising: 'bg-orange-100 text-orange-800',
  Events:      'bg-amber-100 text-amber-800',
  Printing:    'bg-yellow-100 text-yellow-800',
  Travel:      'bg-purple-100 text-purple-800',
  Consulting:  'bg-pink-100 text-pink-800',
  Legal:       'bg-red-100 text-red-800',
  Office:      'bg-gray-100 text-gray-700',
  Polling:     'bg-indigo-100 text-indigo-800',
  Other:       'bg-slate-100 text-slate-700',
}

const DEFAULT_FORM: FormData = {
  type:          'expense',
  category:      'Advertising',
  amount:        '',
  vendor:        '',
  description:   '',
  txDate:        new Date().toISOString().slice(0, 10),
  paymentMethod: 'check',
  notes:         '',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt$(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function BudgetTracker() {
  const [data,       setData]       = useState<Summary | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [showForm,   setShowForm]   = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [form,       setForm]       = useState<FormData>(DEFAULT_FORM)
  const [filter,     setFilter]     = useState<'all' | 'income' | 'expense'>('all')
  const [catFilter,  setCatFilter]  = useState('all')
  const [deleting,   setDeleting]   = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/budget')
    if (res.ok) setData(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function save() {
    if (!form.category || !form.amount) return
    setSaving(true)
    await fetch('/api/budget', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        ...form,
        amount: parseFloat(form.amount),
      }),
    })
    setForm(DEFAULT_FORM)
    setShowForm(false)
    await load()
    setSaving(false)
  }

  async function remove(id: string) {
    setDeleting(id)
    await fetch('/api/budget', {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id }),
    })
    await load()
    setDeleting(null)
  }

  const txs = data?.transactions ?? []
  const categories = [...new Set(txs.map(t => t.category))]

  const visible = txs
    .filter(t => filter === 'all' || t.type === filter)
    .filter(t => catFilter === 'all' || t.category === catFilter)

  // category breakdown for expense chart
  const expenseByCat: Record<string, number> = {}
  txs.filter(t => t.type === 'expense').forEach(t => {
    expenseByCat[t.category] = (expenseByCat[t.category] ?? 0) + t.amount
  })
  const totalExpense = data?.expense ?? 1
  const topCats = Object.entries(expenseByCat)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)

  const cats = form.type === 'income' ? INCOME_CATS : EXPENSE_CATS

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campaign Budget</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track income, expenses, and cash on hand</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-[#1e3a5f] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#16304f] transition"
        >
          + Add Transaction
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Total Raised</p>
          <p className="text-2xl font-bold text-emerald-600">{fmt$(data?.income ?? 0)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Total Spent</p>
          <p className="text-2xl font-bold text-rose-600">{fmt$(data?.expense ?? 0)}</p>
        </div>
        <div className={`rounded-2xl border p-5 shadow-sm ${(data?.balance ?? 0) >= 0 ? 'bg-[#1e3a5f] border-[#1e3a5f]' : 'bg-rose-600 border-rose-600'}`}>
          <p className="text-xs font-semibold text-white/70 uppercase tracking-wide mb-1">Cash on Hand</p>
          <p className="text-2xl font-bold text-white">{fmt$(data?.balance ?? 0)}</p>
        </div>
      </div>

      {/* Expense breakdown */}
      {topCats.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Spending Breakdown</h2>
          <div className="space-y-2">
            {topCats.map(([cat, amt]) => (
              <div key={cat} className="flex items-center gap-3">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full w-24 text-center shrink-0 ${CAT_COLORS[cat] ?? 'bg-gray-100 text-gray-700'}`}>{cat}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#1e3a5f] rounded-full"
                    style={{ width: `${Math.round((amt / totalExpense) * 100)}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-gray-600 w-16 text-right">{fmt$(amt)}</span>
                <span className="text-xs text-gray-400 w-8 text-right">{Math.round((amt / totalExpense) * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter bar */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {(['all', 'income', 'expense'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              filter === f ? 'bg-[#1e3a5f] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f === 'all' ? 'All' : f === 'income' ? '↑ Income' : '↓ Expenses'}
          </button>
        ))}
        {categories.length > 0 && (
          <select
            value={catFilter}
            onChange={e => setCatFilter(e.target.value)}
            className="ml-auto text-xs border border-gray-200 rounded-xl px-3 py-1.5 bg-white text-gray-600"
          >
            <option value="all">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
      </div>

      {/* Transactions table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-400 text-sm">Loading…</div>
        ) : visible.length === 0 ? (
          <div className="p-10 text-center text-gray-400 text-sm">
            No transactions yet.{' '}
            <button onClick={() => setShowForm(true)} className="text-[#1e3a5f] font-semibold hover:underline">
              Add your first entry.
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
                <th className="text-left px-4 py-3 font-semibold">Date</th>
                <th className="text-left px-4 py-3 font-semibold">Category</th>
                <th className="text-left px-4 py-3 font-semibold">Description</th>
                <th className="text-left px-4 py-3 font-semibold">Vendor / Method</th>
                <th className="text-right px-4 py-3 font-semibold">Amount</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {visible.map(tx => (
                <tr key={tx.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmtDate(tx.txDate)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CAT_COLORS[tx.category] ?? 'bg-gray-100 text-gray-700'}`}>
                      {tx.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{tx.description ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {tx.vendor ?? '—'}
                    {tx.paymentMethod && <span className="ml-1 text-gray-400">· {tx.paymentMethod}</span>}
                  </td>
                  <td className={`px-4 py-3 text-right font-semibold whitespace-nowrap ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {tx.type === 'income' ? '+' : '−'}{fmt$(tx.amount)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => remove(tx.id)}
                      disabled={deleting === tx.id}
                      className="text-gray-300 hover:text-rose-500 transition text-xs"
                    >
                      {deleting === tx.id ? '…' : '✕'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add transaction modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Add Transaction</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>

            {/* Type toggle */}
            <div className="flex rounded-xl overflow-hidden border border-gray-200 mb-4">
              {(['income', 'expense'] as TxType[]).map(t => (
                <button
                  key={t}
                  onClick={() => setForm(f => ({ ...f, type: t, category: t === 'income' ? 'Donations' : 'Advertising' }))}
                  className={`flex-1 py-2 text-sm font-semibold transition ${
                    form.type === t
                      ? t === 'income' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                      : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {t === 'income' ? '↑ Income' : '↓ Expense'}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Category *</label>
                  <select
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                  >
                    {cats.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Amount *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Description</label>
                <input
                  type="text"
                  placeholder="Brief description"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Vendor / Source</label>
                  <input
                    type="text"
                    placeholder="Name"
                    value={form.vendor}
                    onChange={e => setForm(f => ({ ...f, vendor: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Payment Method</label>
                  <select
                    value={form.paymentMethod}
                    onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                  >
                    {PAY_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Date</label>
                <input
                  type="date"
                  value={form.txDate}
                  onChange={e => setForm(f => ({ ...f, txDate: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Notes</label>
                <textarea
                  rows={2}
                  placeholder="Optional notes"
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving || !form.amount || !form.category}
                className="flex-1 bg-[#1e3a5f] text-white py-2 rounded-xl text-sm font-semibold hover:bg-[#16304f] transition disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
