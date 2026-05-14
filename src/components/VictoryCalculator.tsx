'use client'

import { useState, useEffect } from 'react'
import { usePersistedContent } from '@/lib/usePersistedContent'
import Link from 'next/link'

type Candidate = {
  id: string
  name: string
  race: string
  state: string
  raceLevel: string | null
  district: string | null
  county: string | null
  city: string | null
} | null

type VictoryPlan = {
  electionDate:      string   // ISO date string
  registeredVoters:  number   // total registered voters in universe
  expectedTurnout:   number   // percent 0-100
  gopBase:           number   // percent of expected votes that are solid GOP
  raceType:          'two-way' | 'three-way' | 'four-way'
  conversionRate:    number   // % of contacts that convert to votes (default 15)
}

const DEFAULT_PLAN: VictoryPlan = {
  electionDate:     '',
  registeredVoters: 0,
  expectedTurnout:  55,
  gopBase:          40,
  raceType:         'two-way',
  conversionRate:   15,
}

const WIN_THRESHOLD: Record<VictoryPlan['raceType'], number> = {
  'two-way':   50,
  'three-way': 35,
  'four-way':  28,
}

function fmt(n: number) {
  return Math.round(n).toLocaleString()
}

function fmtPct(n: number) {
  return `${Math.round(n)}%`
}

function daysUntil(dateStr: string): number {
  if (!dateStr) return 0
  return Math.max(0, Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000))
}

function Gauge({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-[11px] text-gray-400 mt-1">{pct}% of target</p>
    </div>
  )
}

function StatBox({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent: string }) {
  return (
    <div className={`bg-white rounded-2xl border-2 ${accent} shadow-sm p-5`}>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">{label}</p>
      <p className="font-display text-3xl font-black text-navy leading-none">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

function SliderField({
  label, hint, value, min, max, step = 1, unit = '%',
  onChange,
}: {
  label: string; hint?: string; value: number; min: number; max: number; step?: number; unit?: string
  onChange: (v: number) => void
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-black uppercase tracking-widest text-gray-500">{label}</label>
        <span className="text-sm font-black text-navy">{value.toLocaleString()}{unit}</span>
      </div>
      {hint && <p className="text-[11px] text-gray-400 mb-2">{hint}</p>}
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-red-500"
      />
      <div className="flex justify-between text-[10px] text-gray-300 mt-0.5">
        <span>{min.toLocaleString()}{unit}</span>
        <span>{max.toLocaleString()}{unit}</span>
      </div>
    </div>
  )
}

export default function VictoryCalculator({
  candidate, totalContacts, totalVoters, totalRaised,
}: {
  candidate:     Candidate
  totalContacts: number
  totalVoters:   number
  totalRaised:   number
}) {
  const [plan, savePlan, { setLocal }] = usePersistedContent<VictoryPlan>('victory-plan', DEFAULT_PLAN)
  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState<VictoryPlan>(DEFAULT_PLAN)

  // Open edit mode automatically if no plan saved yet
  useEffect(() => {
    if (!plan.electionDate || !plan.registeredVoters) setEditing(true)
  }, [plan.electionDate, plan.registeredVoters])

  function openEdit() { setDraft({ ...plan }); setEditing(true) }
  function saveEdit() { savePlan(draft); setEditing(false) }

  // ── Math ─────────────────────────────────────────────────────────────────
  const expectedVotes     = Math.round(plan.registeredVoters * (plan.expectedTurnout / 100))
  const threshold         = WIN_THRESHOLD[plan.raceType]
  const winNumber         = Math.floor(expectedVotes * (threshold / 100)) + 1
  const gopBaseVotes      = Math.round(expectedVotes * (plan.gopBase / 100))
  const persuadableTarget = Math.max(0, winNumber - gopBaseVotes)
  const totalContactsNeeded = plan.conversionRate > 0
    ? Math.round(persuadableTarget / (plan.conversionRate / 100))
    : 0
  const days              = daysUntil(plan.electionDate)
  const dailyTarget       = days > 0 ? Math.ceil(totalContactsNeeded / days) : totalContactsNeeded
  const weeksLeft         = Math.floor(days / 7)
  const contactProgress   = totalContactsNeeded > 0 ? Math.min(100, Math.round((totalContacts / totalContactsNeeded) * 100)) : 0
  const onPace            = days > 0 && totalContactsNeeded > 0
    ? totalContacts >= Math.round(totalContactsNeeded * (1 - days / Math.max(1, (daysUntil(plan.electionDate) + days))))
    : false
  const _ = onPace // suppress unused warning

  const geo = (() => {
    const level = (candidate?.raceLevel ?? '').toLowerCase()
    if (level === 'federal'   && candidate?.district) return `${candidate.state} CD-${candidate.district}`
    if (level === 'state'     && candidate?.district) return `${candidate.state} District ${candidate.district}`
    if (level === 'county'    && candidate?.county)   return `${candidate.county} County`
    if (level === 'municipal' && candidate?.city)     return candidate.city
    return candidate?.state ?? 'your district'
  })()

  const electionDateLabel = plan.electionDate
    ? new Date(plan.electionDate + 'T12:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : null

  return (
    <div className="space-y-8">

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <div className="relative rounded-2xl overflow-hidden bg-hero-gradient shadow-patriot">
        <div className="absolute inset-0 bg-stripe-pattern opacity-40" />
        <div className="absolute inset-0 flex items-center justify-end pr-12 pointer-events-none select-none">
          <span className="text-white opacity-[0.03] text-[200px] font-black leading-none">★</span>
        </div>
        <div className="relative px-8 py-10">
          <div className="inline-flex items-center gap-2 bg-red-500 text-white text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full mb-4">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            Strategic Math
          </div>
          <h1 className="font-display text-5xl font-black text-white leading-tight mb-2">
            Path to <span className="text-gold-400">Victory.</span>
          </h1>
          <p className="text-blue-200 text-lg max-w-xl mb-6">
            Know your win number. Know your daily targets. Know exactly where you stand.
            {candidate && <span className="block mt-1 text-gold-400 font-bold">{candidate.name} · {candidate.race} · {geo}</span>}
          </p>
          <button onClick={openEdit}
            className="bg-gold-400 hover:bg-gold-500 text-navy font-black px-8 py-3 rounded-xl text-sm tracking-widest uppercase transition-colors focus:outline-none focus:ring-2 focus:ring-white">
            {plan.electionDate ? '✎ Edit Plan' : '⚡ Set Up Your Victory Plan'}
          </button>
        </div>
      </div>

      {/* ── Setup prompt if no plan ───────────────────────────────── */}
      {(!plan.electionDate || !plan.registeredVoters) && !editing && (
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 py-16 text-center">
          <div className="text-5xl mb-4 opacity-30">🗳️</div>
          <p className="text-gray-500 font-semibold">No victory plan set up yet.</p>
          <p className="text-gray-400 text-sm mt-1 mb-6">Enter your election date and district data to calculate your win number.</p>
          <button onClick={openEdit}
            className="bg-navy text-white font-black px-8 py-3 rounded-xl text-sm uppercase tracking-widest hover:bg-navy-700 transition-colors">
            ⚡ Set Up Victory Plan
          </button>
        </div>
      )}

      {/* ── Win Number Stats ──────────────────────────────────────── */}
      {plan.electionDate && plan.registeredVoters > 0 && (
        <>
          {/* Election countdown */}
          <div className={`rounded-2xl px-6 py-4 flex items-center justify-between gap-4 ${days <= 30 ? 'bg-red-500' : days <= 90 ? 'bg-yellow-500' : 'bg-navy'}`}>
            <div>
              <p className="text-white/70 text-xs font-black uppercase tracking-widest">Election Day</p>
              <p className="text-white font-display text-xl font-black mt-0.5">{electionDateLabel}</p>
            </div>
            <div className="text-right">
              <p className="font-display text-5xl font-black text-white leading-none">{days}</p>
              <p className="text-white/70 text-xs font-black uppercase tracking-widest mt-1">days left</p>
            </div>
          </div>

          {/* Key numbers */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatBox
              label="Win Number"
              value={fmt(winNumber)}
              sub={`votes to win (${threshold}%+ of expected turnout)`}
              accent="border-red-200"
            />
            <StatBox
              label="GOP Base Votes"
              value={fmt(gopBaseVotes)}
              sub={`${plan.gopBase}% of ${fmt(expectedVotes)} expected voters`}
              accent="border-blue-100"
            />
            <StatBox
              label="Votes Needed"
              value={fmt(persuadableTarget)}
              sub="from persuadable / low-turnout voters"
              accent="border-yellow-200"
            />
            <StatBox
              label="Days Remaining"
              value={String(days)}
              sub={weeksLeft > 0 ? `${weeksLeft} week${weeksLeft !== 1 ? 's' : ''} of campaigning left` : 'Final stretch!'}
              accent={days <= 30 ? 'border-red-300' : 'border-green-100'}
            />
          </div>

          {/* Field math */}
          <div className="grid lg:grid-cols-3 gap-6">

            {/* Daily targets */}
            <div className="bg-white rounded-2xl border-2 border-red-100 shadow-sm overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-red-500 to-red-700" />
              <div className="p-6">
                <h2 className="text-xs font-black uppercase tracking-[0.25em] text-gray-400 mb-5">Daily Field Targets</h2>
                <div className="space-y-4">
                  <div className="text-center py-4 bg-red-50 rounded-xl">
                    <p className="font-display text-5xl font-black text-red-600 leading-none">{fmt(dailyTarget)}</p>
                    <p className="text-xs font-black uppercase tracking-widest text-red-400 mt-2">voter contacts / day</p>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-500 flex items-center gap-2"><span>🚪</span> Doors to knock</span>
                      <span className="font-black text-navy">{fmt(dailyTarget * 0.6)}/day</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-500 flex items-center gap-2"><span>📞</span> Calls to make</span>
                      <span className="font-black text-navy">{fmt(dailyTarget * 0.3)}/day</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-500 flex items-center gap-2"><span>💬</span> Texts to send</span>
                      <span className="font-black text-navy">{fmt(dailyTarget * 0.1)}/day</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-400 text-center">Based on typical door:phone:text split (60/30/10)</p>
                </div>
              </div>
            </div>

            {/* Contact progress */}
            <div className="bg-white rounded-2xl border-2 border-navy-100 shadow-sm overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-navy to-blue-500" />
              <div className="p-6">
                <h2 className="text-xs font-black uppercase tracking-[0.25em] text-gray-400 mb-5">Outreach Progress</h2>
                <div className="space-y-5">
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <p className="text-xs font-bold text-gray-500">Voter Contacts Logged</p>
                      <p className="font-display text-2xl font-black text-navy">{fmt(totalContacts)}<span className="text-sm text-gray-400 font-normal"> / {fmt(totalContactsNeeded)}</span></p>
                    </div>
                    <Gauge value={totalContacts} max={totalContactsNeeded} color="bg-gradient-to-r from-navy to-blue-500" />
                  </div>

                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <p className="text-xs font-bold text-gray-500">Voter File Loaded</p>
                      <p className="font-display text-2xl font-black text-navy">{fmt(totalVoters)}</p>
                    </div>
                    <Gauge value={totalVoters} max={plan.registeredVoters} color="bg-gradient-to-r from-gold-400 to-yellow-500" />
                  </div>

                  <div className="pt-2">
                    <div className="flex justify-between items-end mb-2">
                      <p className="text-xs font-bold text-gray-500">Total Raised</p>
                      <p className="font-display text-2xl font-black text-navy">${totalRaised >= 1000 ? `${(totalRaised / 1000).toFixed(1)}k` : fmt(totalRaised)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Math breakdown */}
            <div className="bg-white rounded-2xl border-2 border-gold-200 shadow-sm overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-gold-400 to-yellow-500" />
              <div className="p-6">
                <h2 className="text-xs font-black uppercase tracking-[0.25em] text-gray-400 mb-5">Victory Math</h2>
                <div className="space-y-3">
                  {[
                    { label: 'Registered voters', value: fmt(plan.registeredVoters), note: 'your target universe' },
                    { label: `Expected turnout (${plan.expectedTurnout}%)`, value: fmt(expectedVotes), note: 'likely voters' },
                    { label: `Win threshold (${threshold}%+)`, value: fmt(winNumber), note: 'votes to win ✓', highlight: true },
                    { label: `GOP base (${plan.gopBase}%)`, value: fmt(gopBaseVotes), note: 'solid Republican votes' },
                    { label: 'Persuadables needed', value: fmt(persuadableTarget), note: 'votes to earn', highlight: true },
                    { label: `At ${plan.conversionRate}% conversion`, value: fmt(totalContactsNeeded), note: 'total contacts needed' },
                    { label: `Over ${days} days`, value: `${fmt(dailyTarget)}/day`, note: 'daily target', highlight: true },
                  ].map((row, i) => (
                    <div key={i} className={`flex items-start justify-between gap-2 px-3 py-2 rounded-lg ${row.highlight ? 'bg-gold-50 border border-gold-200' : ''}`}>
                      <div>
                        <p className={`text-xs font-bold ${row.highlight ? 'text-navy' : 'text-gray-600'}`}>{row.label}</p>
                        <p className="text-[10px] text-gray-400">{row.note}</p>
                      </div>
                      <span className={`text-sm font-black shrink-0 ${row.highlight ? 'text-red-600' : 'text-gray-700'}`}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Scenario modeling */}
          <div className="bg-white rounded-2xl border-2 border-navy-100 shadow-sm overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-navy to-gold-400" />
            <div className="p-6">
              <h2 className="text-xs font-black uppercase tracking-[0.25em] text-gray-400 mb-4">Turnout Scenarios</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                {[-10, 0, +10].map(delta => {
                  const t      = Math.max(10, Math.min(90, plan.expectedTurnout + delta))
                  const votes  = Math.round(plan.registeredVoters * (t / 100))
                  const win    = Math.floor(votes * (threshold / 100)) + 1
                  const base   = Math.round(votes * (plan.gopBase / 100))
                  const need   = Math.max(0, win - base)
                  const contacts = plan.conversionRate > 0 ? Math.round(need / (plan.conversionRate / 100)) : 0
                  const label  = delta < 0 ? 'Low Turnout' : delta > 0 ? 'High Turnout' : 'Expected'
                  const style  = delta < 0 ? 'border-blue-100' : delta > 0 ? 'border-red-100' : 'border-gold-200 bg-gold-50'
                  return (
                    <div key={delta} className={`rounded-xl border-2 p-4 ${style}`}>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">{label} ({t}%)</p>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs"><span className="text-gray-500">Total votes</span><span className="font-bold text-navy">{fmt(votes)}</span></div>
                        <div className="flex justify-between text-xs"><span className="text-gray-500">Win number</span><span className="font-bold text-red-600">{fmt(win)}</span></div>
                        <div className="flex justify-between text-xs"><span className="text-gray-500">Persuadables</span><span className="font-bold text-navy">{fmt(need)}</span></div>
                        <div className="flex justify-between text-xs font-black pt-1 border-t border-gray-100"><span className="text-gray-600">Contacts needed</span><span className="text-navy">{fmt(contacts)}</span></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Quick links */}
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { href: '/voters',     icon: '🗳️', label: 'Voter File',      desc: `${fmt(totalVoters)} voters loaded` },
              { href: '/outreach',   icon: '📞', label: 'Log Contacts',    desc: `${fmt(totalContacts)} logged so far` },
              { href: '/legislative', icon: '💰', label: 'Fundraising',     desc: `$${totalRaised >= 1000 ? `${(totalRaised / 1000).toFixed(1)}k` : fmt(totalRaised)} raised` },
            ].map(l => (
              <Link key={l.href} href={l.href}
                className="flex items-center gap-4 bg-white rounded-2xl border-2 border-navy-100 shadow-sm px-5 py-4 hover:border-navy hover:shadow-patriot transition-all group">
                <span className="text-2xl">{l.icon}</span>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-navy group-hover:text-red-500 transition-colors">{l.label}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{l.desc}</p>
                </div>
                <span className="ml-auto text-gray-300 group-hover:text-navy transition-colors">→</span>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* ── Edit / Setup Modal ────────────────────────────────────── */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => plan.electionDate && setEditing(false)}>
          <div className="absolute inset-0 bg-navy/70 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="h-1.5 bg-gradient-to-r from-red-500 to-gold-400" />
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="font-display font-black text-navy uppercase tracking-wide text-sm">Victory Plan Setup</h2>
                <p className="text-xs text-gray-400 mt-0.5">Enter your district data to calculate your win number</p>
              </div>
              {plan.electionDate && (
                <button onClick={() => setEditing(false)} className="text-xl text-gray-300 hover:text-navy transition-colors leading-none">✕</button>
              )}
            </div>

            <div className="p-6 space-y-6">

              {/* Election date */}
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Election Date</label>
                <input
                  type="date"
                  value={draft.electionDate}
                  onChange={e => setDraft(d => ({ ...d, electionDate: e.target.value }))}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
                />
              </div>

              {/* Registered voters */}
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-1.5">Registered Voters in Your Universe</label>
                <p className="text-[11px] text-gray-400 mb-2">Total registered voters in your district, precinct set, or target geography</p>
                <input
                  type="number"
                  value={draft.registeredVoters || ''}
                  onChange={e => setDraft(d => ({ ...d, registeredVoters: parseInt(e.target.value) || 0 }))}
                  placeholder="e.g. 45000"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
                />
              </div>

              {/* Race type */}
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Race Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['two-way', 'three-way', 'four-way'] as const).map(rt => (
                    <button key={rt} onClick={() => setDraft(d => ({ ...d, raceType: rt }))}
                      className={`py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border-2 transition-all ${draft.raceType === rt ? 'bg-navy text-white border-navy' : 'border-gray-200 text-gray-400 hover:border-navy hover:text-navy'}`}>
                      {rt.replace('-', ' ')}
                      <span className="block text-[9px] opacity-60 normal-case font-normal mt-0.5">{WIN_THRESHOLD[rt]}%+ to win</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sliders */}
              <SliderField
                label="Expected Turnout"
                hint="What % of registered voters are likely to vote? Check historical results for this race."
                value={draft.expectedTurnout} min={15} max={90}
                onChange={v => setDraft(d => ({ ...d, expectedTurnout: v }))}
              />

              <SliderField
                label="GOP Base Performance"
                hint="What % of total votes can you count on from solid Republican voters?"
                value={draft.gopBase} min={10} max={65}
                onChange={v => setDraft(d => ({ ...d, gopBase: v }))}
              />

              <SliderField
                label="Contact → Vote Conversion Rate"
                hint="What % of voter contacts you make will result in a vote? Typical range: 10–20%."
                value={draft.conversionRate} min={5} max={35}
                onChange={v => setDraft(d => ({ ...d, conversionRate: v }))}
              />

              {/* Live preview */}
              {draft.registeredVoters > 0 && draft.electionDate && (
                <div className="bg-gold-50 border-2 border-gold-200 rounded-xl px-5 py-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Preview</p>
                  <div className="grid grid-cols-2 gap-3">
                    {(() => {
                      const ev = Math.round(draft.registeredVoters * (draft.expectedTurnout / 100))
                      const wn = Math.floor(ev * (WIN_THRESHOLD[draft.raceType] / 100)) + 1
                      const gb = Math.round(ev * (draft.gopBase / 100))
                      const pt = Math.max(0, wn - gb)
                      const tc = draft.conversionRate > 0 ? Math.round(pt / (draft.conversionRate / 100)) : 0
                      const d  = daysUntil(draft.electionDate)
                      return [
                        { l: 'Win number', v: fmt(wn) },
                        { l: 'Persuadables needed', v: fmt(pt) },
                        { l: 'Total contacts needed', v: fmt(tc) },
                        { l: 'Daily target', v: d > 0 ? `${fmt(Math.ceil(tc / d))}/day` : '—' },
                      ].map(({ l, v }) => (
                        <div key={l}>
                          <p className="text-[10px] text-gray-500">{l}</p>
                          <p className="font-display text-xl font-black text-red-600">{v}</p>
                        </div>
                      ))
                    })()}
                  </div>
                </div>
              )}

              <button
                onClick={saveEdit}
                disabled={!draft.electionDate || draft.registeredVoters < 1}
                className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-black uppercase tracking-widest py-3.5 rounded-xl text-sm transition-colors shadow-glow-red"
              >
                Save Victory Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
