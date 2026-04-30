'use client'

import { useState, useEffect, useCallback } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

type Voter = {
  id:             string
  firstName:      string
  lastName:       string
  address:        string | null
  city:           string | null
  zip:            string | null
  phone:          string | null
  email:          string | null
  party:          string | null
  supportLevel:   string | null
  turnoutScore:   number | null
  precinct:       string | null
  tags:           string[]
  notes:          string | null
  contactStatus:  string
  lastContactedAt: string | null
  createdAt:      string
}

type SegmentCounts = Record<string, number>

type APIResponse = {
  voters:        Voter[]
  total:         number
  page:          number
  limit:         number
  segmentCounts: SegmentCounts
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CONTACT_STATUSES = ['Not Contacted', 'Reached', 'Left Message', 'Wrong Number', 'Do Not Contact', 'Needs Follow-Up']

const PARTY_STYLE: Record<string, string> = {
  Republican:  'bg-red-100 text-red-700',
  Democrat:    'bg-blue-100 text-blue-700',
  Independent: 'bg-purple-100 text-purple-700',
}

const STATUS_STYLE: Record<string, string> = {
  'Not Contacted': 'bg-gray-100 text-gray-500',
  'Reached':       'bg-green-100 text-green-700',
  'Left Message':  'bg-yellow-100 text-yellow-700',
  'Wrong Number':  'bg-orange-100 text-orange-700',
  'Do Not Contact':'bg-red-100 text-red-600',
  'Needs Follow-Up': 'bg-blue-100 text-blue-700',
}

const PRESET_SEGMENTS = [
  { key: 'All Voters',          icon: '👤' },
  { key: 'Not Contacted',       icon: '⭕' },
  { key: 'Needs Follow-Up',     icon: '📬' },
  { key: 'GOTV Target',         icon: '🗳️' },
  { key: 'Strong Republican',   icon: '🔴' },
  { key: 'Lean Support',        icon: '🟠' },
  { key: 'Persuadable',         icon: '🟡' },
  { key: 'Door Knock Priority', icon: '🚪' },
  { key: 'economy',             icon: '💰' },
  { key: 'schools',             icon: '🏫' },
  { key: 'public safety',       icon: '🚔' },
  { key: 'taxes',               icon: '📋' },
  { key: 'immigration',         icon: '🌎' },
  { key: 'energy',              icon: '⚡' },
]

// ── Profile Drawer ────────────────────────────────────────────────────────────

function VoterProfileDrawer({
  voter, onClose, onUpdate,
}: {
  voter:    Voter
  onClose:  () => void
  onUpdate: (updated: Voter) => void
}) {
  const [status,   setStatus]   = useState(voter.contactStatus)
  const [notes,    setNotes]    = useState(voter.notes ?? '')
  const [tags,     setTags]     = useState<string[]>(voter.tags)
  const [tagInput, setTagInput] = useState('')
  const [saving,   setSaving]   = useState(false)
  const [dirty,    setDirty]    = useState(false)

  async function save() {
    setSaving(true)
    const res  = await fetch(`/api/voters/${voter.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contactStatus: status, notes, tags }),
    })
    const updated = await res.json()
    setSaving(false)
    setDirty(false)
    onUpdate(updated)
  }

  function addTag(t: string) {
    const trimmed = t.trim().toLowerCase()
    if (trimmed && !tags.includes(trimmed)) { setTags([...tags, trimmed]); setDirty(true) }
    setTagInput('')
  }

  function removeTag(t: string) { setTags(tags.filter(x => x !== t)); setDirty(true) }

  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="flex-1 bg-navy/40 backdrop-blur-sm" />
      <div className="w-full max-w-sm bg-white shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="h-1.5 bg-gradient-to-r from-red-500 to-gold-400" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-display font-black text-navy text-base">{voter.firstName} {voter.lastName}</h2>
            <p className="text-[11px] text-gray-400">{voter.precinct ? `Precinct ${voter.precinct}` : ''}{voter.city ? ` · ${voter.city}` : ''}</p>
          </div>
          <button onClick={onClose} className="text-xl text-gray-300 hover:text-navy transition-colors">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Party + Support + Turnout */}
          <div className="flex flex-wrap gap-2">
            {voter.party && (
              <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${PARTY_STYLE[voter.party] ?? 'bg-gray-100 text-gray-500'}`}>
                {voter.party}
              </span>
            )}
            {voter.supportLevel && voter.supportLevel !== 'Unknown' && (
              <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-navy/10 text-navy">
                {voter.supportLevel}
              </span>
            )}
            {voter.turnoutScore !== null && (
              <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                Turnout {Math.round(voter.turnoutScore)}
              </span>
            )}
          </div>

          {/* Contact info */}
          <div className="space-y-1.5">
            {voter.address && <p className="text-sm text-gray-600">📍 {voter.address}{voter.city ? `, ${voter.city}` : ''}{voter.zip ? ` ${voter.zip}` : ''}</p>}
            {voter.phone   && <p className="text-sm text-gray-600">📞 <a href={`tel:${voter.phone}`} className="text-navy hover:underline">{voter.phone}</a></p>}
            {voter.email   && <p className="text-sm text-gray-600">📧 <a href={`mailto:${voter.email}`} className="text-navy hover:underline">{voter.email}</a></p>}
          </div>

          {/* Contact status */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">Contact Status</label>
            <select
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 text-navy bg-white focus:outline-none focus:ring-2 focus:ring-gold-400"
              value={status}
              onChange={e => { setStatus(e.target.value); setDirty(true) }}
            >
              {CONTACT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">Tags</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map(t => (
                <span key={t} className="flex items-center gap-1 text-[10px] font-bold bg-navy/10 text-navy px-2 py-1 rounded-full">
                  {t}
                  <button onClick={() => removeTag(t)} className="text-gray-400 hover:text-red-500 transition-colors leading-none">✕</button>
                </span>
              ))}
              {tags.length === 0 && <span className="text-xs text-gray-300">No tags</span>}
            </div>
            <div className="flex gap-2">
              <input
                className="flex-1 text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-navy focus:outline-none focus:ring-1 focus:ring-gold-400"
                placeholder="Add tag…"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addTag(tagInput) }}
              />
              <button onClick={() => addTag(tagInput)}
                className="text-xs font-black px-3 py-1.5 rounded-lg bg-navy/10 hover:bg-navy hover:text-white text-navy transition-all">+</button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">Notes</label>
            <textarea
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 text-navy resize-none focus:outline-none focus:ring-2 focus:ring-gold-400"
              rows={3}
              value={notes}
              onChange={e => { setNotes(e.target.value); setDirty(true) }}
              placeholder="Add notes about this voter…"
            />
          </div>

          {voter.lastContactedAt && (
            <p className="text-[11px] text-gray-400">Last contacted: {new Date(voter.lastContactedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
          )}
        </div>

        {/* Save button */}
        <div className="px-5 py-4 border-t border-gray-100">
          <button onClick={save} disabled={saving || !dirty}
            className="w-full bg-navy hover:bg-navy-700 disabled:opacity-40 text-white font-black uppercase tracking-widest py-3 rounded-xl text-sm transition-all">
            {saving ? 'Saving…' : dirty ? 'Save Changes' : 'No Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Table ────────────────────────────────────────────────────────────────

export default function VoterSegmentsTable({ onUploadMore }: { onUploadMore: () => void }) {
  const [data,           setData]           = useState<APIResponse | null>(null)
  const [loading,        setLoading]        = useState(true)
  const [segment,        setSegment]        = useState('All Voters')
  const [search,         setSearch]         = useState('')
  const [page,           setPage]           = useState(1)
  const [selectedVoter,  setSelectedVoter]  = useState<Voter | null>(null)
  const [searchInput,    setSearchInput]    = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '50' })
    if (segment !== 'All Voters') params.set('segment', segment)
    if (search) params.set('search', search)
    const res  = await fetch(`/api/voters?${params}`)
    const json = await res.json()
    setData(json)
    setLoading(false)
  }, [segment, search, page])

  useEffect(() => { load() }, [load])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  function handleSegment(seg: string) {
    setSegment(seg)
    setPage(1)
    setSearch('')
    setSearchInput('')
  }

  function updateVoter(updated: Voter) {
    setData(d => d ? { ...d, voters: d.voters.map(v => v.id === updated.id ? updated : v) } : d)
    setSelectedVoter(updated)
  }

  const counts = data?.segmentCounts ?? {}
  const totalPages = data ? Math.ceil(data.total / data.limit) : 1

  return (
    <div className="flex gap-0 min-h-[600px]">
      {/* ── Segment Sidebar ── */}
      <div className="w-52 shrink-0 border-r border-gray-100 pr-1">
        <div className="flex items-center justify-between mb-3 pr-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Segments</p>
          <button onClick={onUploadMore}
            className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg bg-navy/10 hover:bg-navy hover:text-white text-navy transition-all">
            + Upload
          </button>
        </div>
        <ul className="space-y-0.5">
          {PRESET_SEGMENTS.map(({ key, icon }) => {
            const count = counts[key] ?? 0
            const isActive = segment === key
            return (
              <li key={key}>
                <button
                  onClick={() => handleSegment(key)}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-left transition-all ${isActive ? 'bg-navy text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <span className="flex items-center gap-1.5 text-xs font-bold truncate">
                    <span>{icon}</span>
                    <span className="truncate">{key}</span>
                  </span>
                  <span className={`text-[10px] font-black shrink-0 px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    {count.toLocaleString()}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      {/* ── Voter Table ── */}
      <div className="flex-1 min-w-0 pl-5">
        {/* Search + header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1">
            <h3 className="font-display font-black text-navy text-base">{segment}</h3>
            <p className="text-[11px] text-gray-400">{data ? `${data.total.toLocaleString()} voter${data.total !== 1 ? 's' : ''}` : '…'}</p>
          </div>
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              className="text-sm border border-gray-200 rounded-xl px-3 py-2 text-navy w-48 focus:outline-none focus:ring-2 focus:ring-gold-400"
              placeholder="Search voters…"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
            />
            <button type="submit"
              className="text-xs font-black px-3 py-2 rounded-xl bg-navy text-white hover:bg-navy-700 transition-colors">
              Search
            </button>
            {search && (
              <button type="button" onClick={() => { setSearch(''); setSearchInput(''); setPage(1) }}
                className="text-xs font-black px-3 py-2 rounded-xl border border-gray-200 text-gray-500 hover:text-navy transition-colors">
                Clear
              </button>
            )}
          </form>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <span className="w-8 h-8 border-4 border-navy border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !data || data.voters.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-4xl mb-3 opacity-20">🗳️</p>
            <p className="text-sm text-gray-500 font-semibold">No voters in this segment</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="text-sm w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Name</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Party</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Turnout</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Tags</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Contact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.voters.map(voter => (
                    <tr key={voter.id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => setSelectedVoter(voter)}
                    >
                      <td className="px-4 py-2.5">
                        <p className="font-bold text-navy">{voter.firstName} {voter.lastName}</p>
                        {voter.city && <p className="text-[11px] text-gray-400">{voter.city}{voter.zip ? ` ${voter.zip}` : ''}</p>}
                      </td>
                      <td className="px-3 py-2.5">
                        {voter.party ? (
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${PARTY_STYLE[voter.party] ?? 'bg-gray-100 text-gray-500'}`}>
                            {voter.party.slice(0, 3).toUpperCase()}
                          </span>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-3 py-2.5">
                        {voter.turnoutScore !== null ? (
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${voter.turnoutScore >= 70 ? 'bg-green-500' : voter.turnoutScore >= 40 ? 'bg-yellow-400' : 'bg-red-400'}`}
                                style={{ width: `${voter.turnoutScore}%` }} />
                            </div>
                            <span className="text-[11px] text-gray-500">{Math.round(voter.turnoutScore)}</span>
                          </div>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-wrap gap-1">
                          {voter.tags.slice(0, 2).map(t => (
                            <span key={t} className="text-[9px] font-black uppercase tracking-wide bg-navy/10 text-navy px-1.5 py-0.5 rounded-full">{t}</span>
                          ))}
                          {voter.tags.length > 2 && (
                            <span className="text-[9px] text-gray-400">+{voter.tags.length - 2}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${STATUS_STYLE[voter.contactStatus] ?? 'bg-gray-100 text-gray-500'}`}>
                          {voter.contactStatus}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex gap-1.5 text-gray-400">
                          {voter.phone && <span title="Has phone" className="text-sm">📞</span>}
                          {voter.email && <span title="Has email" className="text-sm">📧</span>}
                          {voter.address && <span title="Has address" className="text-sm">🏠</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-xs text-gray-400">
                  Page {page} of {totalPages} · {data.total.toLocaleString()} voters
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="text-xs font-black px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:border-navy hover:text-navy transition-all">
                    ← Prev
                  </button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="text-xs font-black px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:border-navy hover:text-navy transition-all">
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Profile Drawer */}
      {selectedVoter && (
        <VoterProfileDrawer
          voter={selectedVoter}
          onClose={() => setSelectedVoter(null)}
          onUpdate={updateVoter}
        />
      )}
    </div>
  )
}
