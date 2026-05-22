'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'

// ── Types ─────────────────────────────────────────────────────────────────────

type ListContact = {
  id: string; firstName: string; lastName: string | null; phone: string | null
  email: string | null; address: string | null; city: string | null; state: string | null
  zip: string | null; party: string | null; supportLevel: string | null
  notes: string | null; disposition: string | null; dispositionNote: string | null
}

type SegmentData = {
  id: string; name: string; listName: string; assignedTo: string | null
  totalCount: number; workedCount: number; callScript: string | null; contacts: ListContact[]
}

// ── Constants ─────────────────────────────────────────────────────────────────

const DISPOSITIONS = [
  { key: 'Committed',     label: 'Committed ✓',    cls: 'bg-green-500 hover:bg-green-600 text-white'    },
  { key: 'Called',        label: 'Called',          cls: 'bg-blue-500 hover:bg-blue-600 text-white'     },
  { key: 'LeftVM',        label: 'Left VM',         cls: 'bg-indigo-500 hover:bg-indigo-600 text-white' },
  { key: 'NotInterested', label: 'Not Interested',  cls: 'bg-orange-500 hover:bg-orange-600 text-white' },
  { key: 'DoNotContact',  label: 'Do Not Contact',  cls: 'bg-red-600 hover:bg-red-700 text-white'       },
] as const

const DISPOSITION_BADGE: Record<string, string> = {
  Committed:    'bg-green-100 text-green-700',
  Called:       'bg-blue-100 text-blue-700',
  LeftVM:       'bg-indigo-100 text-indigo-700',
  NotInterested:'bg-orange-100 text-orange-700',
  DoNotContact: 'bg-red-100 text-red-700',
}

const PARTY_BADGE: Record<string, string> = {
  Democrat:    'bg-blue-100 text-blue-700',
  Republican:  'bg-red-100 text-red-700',
  Independent: 'bg-purple-100 text-purple-700',
}

const TONES = [
  { key: 'friendly',       label: 'Friendly'       },
  { key: 'professional',   label: 'Professional'   },
  { key: 'conversational', label: 'Conversational' },
  { key: 'urgent',         label: 'Urgent'         },
]

const PURPOSES = [
  { key: 'gotv',        label: 'Get Out The Vote'       },
  { key: 'voter_id',    label: 'Voter ID'               },
  { key: 'persuasion',  label: 'Persuasion'             },
  { key: 'fundraising', label: 'Fundraising'            },
  { key: 'volunteer',   label: 'Volunteer Recruitment'  },
]

// ── Script Panel ──────────────────────────────────────────────────────────────

function ScriptPanel({
  token, initialScript, onClose,
}: {
  token: string; initialScript: string | null; onClose: () => void
}) {
  const [script,      setScript]      = useState(initialScript ?? '')
  const [tone,        setTone]        = useState('friendly')
  const [purpose,     setPurpose]     = useState('gotv')
  const [generating,  setGenerating]  = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [saved,       setSaved]       = useState(false)
  const [showGenForm, setShowGenForm] = useState(!initialScript)

  async function generate() {
    setGenerating(true)
    try {
      const res  = await fetch(`/api/outreach/work/${token}/script`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ tone, purpose }),
      })
      const data = await res.json()
      if (res.ok) { setScript(data.script); setShowGenForm(false) }
    } finally { setGenerating(false) }
  }

  async function save() {
    setSaving(true)
    try {
      await fetch(`/api/outreach/work/${token}/script`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ script }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally { setSaving(false) }
  }

  // Render ## headers as styled section dividers
  function renderScript(text: string) {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('## ')) {
        return (
          <p key={i} className="text-[10px] font-black uppercase tracking-widest text-navy mt-5 mb-1 pb-1 border-b border-navy/10">
            {line.replace('## ', '')}
          </p>
        )
      }
      if (line.startsWith('**') && line.includes('**→')) {
        const [obj, resp] = line.replace(/\*\*/g, '').split('→')
        return (
          <p key={i} className="text-sm text-gray-700 mb-1">
            <span className="font-bold text-navy">{obj?.trim()}</span>
            <span className="text-gray-400"> → </span>
            {resp?.trim()}
          </p>
        )
      }
      if (line.startsWith('- ') || line.startsWith('• ')) {
        return <p key={i} className="text-sm text-gray-700 pl-3 mb-0.5">• {line.slice(2)}</p>
      }
      if (line.trim() === '') return <div key={i} className="h-1" />
      return <p key={i} className="text-sm text-gray-700 leading-relaxed mb-0.5">{line}</p>
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/50" onClick={onClose} />

      {/* Drawer */}
      <div className="w-full max-w-lg bg-white flex flex-col h-full shadow-2xl">
        {/* Header */}
        <div className="bg-navy px-5 py-4 flex items-center justify-between gap-3 shrink-0">
          <div>
            <h2 className="font-bold text-white text-base">Call Script</h2>
            <p className="text-blue-300 text-xs">Editable — changes save to this segment</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowGenForm(v => !v)}
              className="text-xs font-bold border border-blue-400 text-blue-200 hover:bg-navy-500 px-3 py-1.5 rounded-lg transition-colors">
              ⟳ Regenerate
            </button>
            <button onClick={onClose}
              className="text-white/60 hover:text-white text-xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-navy-500 transition-colors">
              ×
            </button>
          </div>
        </div>

        {/* Generation form */}
        {showGenForm && (
          <div className="border-b border-gray-100 px-5 py-4 bg-gray-50 shrink-0 space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Generate Script</p>
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

        {/* Script content — two modes: rendered preview + edit toggle */}
        {script ? (
          <ScriptEditor script={script} setScript={setScript} renderScript={renderScript} />
        ) : !showGenForm ? (
          <div className="flex-1 flex items-center justify-center p-6 text-center">
            <div>
              <p className="text-4xl mb-3 opacity-20">📄</p>
              <p className="font-bold text-navy text-sm mb-1">No script yet</p>
              <p className="text-gray-400 text-xs">Use the form above to generate one.</p>
              <button onClick={() => setShowGenForm(true)}
                className="mt-4 text-xs font-bold text-navy border border-navy px-4 py-2 rounded-lg hover:bg-navy hover:text-white transition-colors">
                ⟳ Show Generator
              </button>
            </div>
          </div>
        ) : null}

        {/* Footer */}
        {script && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center gap-2 shrink-0 bg-white">
            <button onClick={save} disabled={saving}
              className={`flex-1 font-bold py-2.5 rounded-xl text-sm transition-colors ${
                saved
                  ? 'bg-green-500 text-white'
                  : 'bg-navy text-white hover:bg-navy-700 disabled:opacity-60'
              }`}>
              {saving ? 'Saving…' : saved ? '✔ Saved' : 'Save Changes'}
            </button>
            <button onClick={() => navigator.clipboard.writeText(script)}
              className="px-4 py-2.5 text-sm font-bold border border-gray-200 text-gray-500 hover:text-navy hover:border-navy rounded-xl transition-colors">
              Copy
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// Toggles between rendered view and raw edit textarea
function ScriptEditor({
  script, setScript, renderScript,
}: {
  script: string
  setScript: (v: string) => void
  renderScript: (text: string) => React.ReactNode
}) {
  const [editing, setEditing] = useState(false)

  return (
    <div className="flex-1 overflow-y-auto flex flex-col">
      <div className="flex items-center justify-between px-5 pt-4 pb-2 shrink-0">
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Script</span>
        <button onClick={() => setEditing(v => !v)}
          className="text-[10px] font-bold border border-gray-200 text-gray-500 hover:text-navy hover:border-navy px-3 py-1 rounded-lg transition-colors">
          {editing ? '👁 Preview' : '✎ Edit'}
        </button>
      </div>

      {editing ? (
        <textarea
          value={script}
          onChange={e => setScript(e.target.value)}
          className="flex-1 mx-4 mb-4 text-sm font-mono border border-gray-200 rounded-xl px-3 py-2.5 text-navy focus:outline-none focus:ring-2 focus:ring-gold-400 resize-none leading-relaxed"
          style={{ minHeight: '300px' }}
        />
      ) : (
        <div className="px-5 pb-4 flex-1">
          {renderScript(script)}
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function WorkPage() {
  const params = useParams()
  const token  = params.token as string

  const [data,    setData]    = useState<SegmentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)
  const [idx,     setIdx]     = useState(0)
  const [note,    setNote]    = useState('')
  const [saving,  setSaving]  = useState(false)
  const [view,    setView]    = useState<'work' | 'list'>('work')
  const [showScript, setShowScript] = useState(false)

  const load = useCallback(async () => {
    try {
      const res  = await fetch(`/api/outreach/work/${token}`)
      const json = await res.json()
      if (!res.ok) { setError('List not found or link expired.'); return }
      setData(json)
      const firstUnworked = json.contacts.findIndex((c: ListContact) => !c.disposition)
      setIdx(firstUnworked >= 0 ? firstUnworked : 0)
    } catch {
      setError('Failed to load list.')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { load() }, [load])

  async function setDisposition(disposition: string) {
    if (!data) return
    const contact = data.contacts[idx]
    setSaving(true)
    try {
      await fetch(`/api/outreach/work/${token}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ contactId: contact.id, disposition, dispositionNote: note }),
      })
      setData(prev => {
        if (!prev) return prev
        const updated = [...prev.contacts]
        updated[idx] = { ...updated[idx], disposition, dispositionNote: note }
        const wasWorked = Boolean(contact.disposition)
        const isWorked  = disposition !== 'Skipped'
        const delta = (!wasWorked && isWorked) ? 1 : (wasWorked && !isWorked) ? -1 : 0
        return { ...prev, contacts: updated, workedCount: prev.workedCount + delta }
      })
      setNote('')
      const contacts = data.contacts
      for (let i = idx + 1; i < contacts.length; i++) {
        if (!contacts[i].disposition) { setIdx(i); return }
      }
      for (let i = 0; i < idx; i++) {
        if (!contacts[i].disposition) { setIdx(i); return }
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-3 border-navy border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Loading your list…</p>
      </div>
    </div>
  )

  if (error || !data) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow p-8 text-center max-w-sm w-full">
        <p className="text-4xl mb-3">🚫</p>
        <p className="font-bold text-navy text-lg mb-1">List Not Found</p>
        <p className="text-gray-500 text-sm">{error ?? 'This link may have expired or been revoked.'}</p>
      </div>
    </div>
  )

  const contacts = data.contacts
  const contact  = contacts[idx]
  const pct      = data.totalCount > 0 ? Math.round((data.workedCount / data.totalCount) * 100) : 0
  const unworked = contacts.filter(c => !c.disposition).length

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-navy text-white px-4 py-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-300 mb-0.5">{data.listName}</p>
          <h1 className="font-bold text-lg leading-tight truncate">{data.name}</h1>
          {data.assignedTo && <p className="text-xs text-blue-300 mt-0.5">Assigned to {data.assignedTo}</p>}
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={() => setShowScript(true)}
            className="text-xs font-bold bg-gold-400 hover:bg-gold-300 text-navy px-3 py-1.5 rounded-lg transition-colors">
            📄 Script
          </button>
          <button onClick={() => setView(v => v === 'work' ? 'list' : 'work')}
            className="text-xs font-bold bg-navy-500 hover:bg-navy-400 border border-navy-300 px-3 py-1.5 rounded-lg transition-colors">
            {view === 'work' ? '☰ All' : '← Work'}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-navy-700 h-1.5">
        <div className="bg-gold-400 h-full transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>

      <div className="px-4 py-2 bg-navy-800 text-white flex items-center justify-between text-xs">
        <span className="font-bold">{data.workedCount} of {data.totalCount} worked</span>
        <span className="text-blue-300">{unworked} remaining · {pct}% done</span>
      </div>

      {view === 'list' ? (
        <div className="p-4 space-y-2 max-w-xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">All Contacts</p>
          {contacts.map((c, i) => (
            <button key={c.id} onClick={() => { setIdx(i); setView('work') }}
              className={`w-full text-left bg-white rounded-xl border px-4 py-3 flex items-center justify-between gap-3 shadow-sm hover:shadow-md transition-shadow ${i === idx ? 'border-navy ring-2 ring-navy ring-opacity-20' : 'border-gray-100'}`}>
              <div className="min-w-0">
                <p className="font-bold text-sm text-navy truncate">{c.firstName} {c.lastName}</p>
                <p className="text-xs text-gray-400 truncate">{c.phone ?? c.email ?? c.address ?? '—'}</p>
              </div>
              {c.disposition ? (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${DISPOSITION_BADGE[c.disposition] ?? 'bg-gray-100 text-gray-600'}`}>
                  {c.disposition}
                </span>
              ) : (
                <span className="text-[10px] text-gray-300 shrink-0">—</span>
              )}
            </button>
          ))}
        </div>
      ) : contacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
          <p className="text-5xl mb-4">✅</p>
          <p className="font-bold text-navy text-xl mb-1">List Complete!</p>
          <p className="text-gray-500 text-sm">All contacts in this list have been worked.</p>
        </div>
      ) : (
        <div className="max-w-xl mx-auto p-4 space-y-4">

          {/* Contact card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display font-black text-navy text-2xl">
                  {contact.firstName} {contact.lastName}
                </h2>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {contact.party && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${PARTY_BADGE[contact.party] ?? 'bg-gray-100 text-gray-600'}`}>
                      {contact.party}
                    </span>
                  )}
                  {contact.supportLevel && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gold-100 text-gold-700">
                      {contact.supportLevel}
                    </span>
                  )}
                  {contact.disposition && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${DISPOSITION_BADGE[contact.disposition] ?? 'bg-gray-100 text-gray-600'}`}>
                      {contact.disposition}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-xs text-gray-300 font-bold shrink-0 mt-1">{idx + 1}/{contacts.length}</span>
            </div>

            <div className="px-5 py-4 space-y-2.5">
              {contact.phone && (
                <a href={`tel:${contact.phone}`}
                  className="flex items-center gap-3 text-navy hover:text-red-500 transition-colors group">
                  <span className="text-lg">📞</span>
                  <span className="font-bold text-base">{contact.phone}</span>
                  <span className="text-xs text-gray-300 group-hover:text-red-300 ml-auto">tap to call</span>
                </a>
              )}
              {contact.email && (
                <a href={`mailto:${contact.email}`}
                  className="flex items-center gap-3 text-navy hover:text-blue-500 transition-colors">
                  <span className="text-lg">✉️</span>
                  <span className="text-sm font-medium truncate">{contact.email}</span>
                </a>
              )}
              {(contact.address || contact.city) && (
                <div className="flex items-start gap-3 text-gray-600">
                  <span className="text-lg mt-0.5">📍</span>
                  <div className="text-sm">
                    {contact.address && <p>{contact.address}</p>}
                    {(contact.city || contact.state || contact.zip) && (
                      <p>{[contact.city, contact.state, contact.zip].filter(Boolean).join(', ')}</p>
                    )}
                  </div>
                </div>
              )}
              {contact.notes && (
                <div className="flex items-start gap-3 text-gray-500">
                  <span className="text-lg mt-0.5">📝</span>
                  <p className="text-sm">{contact.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Disposition buttons */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Mark Result</p>
            <div className="grid grid-cols-2 gap-2">
              {DISPOSITIONS.map(d => (
                <button key={d.key} onClick={() => setDisposition(d.key)} disabled={saving}
                  className={`py-3.5 rounded-xl font-bold text-sm transition-all disabled:opacity-60 active:scale-95 ${d.cls} ${contact.disposition === d.key ? 'ring-2 ring-offset-2 ring-current' : ''}`}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Note (optional)</p>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={2}
              placeholder="Any notes about this contact…"
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 text-navy placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-gold-400 resize-none"
            />
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-2 pb-6">
            <button onClick={() => setIdx(i => Math.max(0, i - 1))} disabled={idx === 0}
              className="flex-1 border border-gray-200 text-gray-500 hover:text-navy hover:border-navy font-bold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-30">
              ← Prev
            </button>
            <button onClick={() => setIdx(i => Math.min(contacts.length - 1, i + 1))} disabled={idx === contacts.length - 1}
              className="flex-1 border border-gray-200 text-gray-500 hover:text-navy hover:border-navy font-bold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-30">
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Script drawer */}
      {showScript && (
        <ScriptPanel
          token={token}
          initialScript={data.callScript}
          onClose={() => setShowScript(false)}
        />
      )}
    </div>
  )
}
