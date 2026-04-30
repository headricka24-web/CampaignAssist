'use client'

import { useState, useEffect, useCallback } from 'react'
import { useLocalStorage } from '@/lib/useLocalStorage'

// ── Types ─────────────────────────────────────────────────────────────────────

type Priority  = 'high' | 'medium' | 'low'
type ModalType = 'contact' | 'donor' | 'volunteer' | 'event' | 'draft' | null

type FollowUp    = { id: string; name: string; amount: number; followUpDue: string | null; status: string; overdue: boolean }
type EventItem   = { id: string; title: string; type: string; eventDate: string; location: string | null }
type DraftItem   = { id: string; title: string; type: string; platform: string | null; createdAt: string }
type ActionItem  = { priority: Priority; text: string }

type Stats = {
  contacts:         { today: number; thisWeek: number }
  fundraising:      { thisWeek: number; thisMonth: number }
  followUpsDue:     FollowUp[]
  volunteerShifts:  number
  pendingDraftCount: number
  pendingDrafts:    DraftItem[]
  upcomingEvents:   EventItem[]
  actions:          ActionItem[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt$(n: number) {
  return n >= 1000
    ? `$${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`
    : `$${Math.round(n).toLocaleString()}`
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function daysUntil(iso: string) {
  const d = Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000)
  if (d === 0) return 'Today'
  if (d === 1) return 'Tomorrow'
  if (d < 0)  return `${Math.abs(d)}d ago`
  return `in ${d}d`
}

const EVENT_TYPE_LABEL: Record<string, string> = {
  rally: 'Rally', townhall: 'Town Hall', fundraiser: 'Fundraiser',
  canvass: 'Canvass', debate: 'Debate', meeting: 'Meeting', event: 'Event',
}

const PRIORITY_STYLE: Record<Priority, { badge: string; dot: string; border: string }> = {
  high:   { badge: 'bg-red-100 text-red-700',    dot: 'bg-red-500',    border: 'border-red-200'    },
  medium: { badge: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-400', border: 'border-yellow-200' },
  low:    { badge: 'bg-blue-50 text-blue-700',    dot: 'bg-blue-400',   border: 'border-blue-100'   },
}

// ── Small Shared UI ───────────────────────────────────────────────────────────

function SectionHeader({ icon, title, count, onAdd, addLabel }: {
  icon: string; title: string; count?: number; onAdd?: () => void; addLabel?: string
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <span className="text-base">{icon}</span>
        <h3 className="font-display font-black text-navy text-xs uppercase tracking-widest">{title}</h3>
        {count !== undefined && (
          <span className="text-[10px] font-black bg-navy text-white px-2 py-0.5 rounded-full">{count}</span>
        )}
      </div>
      {onAdd && (
        <button onClick={onAdd}
          className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg bg-navy/10 hover:bg-navy text-navy hover:text-white transition-all">
          + {addLabel ?? 'Add'}
        </button>
      )}
    </div>
  )
}

function BigStat({ label, value, sub, accent, icon, onClick }: {
  label: string; value: string; sub?: string; accent: string; icon: string; onClick?: () => void
}) {
  return (
    <div
      className={`bg-white rounded-2xl border-2 ${accent} shadow-sm overflow-hidden ${onClick ? 'cursor-pointer hover:shadow-patriot transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">{label}</p>
          <span className="text-xl">{icon}</span>
        </div>
        <p className="font-display text-4xl font-bold text-navy tabular-nums leading-none mb-1">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
    </div>
  )
}

// ── Modal Shell ───────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-navy/70 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}>
        <div className="h-1.5 bg-gradient-to-r from-red-500 to-gold-400" />
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-display font-black text-sm uppercase tracking-wide text-navy">{title}</h2>
          <button onClick={onClose} className="text-xl text-gray-300 hover:text-navy transition-colors leading-none">✕</button>
        </div>
        <div className="overflow-y-auto p-6 space-y-4">{children}</div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

const inputCls = "w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 text-navy placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-gold-400"
const selectCls = "w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 text-navy bg-white focus:outline-none focus:ring-2 focus:ring-gold-400"

// ── Forms ─────────────────────────────────────────────────────────────────────

function ContactForm({ onDone }: { onDone: () => void }) {
  const [form, setForm] = useState({ name: '', phone: '', method: 'phone', status: 'completed', notes: '' })
  const [saving, setSaving] = useState(false)
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function submit() {
    if (!form.name.trim()) return
    setSaving(true)
    await fetch('/api/outreach/contacts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setSaving(false)
    onDone()
  }

  return (
    <>
      <Field label="Voter Name *"><input className={inputCls} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Jane Smith" /></Field>
      <Field label="Phone"><input className={inputCls} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="(555) 123-4567" /></Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Contact Method">
          <select className={selectCls} value={form.method} onChange={e => set('method', e.target.value)}>
            <option value="door">Door Knock</option>
            <option value="phone">Phone Call</option>
            <option value="text">Text</option>
            <option value="email">Email</option>
          </select>
        </Field>
        <Field label="Outcome">
          <select className={selectCls} value={form.status} onChange={e => set('status', e.target.value)}>
            <option value="completed">Contacted</option>
            <option value="attempted">No Answer</option>
            <option value="pending">Left Message</option>
          </select>
        </Field>
      </div>
      <Field label="Notes (optional)">
        <textarea className={`${inputCls} resize-none`} rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any notes…" />
      </Field>
      <button onClick={submit} disabled={saving || !form.name.trim()}
        className="w-full bg-navy hover:bg-navy-700 disabled:opacity-50 text-white font-black uppercase tracking-widest py-3 rounded-xl text-sm transition-all">
        {saving ? 'Saving…' : 'Log Contact'}
      </button>
    </>
  )
}

function DonorForm({ onDone }: { onDone: () => void }) {
  const today = new Date().toISOString().slice(0, 10)
  const [form, setForm] = useState({ name: '', email: '', amount: '', donatedAt: today, method: 'online', followUpDue: '', notes: '', status: 'received' })
  const [saving, setSaving] = useState(false)
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function submit() {
    if (!form.name.trim() || !form.amount) return
    setSaving(true)
    await fetch('/api/outreach/donors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setSaving(false)
    onDone()
  }

  return (
    <>
      <Field label="Donor Name *"><input className={inputCls} value={form.name} onChange={e => set('name', e.target.value)} placeholder="John Doe" /></Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Amount ($) *"><input className={inputCls} type="number" min="0" step="0.01" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="250.00" /></Field>
        <Field label="Date">
          <input className={inputCls} type="date" value={form.donatedAt} onChange={e => set('donatedAt', e.target.value)} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Method">
          <select className={selectCls} value={form.method} onChange={e => set('method', e.target.value)}>
            <option value="online">Online</option>
            <option value="check">Check</option>
            <option value="cash">Cash</option>
            <option value="card">Credit Card</option>
          </select>
        </Field>
        <Field label="Follow-up Date">
          <input className={inputCls} type="date" value={form.followUpDue} onChange={e => set('followUpDue', e.target.value)} />
        </Field>
      </div>
      <Field label="Email"><input className={inputCls} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="donor@email.com" /></Field>
      <Field label="Notes (optional)">
        <textarea className={`${inputCls} resize-none`} rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any notes…" />
      </Field>
      <button onClick={submit} disabled={saving || !form.name.trim() || !form.amount}
        className="w-full bg-navy hover:bg-navy-700 disabled:opacity-50 text-white font-black uppercase tracking-widest py-3 rounded-xl text-sm transition-all">
        {saving ? 'Saving…' : 'Log Donation'}
      </button>
    </>
  )
}

function VolunteerForm({ onDone }: { onDone: () => void }) {
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10)
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: '', shiftDate: tomorrow, shiftStart: '', shiftEnd: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function submit() {
    if (!form.name.trim() || !form.shiftDate) return
    setSaving(true)
    await fetch('/api/outreach/volunteers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setSaving(false)
    onDone()
  }

  return (
    <>
      <Field label="Volunteer Name *"><input className={inputCls} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Sarah Johnson" /></Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Phone"><input className={inputCls} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="(555) 000-0000" /></Field>
        <Field label="Role / Task"><input className={inputCls} value={form.role} onChange={e => set('role', e.target.value)} placeholder="Phone banker, Canvasser…" /></Field>
      </div>
      <Field label="Shift Date *"><input className={inputCls} type="date" value={form.shiftDate} onChange={e => set('shiftDate', e.target.value)} /></Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Start Time"><input className={inputCls} type="time" value={form.shiftStart} onChange={e => set('shiftStart', e.target.value)} /></Field>
        <Field label="End Time"><input className={inputCls} type="time" value={form.shiftEnd} onChange={e => set('shiftEnd', e.target.value)} /></Field>
      </div>
      <Field label="Notes (optional)">
        <textarea className={`${inputCls} resize-none`} rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any notes…" />
      </Field>
      <button onClick={submit} disabled={saving || !form.name.trim()}
        className="w-full bg-navy hover:bg-navy-700 disabled:opacity-50 text-white font-black uppercase tracking-widest py-3 rounded-xl text-sm transition-all">
        {saving ? 'Saving…' : 'Schedule Shift'}
      </button>
    </>
  )
}

function EventForm({ onDone }: { onDone: () => void }) {
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 16)
  const [form, setForm] = useState({ title: '', type: 'event', eventDate: tomorrow, location: '', description: '' })
  const [saving, setSaving] = useState(false)
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function submit() {
    if (!form.title.trim() || !form.eventDate) return
    setSaving(true)
    await fetch('/api/outreach/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setSaving(false)
    onDone()
  }

  return (
    <>
      <Field label="Event Title *"><input className={inputCls} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Town Hall Meeting" /></Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Event Type">
          <select className={selectCls} value={form.type} onChange={e => set('type', e.target.value)}>
            <option value="rally">Rally</option>
            <option value="townhall">Town Hall</option>
            <option value="fundraiser">Fundraiser</option>
            <option value="canvass">Canvass</option>
            <option value="debate">Debate</option>
            <option value="meeting">Meeting</option>
            <option value="event">Other</option>
          </select>
        </Field>
        <Field label="Date & Time *">
          <input className={inputCls} type="datetime-local" value={form.eventDate} onChange={e => set('eventDate', e.target.value)} />
        </Field>
      </div>
      <Field label="Location"><input className={inputCls} value={form.location} onChange={e => set('location', e.target.value)} placeholder="123 Main St, Springfield" /></Field>
      <Field label="Description (optional)">
        <textarea className={`${inputCls} resize-none`} rows={2} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Event details…" />
      </Field>
      <button onClick={submit} disabled={saving || !form.title.trim()}
        className="w-full bg-navy hover:bg-navy-700 disabled:opacity-50 text-white font-black uppercase tracking-widest py-3 rounded-xl text-sm transition-all">
        {saving ? 'Saving…' : 'Add Event'}
      </button>
    </>
  )
}

function DraftForm({ onDone }: { onDone: () => void }) {
  const [form, setForm] = useState({ title: '', type: 'social', platform: '', content: '', notes: '' })
  const [saving, setSaving] = useState(false)
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function submit() {
    if (!form.title.trim() || !form.content.trim()) return
    setSaving(true)
    await fetch('/api/outreach/drafts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setSaving(false)
    onDone()
  }

  return (
    <>
      <Field label="Draft Title *"><input className={inputCls} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Week 12 Facebook Post" /></Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Content Type">
          <select className={selectCls} value={form.type} onChange={e => set('type', e.target.value)}>
            <option value="social">Social Post</option>
            <option value="email">Email</option>
            <option value="press_release">Press Release</option>
            <option value="ad">Advertisement</option>
            <option value="mailer">Mailer</option>
          </select>
        </Field>
        <Field label="Platform (optional)"><input className={inputCls} value={form.platform} onChange={e => set('platform', e.target.value)} placeholder="Facebook, Instagram…" /></Field>
      </div>
      <Field label="Content *">
        <textarea className={`${inputCls} resize-none`} rows={4} value={form.content} onChange={e => set('content', e.target.value)} placeholder="Paste or write your draft here…" />
      </Field>
      <Field label="Notes (optional)">
        <textarea className={`${inputCls} resize-none`} rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Review notes…" />
      </Field>
      <button onClick={submit} disabled={saving || !form.title.trim() || !form.content.trim()}
        className="w-full bg-navy hover:bg-navy-700 disabled:opacity-50 text-white font-black uppercase tracking-widest py-3 rounded-xl text-sm transition-all">
        {saving ? 'Saving…' : 'Submit for Approval'}
      </button>
    </>
  )
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

export default function OutreachDashboard() {
  const [stats,         setStats]       = useState<Stats | null>(null)
  const [loading,       setLoading]     = useState(true)
  const [error,         setError]       = useState('')
  const [modal,         setModal]       = useState<ModalType>(null)
  const [weeklyGoal,    setWeeklyGoal]  = useLocalStorage('outreach-weekly-goal', 500)
  const [editingGoal,   setEditingGoal] = useState(false)
  const [goalInput,     setGoalInput]   = useState('')
  const [approvingId,   setApprovingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res  = await fetch('/api/outreach')
      const data = await res.json()
      setStats(data)
    } catch { setError('Failed to load outreach data.') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  function closeModal() { setModal(null); load() }

  async function approveDraft(id: string, status: 'approved' | 'rejected') {
    setApprovingId(id)
    await fetch('/api/outreach/drafts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    setApprovingId(null)
    load()
  }

  const s = stats

  const contactProgress = s ? Math.min(100, Math.round((s.contacts.thisWeek / weeklyGoal) * 100)) : 0
  const contactStatus   = contactProgress >= 80 ? 'green' : contactProgress >= 40 ? 'yellow' : 'red'

  const progressBar: Record<string, string> = {
    green:  'bg-gradient-to-r from-green-400 to-green-600',
    yellow: 'bg-gradient-to-r from-yellow-400 to-yellow-500',
    red:    'bg-gradient-to-r from-red-400 to-red-600',
  }

  return (
    <div className="space-y-8">

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <div className="relative rounded-2xl overflow-hidden bg-hero-gradient shadow-patriot">
        <div className="absolute inset-0 bg-stripe-pattern opacity-40" />
        <div className="absolute inset-0 flex items-center justify-end pr-12 pointer-events-none select-none">
          <span className="text-white opacity-[0.04] text-[180px] font-black leading-none">📋</span>
        </div>
        <div className="relative px-8 py-10">
          <div className="inline-flex items-center gap-2 bg-gold-400 text-navy text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full mb-4">
            ✦ Campaign Operations
          </div>
          <h1 className="font-display text-5xl font-black text-white leading-tight mb-2">
            Outreach <span className="text-gold-400">Command.</span>
          </h1>
          <p className="text-blue-200 text-lg max-w-xl mb-6">
            Every voter contact, donor, volunteer, and event — tracked in one place. Know your numbers. Know your next move.
          </p>

          {/* Quick add buttons */}
          <div className="flex flex-wrap gap-2">
            {([
              { type: 'contact' as ModalType,   label: '📞 Log Contact'   },
              { type: 'donor' as ModalType,     label: '💵 Log Donation'  },
              { type: 'volunteer' as ModalType, label: '👥 Add Volunteer' },
              { type: 'event' as ModalType,     label: '📅 Add Event'     },
              { type: 'draft' as ModalType,     label: '📝 Add Draft'     },
            ]).map(({ type, label }) => (
              <button key={type} onClick={() => setModal(type)}
                className="text-xs font-black uppercase tracking-widest px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all">
                {label}
              </button>
            ))}
            <button onClick={load} disabled={loading}
              className="text-xs font-black uppercase tracking-widest px-4 py-2 rounded-xl border border-gold-400/40 text-gold-400 hover:bg-gold-400 hover:text-navy transition-all disabled:opacity-50">
              {loading ? '↺ Loading…' : '↺ Refresh'}
            </button>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* ── Big Stats Row ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <BigStat
          label="Contacts Today"
          value={s ? s.contacts.today.toLocaleString() : '—'}
          sub={s?.contacts.today === 0 ? 'None logged yet' : 'voter touches logged'}
          accent="border-navy-100"
          icon="📞"
          onClick={() => setModal('contact')}
        />
        <div className="bg-white rounded-2xl border-2 border-navy-100 shadow-sm overflow-hidden">
          <div className="p-5">
            <div className="flex items-start justify-between gap-2 mb-3">
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">Contacts This Week</p>
              <span className="text-xl">📋</span>
            </div>
            <p className="font-display text-4xl font-bold text-navy tabular-nums leading-none mb-2">
              {s ? s.contacts.thisWeek.toLocaleString() : '—'}
            </p>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-gray-400">vs. weekly goal</span>
              {editingGoal ? (
                <div className="flex items-center gap-1">
                  <input
                    type="number" value={goalInput}
                    onChange={e => setGoalInput(e.target.value)}
                    className="w-16 text-xs border border-gray-200 rounded px-1.5 py-0.5 text-navy"
                    autoFocus
                    onBlur={() => { const n = parseInt(goalInput); if (n > 0) setWeeklyGoal(n); setEditingGoal(false) }}
                    onKeyDown={e => { if (e.key === 'Enter') { const n = parseInt(goalInput); if (n > 0) setWeeklyGoal(n); setEditingGoal(false) } }}
                  />
                </div>
              ) : (
                <button onClick={() => { setGoalInput(String(weeklyGoal)); setEditingGoal(true) }}
                  className="text-[10px] text-gray-300 hover:text-navy transition-colors">
                  Goal: {weeklyGoal.toLocaleString()} ✎
                </button>
              )}
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-700 ${progressBar[contactStatus]}`}
                style={{ width: `${contactProgress}%` }} />
            </div>
            <p className={`text-[10px] font-bold mt-1 ${contactStatus === 'green' ? 'text-green-600' : contactStatus === 'yellow' ? 'text-yellow-600' : 'text-red-500'}`}>
              {contactProgress}% of weekly goal
            </p>
          </div>
        </div>
        <BigStat
          label="Raised This Week"
          value={s ? fmt$(s.fundraising.thisWeek) : '—'}
          sub="total donations logged"
          accent="border-green-100"
          icon="💵"
          onClick={() => setModal('donor')}
        />
        <BigStat
          label="Raised This Month"
          value={s ? fmt$(s.fundraising.thisMonth) : '—'}
          sub="month-to-date total"
          accent="border-gold-100"
          icon="💰"
        />
      </div>

      {/* ── Action Cards Row ───────────────────────────────────────────── */}
      <div className="grid sm:grid-cols-3 gap-5">

        {/* Donor Follow-ups */}
        <div className={`bg-white rounded-2xl border-2 ${s && s.followUpsDue.some(f => f.overdue) ? 'border-red-200' : 'border-yellow-100'} shadow-sm overflow-hidden`}>
          <div className={`h-1.5 bg-gradient-to-r ${s && s.followUpsDue.some(f => f.overdue) ? 'from-red-500 to-red-700' : 'from-yellow-400 to-orange-400'}`} />
          <div className="p-5">
            <SectionHeader icon="📬" title="Donor Follow-ups" count={s?.followUpsDue.length} onAdd={() => setModal('donor')} addLabel="Add Donor" />
            {!s || s.followUpsDue.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-2xl mb-2 opacity-20">✅</p>
                <p className="text-xs text-gray-400">No follow-ups pending</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {s.followUpsDue.map(d => (
                  <li key={d.id} className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl ${d.overdue ? 'bg-red-50' : 'bg-yellow-50'}`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-navy truncate">{d.name}</p>
                      <p className="text-[10px] text-gray-500">{fmt$(d.amount)}</p>
                    </div>
                    <span className={`text-[10px] font-black shrink-0 px-2 py-0.5 rounded-full ${d.overdue ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {d.followUpDue ? daysUntil(d.followUpDue) : 'No date'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Volunteer Shifts */}
        <div className="bg-white rounded-2xl border-2 border-green-100 shadow-sm overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-green-500 to-green-700" />
          <div className="p-5">
            <SectionHeader icon="👥" title="Volunteer Shifts" onAdd={() => setModal('volunteer')} addLabel="Schedule" />
            <div className="text-center py-4">
              <p className="font-display text-5xl font-bold text-green-600 mb-1">{s?.volunteerShifts ?? '—'}</p>
              <p className="text-xs text-gray-400">shifts scheduled ahead</p>
            </div>
            <div className={`rounded-xl px-4 py-3 text-center ${(s?.volunteerShifts ?? 0) > 0 ? 'bg-green-50' : 'bg-gray-50'}`}>
              <p className={`text-xs font-bold ${(s?.volunteerShifts ?? 0) > 0 ? 'text-green-700' : 'text-gray-400'}`}>
                {(s?.volunteerShifts ?? 0) > 0
                  ? `${s!.volunteerShifts} shift${s!.volunteerShifts > 1 ? 's' : ''} on the books`
                  : 'No upcoming shifts — recruit now'}
              </p>
            </div>
            <button onClick={() => setModal('volunteer')}
              className="mt-3 w-full text-xs font-bold text-center text-gray-400 hover:text-navy transition-colors py-1">
              + Schedule a volunteer →
            </button>
          </div>
        </div>

        {/* Content Drafts */}
        <div className="bg-white rounded-2xl border-2 border-yellow-100 shadow-sm overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-yellow-400 to-gold-500" />
          <div className="p-5">
            <SectionHeader icon="📝" title="Drafts Pending" count={s?.pendingDraftCount} onAdd={() => setModal('draft')} addLabel="Submit Draft" />
            {!s || s.pendingDrafts.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-2xl mb-2 opacity-20">✅</p>
                <p className="text-xs text-gray-400">No drafts awaiting review</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {s.pendingDrafts.map(d => (
                  <li key={d.id} className="bg-yellow-50 rounded-xl px-3 py-2.5">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-navy truncate">{d.title}</p>
                        <p className="text-[10px] text-gray-500 capitalize">{d.type.replace('_', ' ')}{d.platform ? ` · ${d.platform}` : ''}</p>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={() => approveDraft(d.id, 'approved')} disabled={approvingId === d.id}
                        className="flex-1 text-[10px] font-black uppercase tracking-widest py-1 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors disabled:opacity-50">
                        Approve
                      </button>
                      <button onClick={() => approveDraft(d.id, 'rejected')} disabled={approvingId === d.id}
                        className="flex-1 text-[10px] font-black uppercase tracking-widest py-1 rounded-lg bg-gray-200 hover:bg-red-100 hover:text-red-700 text-gray-500 transition-colors disabled:opacity-50">
                        Reject
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* ── Events + Next Best Actions ─────────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Upcoming Events */}
        <div className="bg-white rounded-2xl border-2 border-navy-100 shadow-sm overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-navy to-blue-500" />
          <div className="p-6">
            <SectionHeader icon="📅" title="Upcoming Events" count={s?.upcomingEvents.length} onAdd={() => setModal('event')} addLabel="Add Event" />
            {!s || s.upcomingEvents.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-4xl mb-3 opacity-20">📅</p>
                <p className="text-sm text-gray-500 font-semibold">No events scheduled</p>
                <button onClick={() => setModal('event')}
                  className="mt-3 text-xs font-bold text-navy hover:text-red-500 transition-colors">
                  + Add your first event →
                </button>
              </div>
            ) : (
              <ul className="space-y-2">
                {s.upcomingEvents.map(e => {
                  const days = Math.ceil((new Date(e.eventDate).getTime() - Date.now()) / 86_400_000)
                  const urgent = days <= 2
                  return (
                    <li key={e.id} className={`flex items-start gap-3 px-4 py-3 rounded-xl ${urgent ? 'bg-red-50 border border-red-100' : 'bg-gray-50'}`}>
                      <div className={`shrink-0 text-center w-10 rounded-xl py-1 ${urgent ? 'bg-red-500' : 'bg-navy'}`}>
                        <p className="text-[9px] font-black uppercase text-white/70 leading-none">
                          {new Date(e.eventDate).toLocaleDateString('en-US', { month: 'short' })}
                        </p>
                        <p className="text-lg font-display font-bold text-white leading-tight">
                          {new Date(e.eventDate).getDate()}
                        </p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-navy truncate">{e.title}</p>
                        <p className="text-[11px] text-gray-500">
                          {EVENT_TYPE_LABEL[e.type] ?? e.type}
                          {e.location ? ` · ${e.location}` : ''}
                        </p>
                      </div>
                      <span className={`text-[10px] font-black shrink-0 px-2 py-0.5 rounded-full ${urgent ? 'bg-red-100 text-red-700' : 'bg-navy/10 text-navy'}`}>
                        {daysUntil(e.eventDate)}
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Next Best Actions */}
        <div className="bg-white rounded-2xl border-2 border-navy-100 shadow-sm overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-red-500 to-gold-400" />
          <div className="p-6">
            <SectionHeader icon="⚡" title="Recommended Next Actions" />
            {!s ? (
              <div className="py-8 flex items-center justify-center">
                <span className="w-5 h-5 border-2 border-navy border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <ul className="space-y-3">
                {s.actions.map((a, i) => {
                  const style = PRIORITY_STYLE[a.priority]
                  return (
                    <li key={i} className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${style.border} bg-white`}>
                      <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${style.dot}`} />
                      <div className="flex-1">
                        <p className="text-sm text-gray-800 leading-snug">{a.text}</p>
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full shrink-0 ${style.badge}`}>
                        {a.priority}
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* ── Modals ────────────────────────────────────────────────────── */}
      {modal === 'contact'   && <Modal title="Log Voter Contact"   onClose={closeModal}><ContactForm   onDone={closeModal} /></Modal>}
      {modal === 'donor'     && <Modal title="Log Donation"        onClose={closeModal}><DonorForm     onDone={closeModal} /></Modal>}
      {modal === 'volunteer' && <Modal title="Schedule Volunteer"  onClose={closeModal}><VolunteerForm onDone={closeModal} /></Modal>}
      {modal === 'event'     && <Modal title="Add Campaign Event"  onClose={closeModal}><EventForm     onDone={closeModal} /></Modal>}
      {modal === 'draft'     && <Modal title="Submit Content Draft" onClose={closeModal}><DraftForm    onDone={closeModal} /></Modal>}
    </div>
  )
}
