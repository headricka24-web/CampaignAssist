'use client'

import { useState, useEffect, useCallback } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

type Relationship = 'cold' | 'warm' | 'ally' | 'hostile'

type ImportContact = {
  name:         string
  outlet:       string
  role:         string | null
  beat:         string | null
  email:        string | null
  phone:        string | null
  twitter:      string | null
  notes:        string | null
  relationship: Relationship
  selected:     boolean
}

type OutreachEntry = {
  id:      string
  type:    string
  subject: string | null
  notes:   string | null
  status:  string
  sentAt:  string
}

type MediaContact = {
  id:              string
  name:            string
  outlet:          string
  role:            string | null
  beat:            string | null
  email:           string | null
  phone:           string | null
  twitter:         string | null
  notes:           string | null
  relationship:    Relationship
  lastContactedAt: string | null
  outreach:        OutreachEntry[]
}

type ContactForm = {
  name:         string
  outlet:       string
  role:         string
  beat:         string
  email:        string
  phone:        string
  twitter:      string
  notes:        string
  relationship: Relationship
}

type OutreachForm = {
  type:    string
  subject: string
  notes:   string
  status:  string
}

type LookupResult = {
  found:         boolean
  contacts?:     { name: string; role: string; beat: string; email: string | null; phone: string | null; twitter: string | null; notes: string | null }[]
  newsroomEmail?: string | null
  newsroomPhone?: string | null
  confidence?:   'high' | 'medium' | 'low'
  disclaimer?:   string
}

// ── Constants ─────────────────────────────────────────────────────────────────

const ROLES         = ['Reporter', 'Editor', 'Producer', 'Anchor', 'Columnist', 'Blogger', 'Other']
const BEATS         = ['Politics', 'Local Government', 'Business', 'Education', 'Crime', 'Health', 'Agriculture', 'Veterans', 'Environment', 'General']
const OUTREACH_TYPES = ['pitch', 'press-release', 'follow-up', 'interview', 'quote-request', 'other']
const OUTREACH_STATUSES = ['sent', 'responded', 'published', 'ignored', 'declined']

const REL_CONFIG: Record<Relationship, { label: string; bg: string; dot: string }> = {
  cold:    { label: 'Cold',    bg: 'bg-gray-100 text-gray-600',    dot: 'bg-gray-400'    },
  warm:    { label: 'Warm',    bg: 'bg-amber-100 text-amber-700',  dot: 'bg-amber-400'   },
  ally:    { label: 'Ally',    bg: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  hostile: { label: 'Hostile', bg: 'bg-rose-100 text-rose-700',    dot: 'bg-rose-500'    },
}

const STATUS_CONFIG: Record<string, string> = {
  sent:       'bg-blue-100 text-blue-700',
  responded:  'bg-amber-100 text-amber-700',
  published:  'bg-emerald-100 text-emerald-700',
  ignored:    'bg-gray-100 text-gray-500',
  declined:   'bg-rose-100 text-rose-700',
}

const DEFAULT_CONTACT: ContactForm = {
  name: '', outlet: '', role: '', beat: '', email: '',
  phone: '', twitter: '', notes: '', relationship: 'cold',
}

const DEFAULT_OUTREACH: OutreachForm = {
  type: 'pitch', subject: '', notes: '', status: 'sent',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null) {
  if (!iso) return 'Never'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PressContacts() {
  const [contacts,      setContacts]      = useState<MediaContact[]>([])
  const [loading,       setLoading]       = useState(true)
  const [showAddForm,   setShowAddForm]   = useState(false)
  const [saving,        setSaving]        = useState(false)
  const [form,          setForm]          = useState<ContactForm>(DEFAULT_CONTACT)
  const [expanded,      setExpanded]      = useState<string | null>(null)
  const [outreachModal, setOutreachModal] = useState<string | null>(null) // contactId
  const [outreachForm,  setOutreachForm]  = useState<OutreachForm>(DEFAULT_OUTREACH)
  const [loggingOutreach, setLoggingOutreach] = useState(false)
  const [relFilter,      setRelFilter]      = useState<'all' | Relationship>('all')
  const [search,         setSearch]         = useState('')
  const [deleting,       setDeleting]       = useState<string | null>(null)
  // lookup state
  const [searching,      setSearching]      = useState(false)
  const [lookupResult,   setLookupResult]   = useState<LookupResult | null>(null)
  const [lookupError,    setLookupError]    = useState('')
  const [lookupOutlet,   setLookupOutlet]   = useState<string | null>(null) // which contact row triggered lookup
  // import state
  const [showImport,     setShowImport]     = useState(false)
  const [importing,      setImporting]      = useState(false)
  const [importContacts, setImportContacts] = useState<ImportContact[]>([])
  const [importError,    setImportError]    = useState('')
  const [savingImport,   setSavingImport]   = useState(false)
  // pitch state
  const [pitchContactId, setPitchContactId] = useState<string | null>(null)
  const [pitchContent,   setPitchContent]   = useState('')
  const [pitchMeta,      setPitchMeta]      = useState<{ name: string; outlet: string; email: string | null } | null>(null)
  const [generatingPitch, setGeneratingPitch] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/press-contacts')
    if (res.ok) {
      const d = await res.json()
      setContacts(d.contacts ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function saveContact() {
    if (!form.name || !form.outlet) return
    setSaving(true)
    await fetch('/api/press-contacts', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(form),
    })
    setForm(DEFAULT_CONTACT)
    setShowAddForm(false)
    await load()
    setSaving(false)
  }

  async function updateRelationship(id: string, relationship: Relationship) {
    await fetch('/api/press-contacts', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action: 'update-relationship', id, relationship }),
    })
    setContacts(cs => cs.map(c => c.id === id ? { ...c, relationship } : c))
  }

  async function logOutreach() {
    if (!outreachModal) return
    setLoggingOutreach(true)
    await fetch('/api/press-contacts', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action: 'log-outreach', mediaContactId: outreachModal, ...outreachForm }),
    })
    setOutreachForm(DEFAULT_OUTREACH)
    setOutreachModal(null)
    await load()
    setLoggingOutreach(false)
  }

  async function updateOutreachStatus(id: string, status: string) {
    await fetch('/api/press-contacts', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action: 'update-outreach', id, status }),
    })
    await load()
  }

  async function remove(id: string) {
    setDeleting(id)
    await fetch('/api/press-contacts', {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id }),
    })
    await load()
    setDeleting(null)
  }

  async function searchContact(outlet: string, prefillForm = false) {
    if (!outlet.trim()) return
    setSearching(true)
    setLookupError('')
    setLookupResult(null)
    setLookupOutlet(outlet)
    try {
      const res  = await fetch('/api/press-contacts/lookup', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ outlet }),
      })
      const data: LookupResult = await res.json()
      if (!data.found || !data.contacts?.length) {
        setLookupError(`No contact info found for "${outlet}". Try adding manually.`)
      } else {
        setLookupResult(data)
        if (prefillForm && data.contacts[0]) {
          const c = data.contacts[0]
          setForm(f => ({
            ...f,
            name:    f.name    || c.name   || '',
            role:    f.role    || c.role   || '',
            beat:    f.beat    || c.beat   || '',
            email:   f.email   || c.email  || '',
            phone:   f.phone   || c.phone  || '',
            twitter: f.twitter || c.twitter || '',
            notes:   f.notes   || c.notes  || '',
          }))
        }
      }
    } catch {
      setLookupError('Search failed. Try again.')
    } finally {
      setSearching(false)
    }
  }

  function applyLookupContact(c: NonNullable<LookupResult['contacts']>[0]) {
    setForm(f => ({
      ...f,
      name:    c.name    || f.name,
      role:    c.role    || f.role,
      beat:    c.beat    || f.beat,
      email:   c.email   || f.email,
      phone:   c.phone   || f.phone,
      twitter: c.twitter || f.twitter,
      notes:   c.notes   || f.notes,
    }))
    setLookupResult(null)
    setLookupOutlet(null)
  }

  async function generatePitch(contactId: string) {
    setGeneratingPitch(true)
    setPitchContactId(contactId)
    setPitchContent('')
    setPitchMeta(null)
    try {
      const res  = await fetch('/api/press-contacts/pitch', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ contactId }),
      })
      const data = await res.json()
      if (data.pitch) {
        setPitchContent(data.pitch)
        setPitchMeta(data.contact)
      }
    } catch { /* silently fail — button resets */ }
    finally { setGeneratingPitch(false) }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setImportError('')
    setImportContacts([])
    const fd = new FormData()
    fd.append('file', file)
    const res  = await fetch('/api/press-contacts/import', { method: 'POST', body: fd })
    const data = await res.json()
    setImporting(false)
    if (!res.ok) { setImportError(data.error ?? 'Failed to parse file'); return }
    const rows: ImportContact[] = (data.contacts as ImportContact[]).map(r => ({ ...r, selected: true }))
    if (rows.length === 0) { setImportError('No contacts found in this file.'); return }
    setImportContacts(rows)
    e.target.value = ''
  }

  async function confirmImport() {
    const selected = importContacts.filter(r => r.selected)
    if (selected.length === 0) return
    setSavingImport(true)
    await Promise.all(selected.map(r => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { selected: _, ...contact } = r
      return fetch('/api/press-contacts', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(contact),
      })
    }))
    setImportContacts([])
    setShowImport(false)
    setSavingImport(false)
    await load()
  }

  const filtered = contacts
    .filter(c => relFilter === 'all' || c.relationship === relFilter)
    .filter(c => !search || `${c.name} ${c.outlet} ${c.beat ?? ''}`.toLowerCase().includes(search.toLowerCase()))

  const allyCnt    = contacts.filter(c => c.relationship === 'ally').length
  const warmCnt    = contacts.filter(c => c.relationship === 'warm').length
  const hostileCnt = contacts.filter(c => c.relationship === 'hostile').length

  return (
    <div className="min-h-full space-y-6">
      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden bg-hero-gradient shadow-patriot">
        <div className="absolute inset-0 bg-stripe-pattern opacity-40" />
        <div className="absolute inset-0 flex items-center justify-end pr-12 pointer-events-none select-none">
          <span className="text-white opacity-[0.03] text-[200px] font-black leading-none">📡</span>
        </div>
        <div className="relative px-8 py-10">
          <div className="inline-flex items-center gap-2 bg-navy/60 text-gold-300 text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full mb-4 border border-gold-400/30">
            Communications
          </div>
          <h1 className="font-display text-5xl font-black text-white leading-tight mb-2">
            Press & Media <span className="text-gold-400">Contacts.</span>
          </h1>
          <p className="text-blue-200 text-lg max-w-xl mb-6">
            Manage reporters, track outreach, and build media relationships that move your story forward.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => { setForm(DEFAULT_CONTACT); setLookupResult(null); setLookupError(''); setShowAddForm(true) }}
              className="bg-red-500 hover:bg-red-600 text-white font-black px-6 py-3 rounded-xl text-sm tracking-widest uppercase shadow-glow-red transition-colors"
            >
              + Add Contact
            </button>
            <button
              onClick={() => setShowImport(true)}
              className="bg-white/10 hover:bg-white/20 text-white font-black px-6 py-3 rounded-xl text-sm tracking-widest uppercase border border-white/20 transition-colors"
            >
              ↑ Import File
            </button>
          </div>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border-2 border-gray-100 p-4 shadow-sm text-center">
          <p className="text-2xl font-black text-navy">{contacts.length}</p>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-0.5">Total Contacts</p>
        </div>
        <div className="bg-emerald-50 rounded-2xl border-2 border-emerald-100 p-4 shadow-sm text-center">
          <p className="text-2xl font-black text-emerald-700">{allyCnt}</p>
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mt-0.5">Allies</p>
        </div>
        <div className="bg-amber-50 rounded-2xl border-2 border-amber-100 p-4 shadow-sm text-center">
          <p className="text-2xl font-black text-amber-700">{warmCnt}</p>
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mt-0.5">Warm</p>
        </div>
        <div className="bg-rose-50 rounded-2xl border-2 border-rose-100 p-4 shadow-sm text-center">
          <p className="text-2xl font-black text-rose-700">{hostileCnt}</p>
          <p className="text-[10px] font-black uppercase tracking-widest text-rose-600 mt-0.5">Hostile</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {(['all', 'ally', 'warm', 'cold', 'hostile'] as const).map(r => (
          <button
            key={r}
            onClick={() => setRelFilter(r)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              relFilter === r ? 'bg-navy text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {r === 'all' ? 'All' : REL_CONFIG[r].label}
          </button>
        ))}
        <input
          type="text"
          placeholder="Search name, outlet, beat…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="ml-auto text-xs border border-gray-200 rounded-xl px-3 py-1.5 bg-white w-52"
        />
      </div>

      {/* Contact list */}
      {loading ? (
        <div className="p-10 text-center text-gray-400 text-sm">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="p-10 text-center text-gray-400 text-sm bg-white rounded-2xl border border-gray-100">
          No contacts yet.{' '}
          <button onClick={() => setShowAddForm(true)} className="text-navy font-semibold hover:underline">
            Add your first media contact.
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(contact => {
            const rel = REL_CONFIG[contact.relationship]
            const isOpen = expanded === contact.id

            return (
              <div key={contact.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Contact row */}
                <div className="flex items-center gap-4 px-5 py-4">
                  {/* Dot + name */}
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${rel.dot}`} />
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{contact.name}</p>
                      <p className="text-xs text-gray-500 truncate">{contact.outlet}{contact.role ? ` · ${contact.role}` : ''}{contact.beat ? ` · ${contact.beat}` : ''}</p>
                    </div>
                  </div>

                  {/* Contact info */}
                  <div className="hidden md:flex items-center gap-4 text-xs text-gray-400">
                    {contact.email && <a href={`mailto:${contact.email}`} className="hover:text-navy transition truncate max-w-[180px]">{contact.email}</a>}
                    {contact.phone && <span>{contact.phone}</span>}
                    {contact.twitter && <a href={`https://twitter.com/${contact.twitter.replace('@','')}`} target="_blank" rel="noreferrer" className="hover:text-navy">{contact.twitter}</a>}
                  </div>

                  {/* Relationship selector */}
                  <select
                    value={contact.relationship}
                    onChange={e => updateRelationship(contact.id, e.target.value as Relationship)}
                    className={`text-xs font-semibold px-2 py-1 rounded-xl border-0 cursor-pointer ${rel.bg}`}
                  >
                    {(['cold', 'warm', 'ally', 'hostile'] as Relationship[]).map(r => (
                      <option key={r} value={r}>{REL_CONFIG[r].label}</option>
                    ))}
                  </select>

                  {/* Last contacted */}
                  <span className="hidden lg:block text-xs text-gray-400 whitespace-nowrap">
                    {contact.lastContactedAt ? `Last: ${fmtDate(contact.lastContactedAt)}` : 'Not yet contacted'}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {!contact.email && (
                      <button
                        onClick={() => { setShowAddForm(true); setForm({ ...DEFAULT_CONTACT, outlet: contact.outlet }); setTimeout(() => searchContact(contact.outlet, true), 100) }}
                        disabled={searching && lookupOutlet === contact.outlet}
                        className="text-xs border border-navy text-navy px-3 py-1.5 rounded-xl hover:bg-navy hover:text-white transition font-semibold whitespace-nowrap disabled:opacity-50"
                      >
                        {searching && lookupOutlet === contact.outlet ? '…' : '🔍 Find Info'}
                      </button>
                    )}
                    <button
                      onClick={() => generatePitch(contact.id)}
                      disabled={generatingPitch && pitchContactId === contact.id}
                      className="text-xs border border-purple-300 text-purple-700 px-3 py-1.5 rounded-xl hover:bg-purple-600 hover:text-white hover:border-purple-600 transition font-semibold whitespace-nowrap disabled:opacity-50"
                    >
                      {generatingPitch && pitchContactId === contact.id
                        ? <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 border border-current border-t-transparent rounded-full animate-spin inline-block" /> Writing…</span>
                        : '✉ Pitch'}
                    </button>
                    <button
                      onClick={() => { setOutreachModal(contact.id); setOutreachForm(DEFAULT_OUTREACH) }}
                      className="text-xs bg-navy text-white px-3 py-1.5 rounded-xl hover:bg-navy-700 transition font-semibold whitespace-nowrap"
                    >
                      + Log
                    </button>
                    <button
                      onClick={() => setExpanded(isOpen ? null : contact.id)}
                      className="text-xs text-gray-400 hover:text-gray-600 transition px-2"
                    >
                      {isOpen ? '▲' : '▼'}
                    </button>
                    <button
                      onClick={() => remove(contact.id)}
                      disabled={deleting === contact.id}
                      className="text-gray-300 hover:text-rose-500 transition text-xs"
                    >
                      {deleting === contact.id ? '…' : '✕'}
                    </button>
                  </div>
                </div>

                {/* Expanded: outreach log + notes */}
                {isOpen && (
                  <div className="border-t border-gray-50 px-5 py-4 bg-gray-50/50">
                    {contact.notes && (
                      <p className="text-xs text-gray-500 mb-3 italic">"{contact.notes}"</p>
                    )}

                    {contact.outreach.length === 0 ? (
                      <p className="text-xs text-gray-400">No outreach logged yet.</p>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Outreach Log</p>
                        {contact.outreach.map(entry => (
                          <div key={entry.id} className="flex items-start gap-3 text-xs">
                            <span className="text-gray-400 whitespace-nowrap mt-0.5">{fmtDate(entry.sentAt)}</span>
                            <span className="text-gray-600 font-medium capitalize">{entry.type.replace('-', ' ')}</span>
                            {entry.subject && <span className="text-gray-500 flex-1 truncate">— {entry.subject}</span>}
                            <select
                              value={entry.status}
                              onChange={e => updateOutreachStatus(entry.id, e.target.value)}
                              className={`text-xs font-medium px-2 py-0.5 rounded-full border-0 cursor-pointer ml-auto ${STATUS_CONFIG[entry.status] ?? 'bg-gray-100 text-gray-500'}`}
                            >
                              {OUTREACH_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Import Modal ─────────────────────────────────────────────── */}
      {showImport && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-gold-400 to-amber-500" />
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <div>
                <h2 className="font-display font-black text-sm uppercase tracking-wide text-navy">Import Media Contacts</h2>
                <p className="text-xs text-gray-400 mt-0.5">Accepts CSV, Excel (.xlsx), or PDF contact lists</p>
              </div>
              <button onClick={() => { setShowImport(false); setImportContacts([]); setImportError('') }} className="text-gray-400 hover:text-navy text-xl leading-none">✕</button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
              {importContacts.length === 0 && (
                <label className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl p-10 cursor-pointer transition ${importing ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:border-navy hover:bg-gray-50'}`}>
                  {importing ? (
                    <>
                      <div className="w-8 h-8 border-2 border-navy border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm font-semibold text-gray-500">Analyzing file with AI…</p>
                      <p className="text-xs text-gray-400">Extracting contact details from your document</p>
                    </>
                  ) : (
                    <>
                      <span className="text-4xl">📋</span>
                      <p className="text-sm font-semibold text-gray-700">Click to upload or drag a file here</p>
                      <p className="text-xs text-gray-400">CSV · Excel spreadsheet · PDF contact list · Press rolodex export</p>
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
                  <button onClick={() => setImportError('')} className="ml-3 text-xs underline">Try again</button>
                </div>
              )}

              {importContacts.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-gray-700">
                      Found <span className="text-navy font-black">{importContacts.length}</span> contacts —
                      <span className="text-gray-500"> review and deselect any to skip</span>
                    </p>
                    <div className="flex gap-2 text-xs">
                      <button onClick={() => setImportContacts(c => c.map(x => ({ ...x, selected: true })))} className="text-navy font-semibold hover:underline">Select all</button>
                      <span className="text-gray-300">|</span>
                      <button onClick={() => setImportContacts(c => c.map(x => ({ ...x, selected: false })))} className="text-gray-400 hover:underline">Deselect all</button>
                    </div>
                  </div>
                  <div className="border border-gray-100 rounded-xl overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 uppercase tracking-wide">
                          <th className="px-3 py-2 text-left w-8">✓</th>
                          <th className="px-3 py-2 text-left">Name</th>
                          <th className="px-3 py-2 text-left">Outlet</th>
                          <th className="px-3 py-2 text-left">Role / Beat</th>
                          <th className="px-3 py-2 text-left">Email</th>
                          <th className="px-3 py-2 text-left">Relationship</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importContacts.map((c, i) => (
                          <tr
                            key={i}
                            onClick={() => setImportContacts(r => r.map((x, j) => j === i ? { ...x, selected: !x.selected } : x))}
                            className={`border-b border-gray-50 cursor-pointer transition ${c.selected ? 'hover:bg-gray-50' : 'opacity-40 bg-gray-50/50'}`}
                          >
                            <td className="px-3 py-2">
                              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${c.selected ? 'bg-navy border-navy' : 'border-gray-300'}`}>
                                {c.selected && <span className="text-white text-[10px] leading-none">✓</span>}
                              </div>
                            </td>
                            <td className="px-3 py-2 font-semibold text-gray-800">{c.name}</td>
                            <td className="px-3 py-2 text-gray-600">{c.outlet}</td>
                            <td className="px-3 py-2 text-gray-500">{[c.role, c.beat].filter(Boolean).join(' · ') || '—'}</td>
                            <td className="px-3 py-2 text-gray-500 max-w-[140px] truncate">{c.email ?? '—'}</td>
                            <td className="px-3 py-2">
                              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${REL_CONFIG[c.relationship]?.bg ?? 'bg-gray-100 text-gray-500'}`}>
                                {REL_CONFIG[c.relationship]?.label ?? c.relationship}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {importContacts.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between shrink-0">
                <p className="text-xs text-gray-400">
                  {importContacts.filter(r => r.selected).length} of {importContacts.length} selected
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => { setImportContacts([]); setImportError('') }}
                    className="border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 transition"
                  >
                    ← Re-upload
                  </button>
                  <button
                    onClick={confirmImport}
                    disabled={savingImport || importContacts.filter(r => r.selected).length === 0}
                    className="bg-navy text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-navy-700 transition disabled:opacity-50"
                  >
                    {savingImport ? 'Saving…' : `Import ${importContacts.filter(r => r.selected).length} contacts`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Contact Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-gold-400 to-amber-500" />
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <h2 className="font-display font-black text-sm uppercase tracking-wide text-navy">Add Media Contact</h2>
              <button onClick={() => { setShowAddForm(false); setLookupResult(null); setLookupError('') }} className="text-gray-400 hover:text-navy text-xl leading-none">✕</button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-3">
              {/* Outlet + Search */}
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Outlet *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Publication or station"
                    value={form.outlet}
                    onChange={e => { setForm(f => ({ ...f, outlet: e.target.value })); setLookupResult(null); setLookupError('') }}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    disabled={form.outlet.trim().length < 3 || searching}
                    onClick={() => searchContact(form.outlet)}
                    className="shrink-0 flex items-center gap-1.5 border border-navy text-navy px-3 py-2 rounded-xl text-xs font-bold hover:bg-navy hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {searching ? <><span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin inline-block" /> Searching…</> : '🔍 Search'}
                  </button>
                </div>
              </div>

              {/* Lookup error */}
              {lookupError && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-700">{lookupError}</div>
              )}

              {/* Lookup results */}
              {lookupResult?.found && lookupResult.contacts && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black uppercase tracking-wide text-blue-700">
                      AI-suggested contacts
                      {lookupResult.confidence && (
                        <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                          lookupResult.confidence === 'high'   ? 'bg-emerald-100 text-emerald-700' :
                          lookupResult.confidence === 'medium' ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-500'
                        }`}>{lookupResult.confidence} confidence</span>
                      )}
                    </p>
                  </div>
                  {lookupResult.contacts.map((c, i) => (
                    <div key={i} className="bg-white rounded-xl border border-blue-100 px-3 py-2.5 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-800">{c.name}</p>
                        <p className="text-xs text-gray-500">{[c.role, c.beat].filter(Boolean).join(' · ')}</p>
                        {c.email && <p className="text-xs text-blue-600 mt-0.5">{c.email}</p>}
                        {c.notes && <p className="text-xs text-gray-400 mt-0.5 italic">{c.notes}</p>}
                      </div>
                      <button
                        onClick={() => applyLookupContact(c)}
                        className="shrink-0 text-xs bg-navy text-white px-3 py-1.5 rounded-lg font-bold hover:bg-navy-700 transition"
                      >
                        Use →
                      </button>
                    </div>
                  ))}
                  {lookupResult.newsroomEmail && (
                    <div className="flex items-center gap-2 text-xs text-blue-600 px-1">
                      <span className="text-gray-400">Newsroom:</span>
                      <span>{lookupResult.newsroomEmail}</span>
                      {lookupResult.newsroomPhone && <span className="text-gray-400">· {lookupResult.newsroomPhone}</span>}
                    </div>
                  )}
                  {lookupResult.disclaimer && (
                    <p className="text-[10px] text-blue-400 px-1">⚠ {lookupResult.disclaimer}</p>
                  )}
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Name *</label>
                <input
                  type="text"
                  placeholder="Full name"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Role</label>
                  <select
                    value={form.role}
                    onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                  >
                    <option value="">— Select —</option>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Beat</label>
                  <select
                    value={form.beat}
                    onChange={e => setForm(f => ({ ...f, beat: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                  >
                    <option value="">— Select —</option>
                    {BEATS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Email</label>
                  <input
                    type="email"
                    placeholder="reporter@outlet.com"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Phone</label>
                  <input
                    type="tel"
                    placeholder="555-000-0000"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Twitter / X</label>
                  <input
                    type="text"
                    placeholder="@handle"
                    value={form.twitter}
                    onChange={e => setForm(f => ({ ...f, twitter: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Relationship</label>
                  <select
                    value={form.relationship}
                    onChange={e => setForm(f => ({ ...f, relationship: e.target.value as Relationship }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                  >
                    {(['cold', 'warm', 'ally', 'hostile'] as Relationship[]).map(r => (
                      <option key={r} value={r}>{REL_CONFIG[r].label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Notes</label>
                <textarea
                  rows={2}
                  placeholder="Coverage tendencies, topics of interest, how you know them…"
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
              <button
                onClick={() => setShowAddForm(false)}
                className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={saveContact}
                disabled={saving || !form.name || !form.outlet}
                className="flex-1 bg-navy text-white py-2 rounded-xl text-sm font-semibold hover:bg-navy-700 transition disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save Contact'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log Outreach Modal */}
      {outreachModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-gold-400 to-amber-500" />
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-display font-black text-sm uppercase tracking-wide text-navy">Log Outreach</h2>
              <button onClick={() => setOutreachModal(null)} className="text-gray-400 hover:text-navy text-xl leading-none">✕</button>
            </div>
            <div className="p-6">

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Type</label>
                  <select
                    value={outreachForm.type}
                    onChange={e => setOutreachForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                  >
                    {OUTREACH_TYPES.map(t => <option key={t} value={t}>{t.replace('-', ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Status</label>
                  <select
                    value={outreachForm.status}
                    onChange={e => setOutreachForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                  >
                    {OUTREACH_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Subject / Headline</label>
                <input
                  type="text"
                  placeholder="What was the pitch or ask about?"
                  value={outreachForm.subject}
                  onChange={e => setOutreachForm(f => ({ ...f, subject: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Notes</label>
                <textarea
                  rows={3}
                  placeholder="Any details, follow-up needed, what was discussed…"
                  value={outreachForm.notes}
                  onChange={e => setOutreachForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setOutreachModal(null)}
                className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={logOutreach}
                disabled={loggingOutreach}
                className="flex-1 bg-navy text-white py-2 rounded-xl text-sm font-semibold hover:bg-navy-700 transition disabled:opacity-50"
              >
                {loggingOutreach ? 'Saving…' : 'Log Entry'}
              </button>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Pitch Email Modal ────────────────────────────────────────────── */}
      {pitchContent && pitchMeta && (
        <div className="fixed inset-0 bg-navy/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setPitchContent(''); setPitchMeta(null) }}>
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="h-1.5 bg-gradient-to-r from-purple-500 to-purple-700" />
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-purple-600 mb-0.5">AI-Generated Pitch Email</p>
                <h2 className="font-display font-black text-navy text-sm uppercase tracking-wide">
                  {pitchMeta.name} · {pitchMeta.outlet}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {pitchMeta.email && (
                  <a
                    href={`mailto:${pitchMeta.email}?body=${encodeURIComponent(pitchContent)}`}
                    className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded-xl font-bold hover:bg-purple-700 transition"
                  >
                    ✉ Open in Mail
                  </a>
                )}
                <button
                  onClick={() => { navigator.clipboard.writeText(pitchContent) }}
                  className="text-xs bg-navy text-white px-3 py-1.5 rounded-xl font-bold hover:bg-navy-700 transition"
                >
                  Copy
                </button>
                <button onClick={() => { setPitchContent(''); setPitchMeta(null) }} className="text-xl text-gray-300 hover:text-navy leading-none ml-1">✕</button>
              </div>
            </div>
            <div className="overflow-y-auto p-6">
              <pre className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-sans">{pitchContent}</pre>
            </div>
            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50">
              <p className="text-[10px] text-gray-400">⚠ AI-generated — review before sending. Verify reporter details and customize as needed.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
