'use client'

import { useState, useEffect, useCallback } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

type Relationship = 'cold' | 'warm' | 'ally' | 'hostile'

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
  const [relFilter,     setRelFilter]     = useState<'all' | Relationship>('all')
  const [search,        setSearch]        = useState('')
  const [deleting,      setDeleting]      = useState<string | null>(null)

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

  const filtered = contacts
    .filter(c => relFilter === 'all' || c.relationship === relFilter)
    .filter(c => !search || `${c.name} ${c.outlet} ${c.beat ?? ''}`.toLowerCase().includes(search.toLowerCase()))

  const allyCnt    = contacts.filter(c => c.relationship === 'ally').length
  const warmCnt    = contacts.filter(c => c.relationship === 'warm').length
  const hostileCnt = contacts.filter(c => c.relationship === 'hostile').length

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Press & Media Contacts</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage reporters, track outreach, and build media relationships</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-[#1e3a5f] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#16304f] transition"
        >
          + Add Contact
        </button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-gray-800">{contacts.length}</p>
          <p className="text-xs text-gray-400 font-medium mt-0.5">Total Contacts</p>
        </div>
        <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-emerald-700">{allyCnt}</p>
          <p className="text-xs text-emerald-600 font-medium mt-0.5">Allies</p>
        </div>
        <div className="bg-amber-50 rounded-2xl border border-amber-100 p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-amber-700">{warmCnt}</p>
          <p className="text-xs text-amber-600 font-medium mt-0.5">Warm</p>
        </div>
        <div className="bg-rose-50 rounded-2xl border border-rose-100 p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-rose-700">{hostileCnt}</p>
          <p className="text-xs text-rose-600 font-medium mt-0.5">Hostile</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {(['all', 'ally', 'warm', 'cold', 'hostile'] as const).map(r => (
          <button
            key={r}
            onClick={() => setRelFilter(r)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              relFilter === r ? 'bg-[#1e3a5f] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
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
          <button onClick={() => setShowAddForm(true)} className="text-[#1e3a5f] font-semibold hover:underline">
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
                    {contact.email && <a href={`mailto:${contact.email}`} className="hover:text-[#1e3a5f] transition truncate max-w-[180px]">{contact.email}</a>}
                    {contact.phone && <span>{contact.phone}</span>}
                    {contact.twitter && <a href={`https://twitter.com/${contact.twitter.replace('@','')}`} target="_blank" rel="noreferrer" className="hover:text-[#1e3a5f]">{contact.twitter}</a>}
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
                    <button
                      onClick={() => { setOutreachModal(contact.id); setOutreachForm(DEFAULT_OUTREACH) }}
                      className="text-xs bg-[#1e3a5f] text-white px-3 py-1.5 rounded-xl hover:bg-[#16304f] transition font-semibold whitespace-nowrap"
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

      {/* Add Contact Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Add Media Contact</h2>
              <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
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
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Outlet *</label>
                  <input
                    type="text"
                    placeholder="Publication or station"
                    value={form.outlet}
                    onChange={e => setForm(f => ({ ...f, outlet: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
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

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowAddForm(false)}
                className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={saveContact}
                disabled={saving || !form.name || !form.outlet}
                className="flex-1 bg-[#1e3a5f] text-white py-2 rounded-xl text-sm font-semibold hover:bg-[#16304f] transition disabled:opacity-50"
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Log Outreach</h2>
              <button onClick={() => setOutreachModal(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>

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
                className="flex-1 bg-[#1e3a5f] text-white py-2 rounded-xl text-sm font-semibold hover:bg-[#16304f] transition disabled:opacity-50"
              >
                {loggingOutreach ? 'Saving…' : 'Log Entry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
