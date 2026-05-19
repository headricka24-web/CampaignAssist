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

type ImportRow = {
  date:          string
  type:          string
  category:      string
  amount:        number
  vendor:        string | null
  description:   string | null
  paymentMethod: string | null
  notes:         string | null
  selected:      boolean
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
  const [data,        setData]        = useState<Summary | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [showForm,    setShowForm]    = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [form,        setForm]        = useState<FormData>(DEFAULT_FORM)
  const [filter,      setFilter]      = useState<'all' | 'income' | 'expense'>('all')
  const [catFilter,   setCatFilter]   = useState('all')
  const [deleting,    setDeleting]    = useState<string | null>(null)
  // import state
  const [showImport,  setShowImport]  = useState(false)
  const [importing,   setImporting]   = useState(false)
  const [importRows,  setImportRows]  = useState<ImportRow[]>([])
  const [importError, setImportError] = useState('')
  const [saving2,     setSaving2]     = useState(false)

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

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setImportError('')
    setImportRows([])
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/budget/import', { method: 'POST', body: fd })
    const data = await res.json()
    setImporting(false)
    if (!res.ok) { setImportError(data.error ?? 'Failed to parse file'); return }
    const rows: ImportRow[] = (data.transactions as ImportRow[]).map(r => ({ ...r, selected: true }))
    if (rows.length === 0) { setImportError('No transactions found in this file.'); return }
    setImportRows(rows)
    // reset file input so same file can be re-uploaded
    e.target.value = ''
  }

  async function confirmImport() {
    const selected = importRows.filter(r => r.selected)
    if (selected.length === 0) return
    setSaving2(true)
    await Promise.all(selected.map(r =>
      fetch('/api/budget', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ...r, amount: Math.abs(r.amount) }),
      })
    ))
    setImportRows([])
    setShowImport(false)
    setSaving2(false)
    await load()
  }

  const txs = data?.transactions ?? []
  const categories = [...new Set(txs.map(t => t.category))]

  function exportCSV() {
    const rows = txs
      .filter(t => filter === 'all' || t.type === filter)
      .filter(t => catFilter === 'all' || t.category === catFilter)
    const headers = ['Date', 'Type', 'Category', 'Amount', 'Vendor', 'Description', 'Payment Method', 'Notes']
    const esc = (v: string | null) => `"${(v ?? '').replace(/"/g, '""')}"`
    const csv = [
      headers.map(esc).join(','),
      ...rows.map(t => [
        esc(new Date(t.txDate).toLocaleDateString()),
        esc(t.type), esc(t.category),
        esc(t.amount.toFixed(2)),
        esc(t.vendor), esc(t.description), esc(t.paymentMethod), esc(t.notes),
      ].join(',')),
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = 'budget.csv'; a.click()
    URL.revokeObjectURL(url)
  }

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
      {/* Hero Header */}
      <div className="relative rounded-2xl overflow-hidden bg-hero-gradient shadow-patriot mb-6">
        <div className="absolute inset-0 bg-stripe-pattern opacity-40" />
        <div className="relative px-8 py-8 flex items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-gold-400 text-navy text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full mb-3">◆ Finance</div>
            <h1 className="font-display text-4xl font-black text-white leading-tight">Campaign <span className="text-gold-400">Budget</span></h1>
            <p className="text-blue-200 text-sm mt-1">Track income, expenses, and cash on hand</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={exportCSV}
              disabled={txs.length === 0}
              className="border border-white/30 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-white/10 transition disabled:opacity-40"
            >
              ↓ Export CSV
            </button>
            <button
              onClick={() => setShowImport(true)}
              className="border border-white/30 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-white/10 transition"
            >
              ↑ Import File
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="bg-gold-400 text-navy px-4 py-2 rounded-xl text-sm font-black hover:bg-gold-300 transition"
            >
              + Add Transaction
            </button>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Total Raised</p>
          <p className="text-3xl font-display font-bold text-emerald-600">{fmt$(data?.income ?? 0)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Total Spent</p>
          <p className="text-3xl font-display font-bold text-rose-600">{fmt$(data?.expense ?? 0)}</p>
        </div>
        <div className={`rounded-2xl border p-5 shadow-sm ${(data?.balance ?? 0) >= 0 ? 'bg-navy border-navy' : 'bg-rose-600 border-rose-600'}`}>
          <p className="text-[10px] font-black uppercase tracking-widest text-white/70 mb-1">Cash on Hand</p>
          <p className="text-3xl font-display font-bold text-white">{fmt$(data?.balance ?? 0)}</p>
        </div>
      </div>

      {/* Expense breakdown */}
      {topCats.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-6">
          <h2 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-3">Spending Breakdown</h2>
          <div className="space-y-2">
            {topCats.map(([cat, amt]) => (
              <div key={cat} className="flex items-center gap-3">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full w-24 text-center shrink-0 ${CAT_COLORS[cat] ?? 'bg-gray-100 text-gray-700'}`}>{cat}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-navy rounded-full"
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
              filter === f ? 'bg-navy text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
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
          <div className="p-8">
            <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl">
              <div className="text-4xl mb-3 opacity-30">💰</div>
              <p className="font-black text-navy text-sm uppercase tracking-wide mb-1">No Transactions Yet</p>
              <p className="text-gray-400 text-sm mb-4">Add your first income or expense to get started.</p>
              <button onClick={() => setShowForm(true)} className="bg-navy text-white font-black uppercase tracking-widest text-xs px-5 py-2.5 rounded-xl hover:bg-navy-700 transition-colors">+ Add Transaction</button>
            </div>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
                <th className="w-0 p-0" />
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
                <tr key={tx.id} className="relative border-b border-gray-50 hover:bg-gray-50 transition">
                  <td className="w-0 p-0">
                    <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${tx.type === 'income' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                  </td>
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

      {/* ── Import modal ─────────────────────────────────────────────── */}
      {showImport && (
        <div className="fixed inset-0 bg-navy/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="h-1.5 bg-gradient-to-r from-gold-400 to-amber-500" />
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Import Transactions</h2>
                <p className="text-xs text-gray-400 mt-0.5">Accepts CSV, Excel (.xlsx), or PDF bank statements</p>
              </div>
              <button onClick={() => { setShowImport(false); setImportRows([]); setImportError('') }} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
              {/* Upload zone */}
              {importRows.length === 0 && (
                <label className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl p-10 cursor-pointer transition ${importing ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:border-navy hover:bg-gray-50'}`}>
                  {importing ? (
                    <>
                      <div className="w-8 h-8 border-2 border-navy border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm font-semibold text-gray-500">Analyzing file with AI…</p>
                      <p className="text-xs text-gray-400">This may take a few seconds</p>
                    </>
                  ) : (
                    <>
                      <span className="text-4xl">📂</span>
                      <p className="text-sm font-semibold text-gray-700">Click to upload or drag a file here</p>
                      <p className="text-xs text-gray-400">Bank statement PDF · CSV export · Excel spreadsheet</p>
                      <p className="text-xs text-gray-300">Max 4 MB</p>
                    </>
                  )}
                  <input
                    type="file"
                    className="hidden"
                    accept=".csv,.xlsx,.xls,.pdf,.txt"
                    onChange={handleFileUpload}
                    disabled={importing}
                  />
                </label>
              )}

              {importError && (
                <div className="mt-4 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm text-rose-700 font-medium">
                  {importError}
                  <button
                    onClick={() => setImportError('')}
                    className="ml-3 text-xs underline"
                  >Try again</button>
                </div>
              )}

              {/* Preview table */}
              {importRows.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-gray-700">
                      Found <span className="text-navy font-black">{importRows.length}</span> transactions —
                      <span className="text-gray-500"> review and deselect any to skip</span>
                    </p>
                    <div className="flex gap-2 text-xs">
                      <button onClick={() => setImportRows(r => r.map(x => ({ ...x, selected: true })))} className="text-navy font-semibold hover:underline">Select all</button>
                      <span className="text-gray-300">|</span>
                      <button onClick={() => setImportRows(r => r.map(x => ({ ...x, selected: false })))} className="text-gray-400 hover:underline">Deselect all</button>
                    </div>
                  </div>
                  <div className="border border-gray-100 rounded-xl overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 uppercase tracking-wide">
                          <th className="px-3 py-2 text-left w-8">✓</th>
                          <th className="px-3 py-2 text-left">Date</th>
                          <th className="px-3 py-2 text-left">Type</th>
                          <th className="px-3 py-2 text-left">Category</th>
                          <th className="px-3 py-2 text-left">Description / Vendor</th>
                          <th className="px-3 py-2 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importRows.map((row, i) => (
                          <tr
                            key={i}
                            onClick={() => setImportRows(r => r.map((x, j) => j === i ? { ...x, selected: !x.selected } : x))}
                            className={`border-b border-gray-50 cursor-pointer transition ${row.selected ? 'hover:bg-gray-50' : 'opacity-40 bg-gray-50/50'}`}
                          >
                            <td className="px-3 py-2">
                              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${row.selected ? 'bg-navy border-navy' : 'border-gray-300'}`}>
                                {row.selected && <span className="text-white text-[10px] leading-none">✓</span>}
                              </div>
                            </td>
                            <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{row.date}</td>
                            <td className="px-3 py-2">
                              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${row.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                {row.type}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-gray-600">{row.category}</td>
                            <td className="px-3 py-2 text-gray-700 max-w-[200px] truncate">{row.description ?? row.vendor ?? '—'}</td>
                            <td className={`px-3 py-2 text-right font-bold whitespace-nowrap ${row.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {row.type === 'income' ? '+' : '−'}${Math.abs(row.amount).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {importRows.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between shrink-0">
                <p className="text-xs text-gray-400">
                  {importRows.filter(r => r.selected).length} of {importRows.length} selected
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => { setImportRows([]); setImportError('') }}
                    className="border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 transition"
                  >
                    ← Re-upload
                  </button>
                  <button
                    onClick={confirmImport}
                    disabled={saving2 || importRows.filter(r => r.selected).length === 0}
                    className="bg-navy text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-navy-700 transition disabled:opacity-50"
                  >
                    {saving2 ? 'Saving…' : `Import ${importRows.filter(r => r.selected).length} transactions`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add transaction modal */}
      {showForm && (
        <div className="fixed inset-0 bg-navy/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="h-1.5 bg-gradient-to-r from-gold-400 to-amber-500" />
            <div className="p-6">
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
                  className="flex-1 bg-navy text-white py-2 rounded-xl text-sm font-semibold hover:bg-navy-700 transition disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
