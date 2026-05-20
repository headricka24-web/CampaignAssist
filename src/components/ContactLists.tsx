'use client'

import { useState, useEffect, useCallback } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

type ContactListRecord = {
  id: string; name: string; description: string | null; totalCount: number; createdAt: string
  _count: { contacts: number; segments: number }
}

type SegmentRecord = {
  id: string; name: string; assignedTo: string | null; shareToken: string
  totalCount: number; workedCount: number; callScript: string | null; listId: string
  list: { name: string }
}

const TONES = [
  { key: 'friendly',       label: 'Friendly'       },
  { key: 'professional',   label: 'Professional'   },
  { key: 'conversational', label: 'Conversational' },
  { key: 'urgent',         label: 'Urgent'         },
]

const PURPOSES = [
  { key: 'gotv',        label: 'Get Out The Vote'      },
  { key: 'voter_id',    label: 'Voter ID'              },
  { key: 'persuasion',  label: 'Persuasion'            },
  { key: 'fundraising', label: 'Fundraising'           },
  { key: 'volunteer',   label: 'Volunteer Recruitment' },
]

// ── Script Modal ──────────────────────────────────────────────────────────────

function ScriptModal({ seg, onClose, onSaved }: {
  seg: SegmentRecord
  onClose: () => void
  onSaved: (script: string) => void
}) {
  const [script,      setScript]      = useState(seg.callScript ?? '')
  const [tone,        setTone]        = useState('friendly')
  const [purpose,     setPurpose]     = useState('gotv')
  const [generating,  setGenerating]  = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [saved,       setSaved]       = useState(false)
  const [editing,     setEditing]     = useState(false)
  const [showGenForm, setShowGenForm] = useState(!seg.callScript)

  async function generate() {
    setGenerating(true)
    try {
      const res  = await fetch(`/api/outreach/work/${seg.shareToken}/script`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ tone, purpose }),
      })
      const data = await res.json()
      if (res.ok) { setScript(data.script); setShowGenForm(false); onSaved(data.script) }
    } finally { setGenerating(false) }
  }

  async function save() {
    setSaving(true)
    try {
      await fetch(`/api/outreach/work/${seg.shareToken}/script`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ script }),
      })
      setSaved(true); onSaved(script)
      setTimeout(() => setSaved(false), 2000)
    } finally { setSaving(false) }
  }

  function renderScript(text: string) {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('## ')) {
        return <p key={i} className="text-[10px] font-black uppercase tracking-widest text-navy mt-4 mb-1 pb-1 border-b border-navy/10">{line.replace('## ', '')}</p>
      }
      if (line.startsWith('**') && line.includes('**→')) {
        const [obj, resp] = line.replace(/\*\*/g, '').split('→')
        return <p key={i} className="text-sm text-gray-700 mb-1"><span className="font-bold text-navy">{obj?.trim()}</span><span className="text-gray-400"> → </span>{resp?.trim()}</p>
      }
      if (line.startsWith('- ') || line.startsWith('• ')) {
        return <p key={i} className="text-sm text-gray-700 pl-3 mb-0.5">• {line.slice(2)}</p>
      }
      if (line.trim() === '') return <div key={i} className="h-1" />
      return <p key={i} className="text-sm text-gray-700 leading-relaxed mb-0.5">{line}</p>
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-navy/70 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="h-1.5 bg-gradient-to-r from-navy via-blue-500 to-gold-400" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="font-display font-black text-sm uppercase tracking-wide text-navy">Call Script — {seg.name}</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">Changes save to this segment and appear on volunteer links</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowGenForm(v => !v)}
              className="text-xs font-bold border border-navy-100 text-navy hover:bg-navy hover:text-white px-3 py-1.5 rounded-lg transition-colors">
              ⟳ {seg.callScript ? 'Regenerate' : 'Generate'}
            </button>
            <button onClick={onClose} className="text-xl text-gray-300 hover:text-navy leading-none">✕</button>
          </div>
        </div>

        {/* Generate form */}
        {showGenForm && (
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 shrink-0 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Tone</label>
                <select value={tone} onChange={e => setTone(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 text-navy bg-white focus:outline-none focus:ring-2 focus:ring-gold-400">
                  {TONES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Purpose</label>
                <select value={purpose} onChange={e => setPurpose(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 text-navy bg-white focus:outline-none focus:ring-2 focus:ring-gold-400">
                  {PURPOSES.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                </select>
              </div>
            </div>
            <button onClick={generate} disabled={generating}
              className="w-full bg-navy text-white font-bold py-2.5 rounded-xl text-sm hover:bg-navy-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
              {generating
                ? <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Generating…</>
                : '★ Generate Script'}
            </button>
          </div>
        )}

        {/* Script body */}
        {script ? (
          <>
            <div className="flex items-center justify-between px-6 pt-4 pb-2 shrink-0">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Script</span>
              <button onClick={() => setEditing(v => !v)}
                className="text-[10px] font-bold border border-gray-200 text-gray-500 hover:text-navy hover:border-navy px-3 py-1 rounded-lg transition-colors">
                {editing ? '👁 Preview' : '✎ Edit'}
              </button>
            </div>
            <div className="overflow-y-auto px-6 pb-4 flex-1">
              {editing ? (
                <textarea
                  value={script} onChange={e => setScript(e.target.value)}
                  className="w-full text-sm font-mono border border-gray-200 rounded-xl px-3 py-2.5 text-navy focus:outline-none focus:ring-2 focus:ring-gold-400 resize-none leading-relaxed"
                  style={{ minHeight: '320px' }}
                />
              ) : (
                <div>{renderScript(script)}</div>
              )}
            </div>
            <div className="px-6 py-3 border-t border-gray-100 flex gap-2 shrink-0">
              <button onClick={save} disabled={saving}
                className={`flex-1 font-bold py-2.5 rounded-xl text-sm transition-colors ${saved ? 'bg-green-500 text-white' : 'bg-navy text-white hover:bg-navy-700 disabled:opacity-60'}`}>
                {saving ? 'Saving…' : saved ? '✔ Saved' : 'Save Changes'}
              </button>
              <button onClick={() => navigator.clipboard.writeText(script)}
                className="px-4 py-2.5 text-sm font-bold border border-gray-200 text-gray-500 hover:text-navy hover:border-navy rounded-xl transition-colors">
                Copy
              </button>
            </div>
          </>
        ) : !showGenForm ? (
          <div className="flex-1 flex items-center justify-center p-10 text-center">
            <div>
              <p className="text-4xl mb-3 opacity-20">📄</p>
              <p className="font-bold text-navy text-sm mb-1">No script yet</p>
              <p className="text-gray-400 text-xs">Click Generate above to create one.</p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

// ── Progress Bar ──────────────────────────────────────────────────────────────

function Progress({ worked, total }: { worked: number; total: number }) {
  const pct = total > 0 ? Math.round((worked / total) * 100) : 0
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
        <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-bold text-gray-500 tabular-nums w-12 text-right">{worked}/{total}</span>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ContactLists() {
  const [lists,          setLists]          = useState<ContactListRecord[]>([])
  const [segments,       setSegments]       = useState<SegmentRecord[]>([])
  const [loading,        setLoading]        = useState(true)
  const [expandedListId, setExpandedListId] = useState<string | null>(null)

  // Create list modal
  const [showCreate,  setShowCreate]  = useState(false)
  const [newName,     setNewName]     = useState('')
  const [newDesc,     setNewDesc]     = useState('')
  const [creating,    setCreating]    = useState(false)

  // CSV import
  const [importingId, setImportingId] = useState<string | null>(null)
  const [csvText,     setCsvText]     = useState('')
  const [importing,   setImporting]   = useState(false)
  const [importMsg,   setImportMsg]   = useState('')

  // Segment creation
  const [segmentingId,    setSegmentingId]    = useState<string | null>(null)
  const [segmentCount,    setSegmentCount]    = useState('4')
  const [segmentNames,    setSegmentNames]    = useState<string[]>([])
  const [segmenting,      setSegmenting]      = useState(false)

  // Segment rename/assign
  const [editSeg,    setEditSeg]    = useState<SegmentRecord | null>(null)
  const [editName,   setEditName]   = useState('')
  const [editAssign, setEditAssign] = useState('')
  const [savingSeg,  setSavingSeg]  = useState(false)

  // Copied link feedback
  const [copiedToken, setCopiedToken] = useState<string | null>(null)

  // Script modal
  const [scriptSeg, setScriptSeg] = useState<SegmentRecord | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [listsRes, segsRes] = await Promise.all([
        fetch('/api/outreach/lists'),
        fetch('/api/outreach/segments'),
      ])
      setLists(await listsRes.json())
      setSegments(await segsRes.json())
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  // Sync segmentNames array length when segmentCount changes
  useEffect(() => {
    const n = Math.max(1, Math.min(100, parseInt(segmentCount) || 1))
    setSegmentNames(prev => {
      const next = [...prev]
      while (next.length < n) next.push(`List ${next.length + 1}`)
      return next.slice(0, n)
    })
  }, [segmentCount])

  async function createList() {
    if (!newName.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/outreach/lists', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), description: newDesc.trim() || undefined }),
      })
      const list = await res.json()
      setLists(prev => [{ ...list, _count: { contacts: 0, segments: 0 } }, ...prev])
      setShowCreate(false); setNewName(''); setNewDesc('')
    } finally { setCreating(false) }
  }

  async function deleteList(id: string) {
    if (!confirm('Delete this list and all its contacts? This cannot be undone.')) return
    await fetch(`/api/outreach/lists/${id}`, { method: 'DELETE' })
    setLists(prev => prev.filter(l => l.id !== id))
    setSegments(prev => prev.filter(s => s.listId !== id))
    if (expandedListId === id) setExpandedListId(null)
  }

  async function importCSV(listId: string) {
    if (!csvText.trim()) return
    setImporting(true); setImportMsg('')
    try {
      const res  = await fetch(`/api/outreach/lists/${listId}/import`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv: csvText }),
      })
      const data = await res.json()
      if (res.ok) {
        setImportMsg(`✔ ${data.imported} contacts imported`)
        setCsvText('')
        await load()
      } else {
        setImportMsg(`✘ ${data.error}`)
      }
    } finally { setImporting(false) }
  }

  async function createSegments(listId: string) {
    const n = parseInt(segmentCount) || 1
    if (n < 1) return
    setSegmenting(true)
    try {
      const res  = await fetch(`/api/outreach/lists/${listId}/segments`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ segmentCount: n, names: segmentNames }),
      })
      const data = await res.json()
      if (res.ok) {
        await load()
        setSegmentingId(null)
      } else {
        alert(data.error === 'no_unassigned' ? 'All contacts in this list are already assigned to a segment.' : data.error)
      }
    } finally { setSegmenting(false) }
  }

  async function saveSegment() {
    if (!editSeg) return
    setSavingSeg(true)
    try {
      const res = await fetch(`/api/outreach/segments/${editSeg.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, assignedTo: editAssign }),
      })
      const updated = await res.json()
      setSegments(prev => prev.map(s => s.id === updated.id ? { ...s, name: updated.name, assignedTo: updated.assignedTo } : s))
      setEditSeg(null)
    } finally { setSavingSeg(false) }
  }

  async function deleteSegment(id: string) {
    if (!confirm('Delete this segment? Contacts will be returned to the unassigned pool.')) return
    await fetch(`/api/outreach/segments/${id}`, { method: 'DELETE' })
    setSegments(prev => prev.filter(s => s.id !== id))
    await load()
  }

  function copyLink(token: string) {
    const url = `${window.location.origin}/outreach/work/${token}`
    navigator.clipboard.writeText(url)
    setCopiedToken(token)
    setTimeout(() => setCopiedToken(null), 2000)
  }

  if (loading) return (
    <div className="flex items-center gap-2 py-10 justify-center text-gray-400 text-sm">
      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      Loading lists…
    </div>
  )

  const listSegments = (listId: string) => segments.filter(s => s.listId === listId)

  return (
    <div className="space-y-5">

      {/* Hero */}
      <div className="relative bg-hero-gradient rounded-2xl overflow-hidden shadow-patriot">
        <div className="absolute inset-0 bg-stripe-pattern opacity-40" />
        <div className="absolute top-3 right-5 text-white opacity-10 text-5xl select-none">★★★</div>
        <div className="relative p-6 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-gold-400 text-lg">★</span>
              <h2 className="font-display font-bold text-white text-xl tracking-wide">Contact Lists</h2>
            </div>
            <p className="text-blue-300 text-sm max-w-md">Import voter or donor lists, split them into work segments, and share a link with each volunteer. They work their list on any device — no login required.</p>
          </div>
          <button onClick={() => setShowCreate(true)}
            className="shrink-0 bg-red-500 hover:bg-red-600 text-white font-bold px-5 py-2.5 rounded-lg text-sm tracking-widest uppercase shadow-glow-red transition-colors focus:outline-none focus:ring-2 focus:ring-gold-400">
            + New List
          </button>
        </div>
      </div>

      {/* Empty state */}
      {lists.length === 0 && (
        <div className="bg-white rounded-2xl border-2 border-gray-100 py-14 text-center shadow-sm">
          <p className="text-5xl mb-3 opacity-20">📋</p>
          <p className="font-bold text-navy text-sm">No contact lists yet</p>
          <p className="text-gray-400 text-xs mt-1">Create a list, import a CSV, then split it into segments for your team.</p>
        </div>
      )}

      {/* Lists */}
      {lists.map(list => {
        const segs    = listSegments(list.id)
        const isOpen  = expandedListId === list.id
        const total   = segs.reduce((s, seg) => s + seg.totalCount, 0)
        const worked  = segs.reduce((s, seg) => s + seg.workedCount, 0)

        return (
          <div key={list.id} className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm overflow-hidden">

            {/* List header */}
            <div className="flex items-center justify-between px-5 py-4 cursor-pointer select-none hover:bg-gray-50 transition-colors"
              onClick={() => setExpandedListId(isOpen ? null : list.id)}>
              <div className="flex items-center gap-3 min-w-0">
                <span className={`text-sm transition-transform ${isOpen ? 'rotate-90' : ''}`}>▶</span>
                <div className="min-w-0">
                  <p className="font-bold text-navy text-sm truncate">{list.name}</p>
                  {list.description && <p className="text-xs text-gray-400 truncate">{list.description}</p>}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-4">
                <span className="text-xs text-gray-400 hidden sm:block">{list._count.contacts.toLocaleString()} contacts · {list._count.segments} segments</span>
                {segs.length > 0 && (
                  <div className="w-24 hidden sm:block">
                    <Progress worked={worked} total={total} />
                  </div>
                )}
                <button onClick={e => { e.stopPropagation(); deleteList(list.id) }}
                  className="text-xs text-red-300 hover:text-red-500 font-bold px-2 py-1 rounded-lg hover:bg-red-50 transition-colors">
                  ✕
                </button>
              </div>
            </div>

            {/* Expanded content */}
            {isOpen && (
              <div className="border-t border-gray-100 px-5 pb-5 pt-4 space-y-5">

                {/* Import CSV */}
                {importingId === list.id ? (
                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Paste CSV</p>
                    <p className="text-xs text-gray-400">
                      Headers auto-detected: <span className="font-mono">FirstName, LastName, Phone, Email, Address, City, State, Zip, Party, SupportLevel, Notes</span>
                    </p>
                    <textarea
                      value={csvText}
                      onChange={e => setCsvText(e.target.value)}
                      rows={6}
                      placeholder="FirstName,LastName,Phone,Email,Address&#10;Jane,Smith,(555) 123-4567,jane@example.com,123 Main St"
                      className="w-full text-xs font-mono border border-gray-200 rounded-xl px-3 py-2.5 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-gold-400 resize-none"
                    />
                    {importMsg && (
                      <p className={`text-xs font-bold ${importMsg.startsWith('✔') ? 'text-green-600' : 'text-red-500'}`}>{importMsg}</p>
                    )}
                    <div className="flex gap-2">
                      <button onClick={() => importCSV(list.id)} disabled={importing || !csvText.trim()}
                        className="bg-navy text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-navy-700 disabled:opacity-50 transition-colors">
                        {importing ? 'Importing…' : 'Import'}
                      </button>
                      <button onClick={() => { setImportingId(null); setCsvText(''); setImportMsg('') }}
                        className="text-xs text-gray-400 hover:text-gray-600 px-3 py-2 rounded-lg transition-colors">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => { setImportingId(list.id); setImportMsg('') }}
                      className="text-xs font-bold border border-navy text-navy hover:bg-navy hover:text-white px-4 py-2 rounded-lg transition-colors">
                      ↑ Import CSV
                    </button>
                    {list._count.contacts > 0 && (
                      <button onClick={() => { setSegmentingId(list.id) }}
                        className="text-xs font-bold border border-gold-400 text-gold-600 hover:bg-gold-400 hover:text-navy px-4 py-2 rounded-lg transition-colors">
                        ✂ Split into Segments
                      </button>
                    )}
                  </div>
                )}

                {/* Segment creation form */}
                {segmentingId === list.id && (
                  <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Create Segments</p>
                    <div className="flex items-center gap-3">
                      <label className="text-xs text-gray-600 font-bold">Number of segments:</label>
                      <input type="number" min={1} max={100} value={segmentCount}
                        onChange={e => setSegmentCount(e.target.value)}
                        className="w-20 text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-navy focus:outline-none focus:ring-2 focus:ring-gold-400" />
                      <span className="text-xs text-gray-400">
                        ≈ {Math.ceil(list._count.contacts / (parseInt(segmentCount) || 1))} contacts each
                      </span>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Name each segment</p>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {segmentNames.map((name, i) => (
                          <input key={i} value={name}
                            onChange={e => setSegmentNames(prev => { const n = [...prev]; n[i] = e.target.value; return n })}
                            placeholder={`Segment ${i + 1}`}
                            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-navy focus:outline-none focus:ring-2 focus:ring-gold-400" />
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => createSegments(list.id)} disabled={segmenting}
                        className="bg-navy text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-navy-700 disabled:opacity-50 transition-colors">
                        {segmenting ? 'Creating…' : 'Create Segments'}
                      </button>
                      <button onClick={() => setSegmentingId(null)}
                        className="text-xs text-gray-400 hover:text-gray-600 px-3 py-2 rounded-lg transition-colors">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Segments */}
                {segs.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">
                      Segments ({segs.length})
                    </p>
                    {segs.map(seg => (
                      <div key={seg.id} className="border border-gray-100 rounded-xl px-4 py-3 bg-gray-50/60 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold text-sm text-navy truncate">{seg.name}</p>
                              {seg.assignedTo && (
                                <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                  → {seg.assignedTo}
                                </span>
                              )}
                            </div>
                            <div className="mt-2">
                              <Progress worked={seg.workedCount} total={seg.totalCount} />
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button onClick={() => copyLink(seg.shareToken)}
                              className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all ${
                                copiedToken === seg.shareToken
                                  ? 'bg-green-500 text-white border-green-500'
                                  : 'border-navy text-navy hover:bg-navy hover:text-white'
                              }`}>
                              {copiedToken === seg.shareToken ? '✔ Copied!' : '🔗 Copy Link'}
                            </button>
                            <button onClick={() => setScriptSeg(seg)}
                              className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg border transition-colors ${
                                seg.callScript
                                  ? 'border-gold-300 text-gold-600 hover:bg-gold-400 hover:text-navy hover:border-gold-400'
                                  : 'border-gray-200 text-gray-400 hover:text-navy hover:border-navy'
                              }`}
                              title={seg.callScript ? 'Edit call script' : 'Create call script'}>
                              📄
                            </button>
                            <button onClick={() => { setEditSeg(seg); setEditName(seg.name); setEditAssign(seg.assignedTo ?? '') }}
                              className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-navy hover:border-navy transition-colors">
                              ✎
                            </button>
                            <button onClick={() => deleteSegment(seg.id)}
                              className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg border border-gray-100 text-red-300 hover:text-red-500 hover:border-red-200 transition-colors">
                              ✕
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* Create List Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div className="absolute inset-0 bg-navy/70 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="h-1.5 bg-gradient-to-r from-navy to-gold-400" />
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-display font-black text-sm uppercase tracking-wide text-navy">New Contact List</h2>
              <button onClick={() => setShowCreate(false)} className="text-xl text-gray-300 hover:text-navy leading-none">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">List Name *</label>
                <input value={newName} onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. Primary Voter List, Donor Call Time"
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 text-navy placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-gold-400" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">Description</label>
                <input value={newDesc} onChange={e => setNewDesc(e.target.value)}
                  placeholder="Optional note about this list"
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 text-navy placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-gold-400" />
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={createList} disabled={creating || !newName.trim()}
                  className="flex-1 bg-navy text-white font-bold py-2.5 rounded-xl text-sm hover:bg-navy-700 disabled:opacity-50 transition-colors">
                  {creating ? 'Creating…' : 'Create List'}
                </button>
                <button onClick={() => setShowCreate(false)}
                  className="px-5 text-sm text-gray-400 hover:text-gray-600 rounded-xl border border-gray-200 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Script Modal */}
      {scriptSeg && (
        <ScriptModal
          seg={scriptSeg}
          onClose={() => setScriptSeg(null)}
          onSaved={script => {
            setSegments(prev => prev.map(s => s.id === scriptSeg.id ? { ...s, callScript: script } : s))
            setScriptSeg(prev => prev ? { ...prev, callScript: script } : prev)
          }}
        />
      )}

      {/* Edit Segment Modal */}
      {editSeg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setEditSeg(null)}>
          <div className="absolute inset-0 bg-navy/70 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500" />
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-display font-black text-sm uppercase tracking-wide text-navy">Edit Segment</h2>
              <button onClick={() => setEditSeg(null)} className="text-xl text-gray-300 hover:text-navy leading-none">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">Segment Name</label>
                <input value={editName} onChange={e => setEditName(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 text-navy focus:outline-none focus:ring-2 focus:ring-gold-400" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">Assigned To</label>
                <input value={editAssign} onChange={e => setEditAssign(e.target.value)}
                  placeholder="Volunteer name (optional)"
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 text-navy placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-gold-400" />
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Share Link</p>
                <p className="text-xs font-mono text-gray-600 break-all">
                  {typeof window !== 'undefined' ? window.location.origin : ''}/outreach/work/{editSeg.shareToken}
                </p>
                <button onClick={() => copyLink(editSeg.shareToken)}
                  className="mt-2 text-[10px] font-bold text-navy hover:text-blue-500 transition-colors">
                  {copiedToken === editSeg.shareToken ? '✔ Copied!' : '📋 Copy link'}
                </button>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={saveSegment} disabled={savingSeg}
                  className="flex-1 bg-navy text-white font-bold py-2.5 rounded-xl text-sm hover:bg-navy-700 disabled:opacity-50 transition-colors">
                  {savingSeg ? 'Saving…' : 'Save'}
                </button>
                <button onClick={() => setEditSeg(null)}
                  className="px-5 text-sm text-gray-400 hover:text-gray-600 rounded-xl border border-gray-200 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

