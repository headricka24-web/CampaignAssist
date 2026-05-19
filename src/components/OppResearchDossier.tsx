'use client'

import { useState, useEffect, useCallback } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

type EntryType = 'vote' | 'quote' | 'donor' | 'affiliation' | 'ad' | 'other'
type TabType   = 'all' | EntryType

interface OppEntry {
  id:         string
  type:       EntryType
  title:      string
  detail:     string
  date:       string | null
  source:     string | null
  citation:   string | null
  tags:       string   // JSON array stored as string
  candidateId: string | null
  createdAt:  string
}

interface Threat {
  id:       string
  threat:   string
  severity: 'HIGH' | 'MEDIUM' | 'LOW'
  angle:    string
  why:      string
  response: string | null
  scanId:   string | null
  createdAt: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const TABS: { key: TabType; label: string }[] = [
  { key: 'all',         label: 'All' },
  { key: 'vote',        label: 'Votes' },
  { key: 'quote',       label: 'Quotes' },
  { key: 'donor',       label: 'Donors' },
  { key: 'affiliation', label: 'Affiliations' },
  { key: 'ad',          label: 'Ads' },
  { key: 'other',       label: 'Other' },
]

const TYPE_BADGE: Record<EntryType, string> = {
  vote:        'bg-blue-100 text-blue-700',
  quote:       'bg-purple-100 text-purple-700',
  donor:       'bg-gold-100 text-yellow-700',
  affiliation: 'bg-red-100 text-red-700',
  ad:          'bg-orange-100 text-orange-700',
  other:       'bg-gray-100 text-gray-600',
}

const TYPE_ICON: Record<EntryType, string> = {
  vote:        '🗳',
  quote:       '💬',
  donor:       '💰',
  affiliation: '🔗',
  ad:          '📺',
  other:       '📄',
}

function parseTags(raw: string | null | undefined): string[] {
  try { return JSON.parse(raw ?? '[]') } catch { return [] }
}

function fmtDate(d: string | null) {
  if (!d) return null
  try { return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) }
  catch { return d }
}

// ── Blank form ────────────────────────────────────────────────────────────────

type FormState = {
  type:     EntryType
  title:    string
  detail:   string
  date:     string
  source:   string
  citation: string
  tags:     string   // comma-separated
}

const BLANK_FORM: FormState = {
  type: 'other', title: '', detail: '', date: '', source: '', citation: '', tags: '',
}

// ── Entry Form Modal ──────────────────────────────────────────────────────────

function EntryModal({
  initial,
  onClose,
  onSave,
}: {
  initial:  FormState
  onClose:  () => void
  onSave:   (form: FormState) => Promise<void>
}) {
  const [form,   setForm]   = useState<FormState>(initial)
  const [saving, setSaving] = useState(false)
  const [err,    setErr]    = useState('')

  function set(key: keyof FormState, val: string) {
    setForm(f => ({ ...f, [key]: val }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim())  { setErr('Title is required.'); return }
    if (!form.detail.trim()) { setErr('Detail is required.'); return }
    setSaving(true)
    setErr('')
    try {
      await onSave(form)
      onClose()
    } catch (ex) {
      setErr((ex as Error).message || 'Save failed.')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-navy/70 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="h-1.5 bg-gradient-to-r from-navy via-red-500 to-gold-400" />

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-display font-black text-sm uppercase tracking-wide text-navy">
            {initial.title ? 'Edit Entry' : 'Add Entry'}
          </h2>
          <button onClick={onClose} className="text-xl text-gray-300 hover:text-navy leading-none">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4">
          {/* Type */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Type</label>
            <select
              value={form.type}
              onChange={e => set('type', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-navy/30"
            >
              <option value="vote">Vote</option>
              <option value="quote">Quote</option>
              <option value="donor">Donor</option>
              <option value="affiliation">Affiliation</option>
              <option value="ad">Ad</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Title <span className="text-red-400">*</span></label>
            <input
              type="text"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="Brief headline…"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
            />
          </div>

          {/* Detail */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Detail <span className="text-red-400">*</span></label>
            <textarea
              value={form.detail}
              onChange={e => set('detail', e.target.value)}
              rows={4}
              placeholder="Full context, notes, quotes…"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-navy/30"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Date (optional)</label>
            <input
              type="date"
              value={form.date}
              onChange={e => set('date', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
            />
          </div>

          {/* Source */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Source (optional)</label>
            <input
              type="text"
              value={form.source}
              onChange={e => set('source', e.target.value)}
              placeholder="e.g. NH Union Leader"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
            />
          </div>

          {/* Citation */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Citation (optional)</label>
            <input
              type="text"
              value={form.citation}
              onChange={e => set('citation', e.target.value)}
              placeholder="URL or reference…"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Tags (comma-separated, optional)</label>
            <input
              type="text"
              value={form.tags}
              onChange={e => set('tags', e.target.value)}
              placeholder="e.g. gun-control, abortion, 2022"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
            />
          </div>

          {err && <p className="text-xs text-red-500 font-semibold">{err}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-500 hover:border-navy hover:text-navy font-black uppercase tracking-widest text-xs py-2.5 rounded-xl transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 bg-navy hover:bg-navy-700 disabled:opacity-50 text-white font-black uppercase tracking-widest text-xs py-2.5 rounded-xl transition-colors">
              {saving ? 'Saving…' : 'Save Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Import from Threats modal ─────────────────────────────────────────────────

function ImportThreatsModal({
  threats,
  onClose,
  onImport,
}: {
  threats:  Threat[]
  onClose:  () => void
  onImport: (form: FormState) => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-navy/70 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="h-1.5 bg-gradient-to-r from-red-500 to-gold-400" />
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-display font-black text-sm uppercase tracking-wide text-navy">Import from Threats</h2>
          <button onClick={onClose} className="text-xl text-gray-300 hover:text-navy leading-none">✕</button>
        </div>
        <div className="overflow-y-auto p-4 space-y-2">
          {threats.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-8">No threats available. Run a War Room scan first.</p>
          )}
          {threats.map(t => (
            <button
              key={t.id}
              onClick={() => {
                onImport({
                  type:     'other',
                  title:    t.threat,
                  detail:   t.why,
                  date:     '',
                  source:   '',
                  citation: '',
                  tags:     '',
                })
                onClose()
              }}
              className="w-full text-left bg-gray-50 hover:bg-red-50 border border-gray-200 hover:border-red-200 rounded-xl px-4 py-3 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                  t.severity === 'HIGH' ? 'bg-red-100 text-red-700' :
                  t.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-blue-100 text-blue-700'
                }`}>{t.severity}</span>
              </div>
              <p className="text-xs font-bold text-navy line-clamp-2">{t.threat}</p>
              <p className="text-[11px] text-gray-500 mt-1 line-clamp-1">{t.why}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Entry Card ────────────────────────────────────────────────────────────────

function EntryCard({
  entry,
  onEdit,
  onDelete,
}: {
  entry:    OppEntry
  onEdit:   (entry: OppEntry) => void
  onDelete: (id: string) => void
}) {
  const [expanded,  setExpanded]  = useState(false)
  const [deleting,  setDeleting]  = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const tags = parseTags(entry.tags)

  async function handleDelete() {
    if (!confirmDel) { setConfirmDel(true); return }
    setDeleting(true)
    try {
      await fetch('/api/opp-research', {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id: entry.id }),
      })
      onDelete(entry.id)
    } finally { setDeleting(false) }
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm overflow-hidden hover:border-navy/20 transition-colors">
      <div className="h-1 bg-gradient-to-r from-navy via-red-500 to-transparent" />
      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base">{TYPE_ICON[entry.type]}</span>
            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${TYPE_BADGE[entry.type]}`}>
              {entry.type}
            </span>
            {entry.date && (
              <span className="text-[10px] text-gray-400 font-bold">{fmtDate(entry.date)}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => onEdit(entry)}
              className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border border-gray-200 text-gray-400 hover:border-navy hover:text-navy transition-colors"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border transition-colors ${
                confirmDel
                  ? 'border-red-400 text-red-500 hover:bg-red-50'
                  : 'border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-400'
              }`}
            >
              {deleting ? '…' : confirmDel ? 'Confirm?' : 'Delete'}
            </button>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-display font-black text-navy text-sm leading-snug mb-2">{entry.title}</h3>

        {/* Detail */}
        <p className={`text-xs text-gray-600 leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>
          {entry.detail}
        </p>
        {entry.detail.length > 120 && (
          <button
            onClick={() => setExpanded(x => !x)}
            className="text-[10px] font-bold text-navy/50 hover:text-navy mt-1 transition-colors"
          >
            {expanded ? '↑ Show less' : '↓ Show more'}
          </button>
        )}

        {/* Source / Citation */}
        {(entry.source || entry.citation) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {entry.source && (
              <span className="text-[10px] bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1 text-gray-500 font-semibold">
                📰 {entry.source}
              </span>
            )}
            {entry.citation && (
              <span className="text-[10px] bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1 text-gray-500 font-semibold max-w-[200px] truncate">
                🔗 {entry.citation}
              </span>
            )}
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tags.map(tag => (
              <span key={tag} className="text-[10px] bg-navy/5 text-navy font-bold px-2 py-0.5 rounded-full">
                #{tag.trim()}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function OppResearchDossier() {
  const [activeTab,     setActiveTab]     = useState<TabType>('all')
  const [entries,       setEntries]       = useState<OppEntry[]>([])
  const [threats,       setThreats]       = useState<Threat[]>([])
  const [loading,       setLoading]       = useState(true)
  const [showAddModal,  setShowAddModal]  = useState(false)
  const [editEntry,     setEditEntry]     = useState<OppEntry | null>(null)
  const [showImport,    setShowImport]    = useState(false)
  const [importPrefill, setImportPrefill] = useState<FormState | null>(null)
  const [briefContent,  setBriefContent]  = useState('')
  const [briefMeta,     setBriefMeta]     = useState<{ entryCount: number; threatCount: number } | null>(null)
  const [generatingBrief, setGeneratingBrief] = useState(false)
  const [briefError,    setBriefError]    = useState('')

  // Load entries when tab changes
  const loadEntries = useCallback(async (tab: TabType) => {
    setLoading(true)
    try {
      const url = tab === 'all' ? '/api/opp-research' : `/api/opp-research?type=${tab}`
      const res  = await fetch(url)
      const data = await res.json()
      setEntries(Array.isArray(data) ? data : [])
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { loadEntries(activeTab) }, [activeTab, loadEntries])

  // Load threats for import modal
  async function loadThreats() {
    const res  = await fetch('/api/war-room')
    const data = await res.json()
    setThreats(data.threats ?? [])
  }

  function handleTabChange(tab: TabType) {
    setActiveTab(tab)
  }

  // Build tags array from comma-separated string
  function formToPayload(form: FormState) {
    return {
      type:     form.type,
      title:    form.title.trim(),
      detail:   form.detail.trim(),
      date:     form.date || undefined,
      source:   form.source.trim() || undefined,
      citation: form.citation.trim() || undefined,
      tags:     form.tags.split(',').map(t => t.trim()).filter(Boolean),
    }
  }

  async function handleCreate(form: FormState) {
    const res  = await fetch('/api/opp-research', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(formToPayload(form)),
    })
    if (!res.ok) throw new Error('Failed to create entry.')
    const entry = await res.json() as OppEntry
    // Add optimistically if tab matches
    if (activeTab === 'all' || activeTab === entry.type) {
      setEntries(prev => [entry, ...prev])
    }
  }

  async function handleUpdate(form: FormState) {
    if (!editEntry) return
    const res = await fetch('/api/opp-research', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id: editEntry.id, ...formToPayload(form) }),
    })
    if (!res.ok) throw new Error('Failed to update entry.')
    const updated = await res.json() as OppEntry
    setEntries(prev => prev.map(e => e.id === updated.id ? updated : e))
    // If type changed and we're on a type tab, remove from view
    if (activeTab !== 'all' && updated.type !== activeTab) {
      setEntries(prev => prev.filter(e => e.id !== updated.id))
    }
  }

  function handleDelete(id: string) {
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  function openEdit(entry: OppEntry) {
    setEditEntry(entry)
  }

  function entryToForm(entry: OppEntry): FormState {
    return {
      type:     entry.type,
      title:    entry.title,
      detail:   entry.detail,
      date:     entry.date ? entry.date.split('T')[0] : '',
      source:   entry.source ?? '',
      citation: entry.citation ?? '',
      tags:     parseTags(entry.tags).join(', '),
    }
  }

  function handleImportSelect(form: FormState) {
    setImportPrefill(form)
    setShowAddModal(true)
  }

  async function openImport() {
    await loadThreats()
    setShowImport(true)
  }

  async function generateBrief() {
    setGeneratingBrief(true)
    setBriefError('')
    setBriefContent('')
    try {
      const res  = await fetch('/api/opp-research/brief', { method: 'POST' })
      const data = await res.json()
      if (data.error === 'no_data') {
        setBriefError('Add at least one opposition research entry or War Room threat before generating a brief.')
      } else if (data.brief) {
        setBriefContent(data.brief)
        setBriefMeta({ entryCount: data.entryCount, threatCount: data.threatCount })
      }
    } catch {
      setBriefError('Generation failed. Try again.')
    } finally {
      setGeneratingBrief(false)
    }
  }

  return (
    <div className="space-y-8">

      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden bg-hero-gradient shadow-patriot">
        <div className="absolute inset-0 bg-stripe-pattern opacity-40" />
        <div className="absolute inset-0 flex items-center justify-end pr-12 pointer-events-none select-none">
          <span className="text-white opacity-[0.03] text-[200px] font-black leading-none">🗂</span>
        </div>
        <div className="relative px-8 py-10">
          <div className="inline-flex items-center gap-2 bg-navy/60 text-gold-300 text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full mb-4 border border-gold-400/30">
            War Room
          </div>
          <h1 className="font-display text-5xl font-black text-white leading-tight mb-2">
            Opposition <span className="text-gold-400">Research.</span>
          </h1>
          <p className="text-blue-200 text-lg max-w-xl mb-6">
            Your persistent dossier of votes, quotes, donor ties, and opposition ad footage — organized and ready to deploy.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => { setImportPrefill(null); setShowAddModal(true) }}
              className="bg-red-500 hover:bg-red-600 text-white font-black px-6 py-3 rounded-xl text-sm tracking-widest uppercase shadow-glow-red transition-colors"
            >
              + Add Entry
            </button>
            <button
              onClick={openImport}
              className="bg-white/10 hover:bg-white/20 text-white font-black px-6 py-3 rounded-xl text-sm tracking-widest uppercase border border-white/20 transition-colors"
            >
              ⚡ Import from Threats
            </button>
            <button
              onClick={generateBrief}
              disabled={generatingBrief}
              className="flex items-center gap-2 bg-gold-400 hover:bg-gold-500 disabled:opacity-50 text-navy font-black px-6 py-3 rounded-xl text-sm tracking-widest uppercase transition-colors"
            >
              {generatingBrief
                ? <><span className="w-3.5 h-3.5 border-2 border-navy/30 border-t-navy rounded-full animate-spin" /> Generating…</>
                : '🗂 Attack Brief'}
            </button>
            {briefError && <p className="text-red-300 text-xs font-bold mt-1">{briefError}</p>}
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border-2 border-gray-100 p-4 text-center">
          <div className="text-3xl font-black text-navy">{entries.length}</div>
          <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mt-1">
            {activeTab === 'all' ? 'Total Entries' : `${activeTab} Entries`}
          </div>
        </div>
        <div className="bg-white rounded-2xl border-2 border-gray-100 p-4 text-center">
          <div className="text-3xl font-black text-red-500">
            {entries.filter(e => e.type === 'vote' || e.type === 'quote').length}
          </div>
          <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mt-1">Votes + Quotes</div>
        </div>
        <div className="bg-white rounded-2xl border-2 border-gray-100 p-4 text-center">
          <div className="text-3xl font-black text-yellow-600">
            {entries.filter(e => e.type === 'donor' || e.type === 'affiliation').length}
          </div>
          <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mt-1">Donors + Ties</div>
        </div>
      </div>

      {/* Type tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-colors ${
              activeTab === tab.key
                ? 'bg-navy text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-500 hover:border-navy hover:text-navy'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Entries */}
      {loading && (
        <div className="flex items-center justify-center py-16 gap-3">
          <span className="w-5 h-5 border-2 border-navy border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-400">Loading entries…</span>
        </div>
      )}

      {!loading && entries.length === 0 && (
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 py-16 text-center">
          <div className="text-5xl mb-4 opacity-30">🗂</div>
          <p className="text-gray-500 font-semibold">No entries yet.</p>
          <p className="text-gray-400 text-sm mt-1">Add your first O.R. entry or import a threat from the War Room.</p>
          <button
            onClick={() => { setImportPrefill(null); setShowAddModal(true) }}
            className="mt-6 bg-navy text-white font-black uppercase tracking-widest text-xs px-6 py-3 rounded-xl hover:bg-navy-700 transition-colors"
          >
            + Add Entry
          </button>
        </div>
      )}

      {!loading && entries.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {entries.map(entry => (
            <EntryCard
              key={entry.id}
              entry={entry}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showAddModal && (
        <EntryModal
          initial={importPrefill ?? BLANK_FORM}
          onClose={() => { setShowAddModal(false); setImportPrefill(null) }}
          onSave={handleCreate}
        />
      )}

      {editEntry && (
        <EntryModal
          initial={entryToForm(editEntry)}
          onClose={() => setEditEntry(null)}
          onSave={handleUpdate}
        />
      )}

      {showImport && (
        <ImportThreatsModal
          threats={threats}
          onClose={() => setShowImport(false)}
          onImport={handleImportSelect}
        />
      )}

      {/* ── Attack Brief Modal ─────────────────────────────────────────── */}
      {briefContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setBriefContent('')}>
          <div className="absolute inset-0 bg-navy/70 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="h-1.5 bg-gradient-to-r from-red-500 via-red-600 to-gold-400" />
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-0.5">Opposition Research</p>
                <h2 className="font-display font-black text-navy uppercase tracking-wide text-sm">Attack Brief</h2>
                {briefMeta && (
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Built from {briefMeta.entryCount} dossier {briefMeta.entryCount === 1 ? 'entry' : 'entries'}
                    {briefMeta.threatCount > 0 && ` + ${briefMeta.threatCount} War Room ${briefMeta.threatCount === 1 ? 'threat' : 'threats'}`}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigator.clipboard.writeText(briefContent)}
                  className="text-xs bg-navy text-white px-3 py-1.5 rounded-xl font-bold hover:bg-navy-700 transition"
                >
                  Copy
                </button>
                <button onClick={() => setBriefContent('')} className="text-xl text-gray-300 hover:text-navy leading-none ml-1">✕</button>
              </div>
            </div>
            <div className="overflow-y-auto p-6">
              <div className="prose prose-sm max-w-none prose-headings:font-black prose-headings:text-navy prose-headings:uppercase prose-headings:tracking-wide prose-strong:text-navy">
                {briefContent.split('\n').map((line, i) => {
                  if (line.startsWith('## ')) return <h3 key={i} className="text-xs font-black uppercase tracking-widest text-navy border-b border-gray-100 pb-2 mt-6 mb-3">{line.replace('## ', '')}</h3>
                  if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="text-xs font-black text-navy mt-3 mb-1">{line.replace(/\*\*/g, '')}</p>
                  if (line.trim() === '') return <div key={i} className="h-2" />
                  return <p key={i} className="text-sm text-gray-700 leading-relaxed">{line}</p>
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
