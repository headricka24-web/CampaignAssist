'use client'

import { useState, useEffect, useCallback } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

type Voter = {
  id:              string
  firstName:       string
  lastName:        string
  address:         string | null
  city:            string | null
  zip:             string | null
  phone:           string | null
  email:           string | null
  party:           string | null
  supportLevel:    string | null
  turnoutScore:    number | null
  precinct:        string | null
  tags:            string[]
  notes:           string | null
  contactStatus:   string
  lastContactedAt: string | null
  createdAt:       string
}

type APIResponse = {
  voters:        Voter[]
  total:         number
  page:          number
  limit:         number
  segmentCounts: Record<string, number>
  tagCounts:     Record<string, number>
}

type AdvancedFilters = {
  parties:       string[]
  supportLevels: string[]
  turnoutMin:    string
  turnoutMax:    string
  hasPhone:      boolean
  hasEmail:      boolean
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CONTACT_STATUSES = [
  { key: 'Not Contacted',   icon: '⭕', color: 'text-gray-500' },
  { key: 'Reached',         icon: '✅', color: 'text-green-600' },
  { key: 'Left Message',    icon: '📬', color: 'text-yellow-600' },
  { key: 'Needs Follow-Up', icon: '🔁', color: 'text-blue-600' },
  { key: 'Wrong Number',    icon: '❌', color: 'text-orange-500' },
  { key: 'Do Not Contact',  icon: '🚫', color: 'text-red-600' },
]

const PARTY_OPTIONS    = ['Republican', 'Democrat', 'Independent', 'Unknown']
const SUPPORT_OPTIONS  = ['Strong Support', 'Lean Support', 'Persuadable', 'Opposed', 'Unknown']

const PARTY_STYLE: Record<string, string> = {
  Republican:  'bg-red-100 text-red-700',
  Democrat:    'bg-blue-100 text-blue-700',
  Independent: 'bg-purple-100 text-purple-700',
}

const STATUS_STYLE: Record<string, string> = {
  'Not Contacted':   'bg-gray-100 text-gray-500',
  'Reached':         'bg-green-100 text-green-700',
  'Left Message':    'bg-yellow-100 text-yellow-700',
  'Wrong Number':    'bg-orange-100 text-orange-700',
  'Do Not Contact':  'bg-red-100 text-red-600',
  'Needs Follow-Up': 'bg-blue-100 text-blue-700',
}

const EMPTY_FILTERS: AdvancedFilters = {
  parties:       [],
  supportLevels: [],
  turnoutMin:    '',
  turnoutMax:    '',
  hasPhone:      false,
  hasEmail:      false,
}

// ── CSV helpers ───────────────────────────────────────────────────────────────

function csvEscape(val: string | null | undefined): string {
  if (val == null) return ''
  const s = String(val)
  if (s.includes('"') || s.includes(',') || s.includes('\n') || s.includes('\r')) {
    return '"' + s.replace(/"/g, '""') + '"'
  }
  return s
}

export function votersToCSV(voters: Voter[]): string {
  const headers = [
    'First Name', 'Last Name', 'Address', 'City', 'Zip', 'Phone', 'Email',
    'Party', 'Support Level', 'Turnout Score', 'Contact Status', 'Precinct',
    'Tags', 'Notes', 'Last Contacted',
  ]
  const rows = voters.map(v => [
    csvEscape(v.firstName),
    csvEscape(v.lastName),
    csvEscape(v.address),
    csvEscape(v.city),
    csvEscape(v.zip),
    csvEscape(v.phone),
    csvEscape(v.email),
    csvEscape(v.party),
    csvEscape(v.supportLevel),
    v.turnoutScore != null ? String(Math.round(v.turnoutScore)) : '',
    csvEscape(v.contactStatus),
    csvEscape(v.precinct),
    csvEscape(v.tags.join('; ')),
    csvEscape(v.notes),
    v.lastContactedAt ? new Date(v.lastContactedAt).toLocaleDateString('en-US') : '',
  ].join(','))
  return [headers.join(','), ...rows].join('\r\n')
}

function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href     = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// ── Profile Drawer ────────────────────────────────────────────────────────────

function VoterProfileDrawer({
  voter, onClose, onUpdate,
}: {
  voter:    Voter
  onClose:  () => void
  onUpdate: (updated: Voter) => void
}) {
  const [status,         setStatus]         = useState(voter.contactStatus)
  const [notes,          setNotes]          = useState(voter.notes ?? '')
  const [tags,           setTags]           = useState<string[]>(voter.tags)
  const [tagInput,       setTagInput]       = useState('')
  const [saving,         setSaving]         = useState(false)
  const [dirty,          setDirty]          = useState(false)
  const [loggedOutreach, setLoggedOutreach] = useState(false)
  const [loggingOut,     setLoggingOut]     = useState(false)

  const contactedStatuses = ['Reached', 'Left Message', 'Needs Follow-Up']

  async function save() {
    setSaving(true)
    const res     = await fetch(`/api/voters/${voter.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contactStatus: status, notes, tags }),
    })
    const updated = await res.json()
    setSaving(false)
    setDirty(false)
    onUpdate(updated)
  }

  async function logToOutreach() {
    setLoggingOut(true)
    const methodMap: Record<string, string> = {
      'Reached':         'phone',
      'Left Message':    'phone',
      'Needs Follow-Up': 'phone',
    }
    await fetch('/api/outreach/contacts', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name:    `${voter.firstName} ${voter.lastName}`.trim(),
        phone:   voter.phone,
        email:   voter.email,
        address: voter.address,
        method:  methodMap[status] ?? 'phone',
        status:  status === 'Reached' ? 'completed' : 'attempted',
        notes:   notes || null,
      }),
    })
    setLoggingOut(false)
    setLoggedOutreach(true)
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
            <p className="text-[11px] text-gray-400">
              {voter.precinct ? `Precinct ${voter.precinct}` : ''}
              {voter.city ? ` · ${voter.city}` : ''}
            </p>
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
            {voter.phone   && <p className="text-sm text-gray-600">📞 <a href={`tel:${voter.phone}`}      className="text-navy hover:underline">{voter.phone}</a></p>}
            {voter.email   && <p className="text-sm text-gray-600">📧 <a href={`mailto:${voter.email}`}   className="text-navy hover:underline">{voter.email}</a></p>}
          </div>

          {/* Contact status */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">Contact Status</label>
            <select
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 text-navy bg-white focus:outline-none focus:ring-2 focus:ring-gold-400"
              value={status}
              onChange={e => { setStatus(e.target.value); setDirty(true); setLoggedOutreach(false) }}
            >
              {CONTACT_STATUSES.map(({ key }) => <option key={key} value={key}>{key}</option>)}
            </select>

            {/* Log to outreach CTA */}
            {contactedStatuses.includes(status) && (
              <button
                onClick={logToOutreach}
                disabled={loggingOut || loggedOutreach}
                className={`mt-2 w-full text-xs font-black uppercase tracking-widest py-2 rounded-xl transition-all ${
                  loggedOutreach
                    ? 'bg-green-100 text-green-700 cursor-default'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {loggedOutreach ? '✓ Logged to Outreach' : loggingOut ? 'Logging…' : '+ Log to Outreach Tracker'}
              </button>
            )}
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
            <p className="text-[11px] text-gray-400">
              Last contacted: {new Date(voter.lastContactedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
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

// ── Segment Sidebar ────────────────────────────────────────────────────────────

function SegmentSidebar({
  segmentCounts, tagCounts, segment, onSegment, onUploadMore,
  filters, onFiltersChange,
}: {
  segmentCounts:   Record<string, number>
  tagCounts:       Record<string, number>
  segment:         string
  onSegment:       (s: string) => void
  onUploadMore:    () => void
  filters:         AdvancedFilters
  onFiltersChange: (f: AdvancedFilters) => void
}) {
  const activeTags = Object.entries(tagCounts)
    .filter(([, c]) => c > 0)
    .sort((a, b) => b[1] - a[1])

  function toggleArrayValue<T>(arr: T[], val: T): T[] {
    return arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]
  }

  function SidebarBtn({ label, icon, count, active }: { label: string; icon?: string; count: number; active: boolean }) {
    return (
      <button
        onClick={() => onSegment(label)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-left transition-all ${active ? 'bg-navy text-white' : 'text-gray-600 hover:bg-gray-50'}`}
      >
        <span className="flex items-center gap-1.5 text-xs font-bold truncate">
          {icon && <span>{icon}</span>}
          <span className="truncate">{label}</span>
        </span>
        <span className={`text-[10px] font-black shrink-0 px-1.5 py-0.5 rounded-full ${active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
          {count.toLocaleString()}
        </span>
      </button>
    )
  }

  return (
    <div className="w-56 shrink-0 border-r border-gray-100 pr-2 overflow-y-auto max-h-[80vh]">
      <div className="flex items-center justify-between mb-3 pr-1">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Contacts</p>
        <button onClick={onUploadMore}
          className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg bg-navy/10 hover:bg-navy hover:text-white text-navy transition-all">
          + Upload
        </button>
      </div>

      {/* All contacts */}
      <SidebarBtn
        label="All Contacts"
        icon="👤"
        count={segmentCounts['All Contacts'] ?? 0}
        active={segment === 'All Contacts'}
      />

      {/* Status filters */}
      <p className="text-[9px] font-black uppercase tracking-widest text-gray-300 px-3 pt-4 pb-1">By Status</p>
      <ul className="space-y-0.5">
        {CONTACT_STATUSES.map(({ key, icon }) => (
          <li key={key}>
            <SidebarBtn
              label={key}
              icon={icon}
              count={segmentCounts[key] ?? 0}
              active={segment === key}
            />
          </li>
        ))}
      </ul>

      {/* Dynamic tags from imported data */}
      {activeTags.length > 0 && (
        <>
          <p className="text-[9px] font-black uppercase tracking-widest text-gray-300 px-3 pt-4 pb-1">By Tag</p>
          <ul className="space-y-0.5">
            {activeTags.map(([tag, count]) => (
              <li key={tag}>
                <SidebarBtn
                  label={tag}
                  count={count}
                  active={segment === tag}
                />
              </li>
            ))}
          </ul>
        </>
      )}

      {/* ── Advanced Filters ── */}
      <div className="mt-5 border-t border-gray-100 pt-4 space-y-4">
        <p className="text-[9px] font-black uppercase tracking-widest text-gray-300 px-1">Advanced Filters</p>

        {/* Party */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 px-1">Party</p>
          <div className="space-y-1">
            {PARTY_OPTIONS.map(p => (
              <label key={p} className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  className="accent-navy w-3 h-3"
                  checked={filters.parties.includes(p)}
                  onChange={() => onFiltersChange({ ...filters, parties: toggleArrayValue(filters.parties, p) })}
                />
                <span className="text-xs text-gray-600">{p}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Support Level */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 px-1">Support Level</p>
          <div className="space-y-1">
            {SUPPORT_OPTIONS.map(s => (
              <label key={s} className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  className="accent-navy w-3 h-3"
                  checked={filters.supportLevels.includes(s)}
                  onChange={() => onFiltersChange({ ...filters, supportLevels: toggleArrayValue(filters.supportLevels, s) })}
                />
                <span className="text-xs text-gray-600">{s}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Turnout Score */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 px-1">Turnout Score</p>
          <div className="flex items-center gap-2 px-1">
            <input
              type="number"
              min={0}
              max={100}
              placeholder="Min"
              className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-navy focus:outline-none focus:ring-1 focus:ring-gold-400"
              value={filters.turnoutMin}
              onChange={e => onFiltersChange({ ...filters, turnoutMin: e.target.value })}
            />
            <span className="text-gray-300 text-xs shrink-0">–</span>
            <input
              type="number"
              min={0}
              max={100}
              placeholder="Max"
              className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-navy focus:outline-none focus:ring-1 focus:ring-gold-400"
              value={filters.turnoutMax}
              onChange={e => onFiltersChange({ ...filters, turnoutMax: e.target.value })}
            />
          </div>
        </div>

        {/* Has Phone / Has Email */}
        <div className="space-y-1 px-1">
          <label className="flex items-center gap-2 py-1 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              className="accent-navy w-3 h-3"
              checked={filters.hasPhone}
              onChange={e => onFiltersChange({ ...filters, hasPhone: e.target.checked })}
            />
            <span className="text-xs text-gray-600">Has Phone</span>
          </label>
          <label className="flex items-center gap-2 py-1 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              className="accent-navy w-3 h-3"
              checked={filters.hasEmail}
              onChange={e => onFiltersChange({ ...filters, hasEmail: e.target.checked })}
            />
            <span className="text-xs text-gray-600">Has Email</span>
          </label>
        </div>
      </div>
    </div>
  )
}

// ── Active filter count helper ─────────────────────────────────────────────────

function countActiveFilters(filters: AdvancedFilters): number {
  let n = 0
  if (filters.parties.length)       n++
  if (filters.supportLevels.length) n++
  if (filters.turnoutMin !== '')     n++
  if (filters.turnoutMax !== '')     n++
  if (filters.hasPhone)              n++
  if (filters.hasEmail)              n++
  return n
}

// ── Main Table ────────────────────────────────────────────────────────────────

export default function VoterSegmentsTable({ onUploadMore }: { onUploadMore: () => void }) {
  const [data,          setData]          = useState<APIResponse | null>(null)
  const [loading,       setLoading]       = useState(true)
  const [segment,       setSegment]       = useState('All Contacts')
  const [search,        setSearch]        = useState('')
  const [page,          setPage]          = useState(1)
  const [selectedVoter, setSelectedVoter] = useState<Voter | null>(null)
  const [searchInput,   setSearchInput]   = useState('')
  const [filters,       setFilters]       = useState<AdvancedFilters>(EMPTY_FILTERS)
  const [exporting,      setExporting]      = useState(false)
  const [phoneBankModal, setPhoneBankModal] = useState(false)
  const [pbName,         setPbName]         = useState('')
  const [pbCreating,     setPbCreating]     = useState(false)
  const [pbResult,       setPbResult]       = useState<{ count: number } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '50' })
    if (segment !== 'All Contacts') params.set('segment', segment)
    if (search) params.set('search', search)
    // Advanced filters
    if (filters.parties.length)       params.set('parties',      filters.parties.join(','))
    if (filters.supportLevels.length) params.set('supportLevels',filters.supportLevels.join(','))
    if (filters.turnoutMin !== '')     params.set('turnoutMin',   filters.turnoutMin)
    if (filters.turnoutMax !== '')     params.set('turnoutMax',   filters.turnoutMax)
    if (filters.hasPhone)             params.set('hasPhone',     '1')
    if (filters.hasEmail)             params.set('hasEmail',     '1')
    const res  = await fetch(`/api/voters?${params}`)
    const json = await res.json()
    setData(json)
    setLoading(false)
  }, [segment, search, page, filters])

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

  function handleFiltersChange(f: AdvancedFilters) {
    setFilters(f)
    setPage(1)
  }

  function clearAllFilters() {
    setFilters(EMPTY_FILTERS)
    setSearch('')
    setSearchInput('')
    setPage(1)
  }

  function updateVoter(updated: Voter) {
    setData(d => d ? { ...d, voters: d.voters.map(v => v.id === updated.id ? updated : v) } : d)
    setSelectedVoter(updated)
    load()
  }

  // Client-side CSV export of currently visible/filtered voters
  function handleExportCSV() {
    if (!data) return
    const csv = votersToCSV(data.voters)
    downloadCSV(csv, `voters-${segment.toLowerCase().replace(/\s+/g, '-')}.csv`)
  }

  // Full server-side export (all matching voters, not just current page)
  async function handleFullExport() {
    setExporting(true)
    try {
      const params = new URLSearchParams()
      if (segment !== 'All Contacts') params.set('segment', segment)
      if (search) params.set('search', search)
      if (filters.parties.length)       params.set('parties',       filters.parties.join(','))
      if (filters.supportLevels.length) params.set('supportLevels', filters.supportLevels.join(','))
      if (filters.turnoutMin !== '')     params.set('turnoutMin',    filters.turnoutMin)
      if (filters.turnoutMax !== '')     params.set('turnoutMax',    filters.turnoutMax)
      if (filters.hasPhone)             params.set('hasPhone',      '1')
      if (filters.hasEmail)             params.set('hasEmail',      '1')
      const res  = await fetch(`/api/voters/export?${params}`)
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href     = url
      link.download = `voters-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  async function handleCreatePhoneBank() {
    if (!pbName.trim()) return
    setPbCreating(true)
    try {
      const res  = await fetch('/api/outreach/lists/from-voters', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          name:          pbName.trim(),
          segment:       segment !== 'All Contacts' ? segment : undefined,
          search:        search || undefined,
          parties:       filters.parties.length       ? filters.parties       : undefined,
          supportLevels: filters.supportLevels.length ? filters.supportLevels : undefined,
          hasPhone:      filters.hasPhone             ? true                  : undefined,
        }),
      })
      const data = await res.json()
      if (res.ok) { setPbResult({ count: data.count }); setPbName('') }
      else        { alert(data.error === 'no_voters' ? 'No voters match the current filters.' : 'Failed to create list.') }
    } finally { setPbCreating(false) }
  }

  const counts       = data?.segmentCounts ?? {}
  const tagCounts    = data?.tagCounts     ?? {}
  const totalPages   = data ? Math.ceil(data.total / data.limit) : 1
  const activeFilters = countActiveFilters(filters)
  const hasAnyFilter  = activeFilters > 0 || !!search

  return (
    <div className="flex gap-0 min-h-[600px]">
      {/* ── Segment Sidebar ── */}
      <SegmentSidebar
        segmentCounts={counts}
        tagCounts={tagCounts}
        segment={segment}
        onSegment={handleSegment}
        onUploadMore={onUploadMore}
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />

      {/* ── Voter Table ── */}
      <div className="flex-1 min-w-0 pl-5">
        {/* Search + header */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-display font-black text-navy text-base">{segment}</h3>
              {activeFilters > 0 && (
                <span className="text-[10px] font-black bg-gold-400 text-navy px-2 py-0.5 rounded-full">
                  {activeFilters} filter{activeFilters !== 1 ? 's' : ''} active
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-400">{data ? `${data.total.toLocaleString()} contact${data.total !== 1 ? 's' : ''}` : '…'}</p>
          </div>

          {/* Export + Phone Bank buttons */}
          <div className="flex gap-2 items-center">
            {data && data.voters.length > 0 && (
              <button
                onClick={handleExportCSV}
                className="text-xs font-black px-3 py-2 rounded-xl border border-gray-200 text-gray-600 hover:border-navy hover:text-navy transition-all"
                title="Export this page as CSV"
              >
                ↓ Export Page
              </button>
            )}
            <button
              onClick={handleFullExport}
              disabled={exporting}
              className="text-xs font-black px-3 py-2 rounded-xl bg-navy text-white hover:bg-navy-700 disabled:opacity-50 transition-all"
              title="Export all matching voters as CSV"
            >
              {exporting ? 'Exporting…' : '↓ Export CSV'}
            </button>
            <button
              onClick={() => { setPhoneBankModal(true); setPbResult(null); setPbName(segment !== 'All Contacts' ? segment : '') }}
              className="text-xs font-black px-3 py-2 rounded-xl bg-gold-400 hover:bg-gold-300 text-navy transition-all"
              title="Create a phone bank call list from these voters"
            >
              📋 Phone Bank
            </button>
          </div>

          {/* Search form */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              className="text-sm border border-gray-200 rounded-xl px-3 py-2 text-navy w-48 focus:outline-none focus:ring-2 focus:ring-gold-400"
              placeholder="Search contacts…"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
            />
            <button type="submit"
              className="text-xs font-black px-3 py-2 rounded-xl bg-navy text-white hover:bg-navy-700 transition-colors">
              Search
            </button>
            {hasAnyFilter && (
              <button type="button" onClick={clearAllFilters}
                className="text-xs font-black px-3 py-2 rounded-xl border border-gray-200 text-gray-500 hover:text-navy transition-colors">
                Clear All
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
            <p className="text-sm text-gray-500 font-semibold">No contacts in this segment</p>
            {hasAnyFilter && (
              <button onClick={clearAllFilters}
                className="mt-3 text-xs font-black px-4 py-2 rounded-xl border border-gray-200 text-gray-500 hover:text-navy transition-colors">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="text-sm w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Name</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Party</th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Support</th>
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
                        {voter.supportLevel ? (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-navy/10 text-navy">
                            {voter.supportLevel.split(' ')[0]}
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
                          {voter.phone   && <span title="Has phone"   className="text-sm">📞</span>}
                          {voter.email   && <span title="Has email"   className="text-sm">📧</span>}
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
                  Page {page} of {totalPages} · {data.total.toLocaleString()} contacts
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

      {/* ── Phone Bank Modal ── */}
      {phoneBankModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => !pbCreating && setPhoneBankModal(false)}>
          <div className="absolute inset-0 bg-navy/70 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="h-1.5 bg-gradient-to-r from-gold-400 to-navy" />
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="font-display font-black text-sm uppercase tracking-wide text-navy">Create Phone Bank List</h2>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {data ? `${data.total.toLocaleString()} voters` : 'current filter'} → Outreach → Lists
                </p>
              </div>
              <button onClick={() => setPhoneBankModal(false)} className="text-xl text-gray-300 hover:text-navy leading-none">✕</button>
            </div>

            {pbResult ? (
              <div className="p-6 text-center space-y-4">
                <p className="text-4xl">✅</p>
                <p className="font-bold text-navy text-base">{pbResult.count.toLocaleString()} voters added to your call list</p>
                <p className="text-sm text-gray-500">Go to <strong>Outreach → 📋 Lists</strong> to split into segments, assign volunteers, generate a call script, and share links.</p>
                <div className="flex gap-2">
                  <a href="/outreach"
                    className="flex-1 bg-navy text-white font-bold py-2.5 rounded-xl text-sm text-center hover:bg-navy-700 transition-colors">
                    Go to Outreach →
                  </a>
                  <button onClick={() => setPhoneBankModal(false)}
                    className="px-4 text-sm text-gray-400 hover:text-gray-600 rounded-xl border border-gray-200 transition-colors">
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">List Name</label>
                  <input
                    value={pbName}
                    onChange={e => setPbName(e.target.value)}
                    placeholder="e.g. GOTV Push — Ward 4"
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 text-navy placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-gold-400"
                  />
                </div>
                <p className="text-xs text-gray-400">
                  This will copy your currently filtered voters into a new Contact List in the Outreach section where you can split them into segments, share call links with volunteers, and generate call scripts.
                </p>
                <div className="flex gap-2">
                  <button onClick={handleCreatePhoneBank} disabled={pbCreating || !pbName.trim()}
                    className="flex-1 bg-navy text-white font-bold py-2.5 rounded-xl text-sm hover:bg-navy-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                    {pbCreating
                      ? <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Creating…</>
                      : '📋 Create List'}
                  </button>
                  <button onClick={() => setPhoneBankModal(false)}
                    className="px-4 text-sm text-gray-400 hover:text-gray-600 rounded-xl border border-gray-200 transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
