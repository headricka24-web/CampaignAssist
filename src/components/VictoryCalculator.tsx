'use client'

import { useState, useEffect } from 'react'
import { usePersistedContent } from '@/lib/usePersistedContent'
import Link from 'next/link'

// ── Types ─────────────────────────────────────────────────────────────────────

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
  electionDate:     string
  registeredVoters: number
  expectedTurnout:  number
  gopBase:          number
  raceType:         'two-way' | 'three-way' | 'four-way'
  conversionRate:   number
  isEstimated:      boolean  // true = using placeholder numbers, not confirmed
}

// ── Constants ─────────────────────────────────────────────────────────────────

const WIN_THRESHOLD: Record<VictoryPlan['raceType'], number> = {
  'two-way':   50,
  'three-way': 35,
  'four-way':  28,
}

// Sensible defaults by race level — candidates can confirm/adjust later
const RACE_DEFAULTS: Record<string, { voters: number; turnout: number; gopBase: number }> = {
  federal:   { voters: 500_000, turnout: 55, gopBase: 47 },
  state:     { voters: 60_000,  turnout: 45, gopBase: 46 },
  county:    { voters: 30_000,  turnout: 38, gopBase: 48 },
  municipal: { voters: 8_000,   turnout: 25, gopBase: 45 },
}

const DEFAULT_PLAN: VictoryPlan = {
  electionDate:     '',
  registeredVoters: 0,
  expectedTurnout:  45,
  gopBase:          46,
  raceType:         'two-way',
  conversionRate:   15,
  isEstimated:      true,
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) { return Math.round(n).toLocaleString() }

function daysUntil(dateStr: string): number {
  if (!dateStr) return 0
  return Math.max(0, Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000))
}

// ── Sub-components ────────────────────────────────────────────────────────────

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

function StatBox({ label, value, sub, accent, estimated }: {
  label: string; value: string; sub?: string; accent: string; estimated?: boolean
}) {
  return (
    <div className={`bg-white rounded-2xl border-2 ${accent} shadow-sm p-5`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{label}</p>
        {estimated && (
          <span className="text-[9px] font-bold uppercase tracking-wider text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded-full">Est.</span>
        )}
      </div>
      <p className="font-display text-3xl font-black text-navy leading-none">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

function SliderField({
  label, hint, value, min, max, step = 1, unit = '%', onChange,
}: {
  label: string; hint?: string; value: number; min: number; max: number
  step?: number; unit?: string; onChange: (v: number) => void
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-black uppercase tracking-widest text-gray-500">{label}</label>
        <span className="text-sm font-black text-navy">{value.toLocaleString()}{unit}</span>
      </div>
      {hint && <p className="text-[11px] text-gray-400 mb-2 leading-relaxed">{hint}</p>}
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

// ── Main component ────────────────────────────────────────────────────────────

export default function VictoryCalculator({
  candidate, totalContacts, totalVoters, totalRaised,
}: {
  candidate:     Candidate
  totalContacts: number
  totalVoters:   number
  totalRaised:   number
}) {
  const [plan, savePlan, { loading: planLoading }] = usePersistedContent<VictoryPlan>('victory-plan', DEFAULT_PLAN)
  const [editing,  setEditing]  = useState(false)
  const [draft,    setDraft]    = useState<VictoryPlan>(DEFAULT_PLAN)
  const [step,     setStep]     = useState<1 | 2>(1) // setup wizard step

  // Auto-open setup only after data loads and only if no election date is saved
  useEffect(() => {
    if (!planLoading && !plan.electionDate) { setEditing(true); setStep(1) }
  }, [planLoading, plan.electionDate])

  const raceLevel = (candidate?.raceLevel ?? 'state').toLowerCase()
  const levelDefaults = RACE_DEFAULTS[raceLevel] ?? RACE_DEFAULTS.state

  function openEdit() {
    setDraft({ ...plan })
    setStep(1)
    setEditing(true)
  }

  function applyEstimates() {
    setDraft(d => ({
      ...d,
      registeredVoters: levelDefaults.voters,
      expectedTurnout:  levelDefaults.turnout,
      gopBase:          levelDefaults.gopBase,
      isEstimated:      true,
    }))
  }

  function saveEdit() {
    // If no registeredVoters entered, silently apply level estimates
    const final: VictoryPlan = {
      ...draft,
      registeredVoters: draft.registeredVoters > 0 ? draft.registeredVoters : levelDefaults.voters,
      isEstimated: draft.registeredVoters === 0 || draft.isEstimated,
    }
    savePlan(final)
    setEditing(false)
  }

  // ── Electoral math ────────────────────────────────────────────────────────
  const voters          = plan.registeredVoters > 0 ? plan.registeredVoters : levelDefaults.voters
  const expectedVotes   = Math.round(voters * (plan.expectedTurnout / 100))
  const threshold       = WIN_THRESHOLD[plan.raceType]
  const winNumber       = Math.floor(expectedVotes * (threshold / 100)) + 1
  const gopBaseVotes    = Math.round(expectedVotes * (plan.gopBase / 100))
  const persuadable     = Math.max(0, winNumber - gopBaseVotes)
  const contactsNeeded  = plan.conversionRate > 0 ? Math.round(persuadable / (plan.conversionRate / 100)) : 0
  const days            = daysUntil(plan.electionDate)
  const dailyTarget     = days > 0 ? Math.ceil(contactsNeeded / days) : contactsNeeded
  const weeksLeft       = Math.floor(days / 7)
  const isEst           = plan.isEstimated || plan.registeredVoters === 0

  const geo = (() => {
    const level = raceLevel
    if (level === 'federal'   && candidate?.district) return `${candidate.state} CD-${candidate.district}`
    if (level === 'state'     && candidate?.district) return `${candidate.state} District ${candidate.district}`
    if (level === 'county'    && candidate?.county)   return `${candidate.county} County`
    if (level === 'municipal' && candidate?.city)     return candidate.city
    return candidate?.state ?? 'your district'
  })()

  const electionDateLabel = plan.electionDate
    ? new Date(plan.electionDate + 'T12:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : null

  // ── Preview math for setup modal ─────────────────────────────────────────
  const previewVoters = draft.registeredVoters > 0 ? draft.registeredVoters : levelDefaults.voters
  const pev  = Math.round(previewVoters * (draft.expectedTurnout / 100))
  const pwn  = Math.floor(pev * (WIN_THRESHOLD[draft.raceType] / 100)) + 1
  const pgb  = Math.round(pev * (draft.gopBase / 100))
  const ppt  = Math.max(0, pwn - pgb)
  const ptc  = draft.conversionRate > 0 ? Math.round(ppt / (draft.conversionRate / 100)) : 0
  const pd   = daysUntil(draft.electionDate)

  return (
    <div className="space-y-8">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
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
          <p className="text-blue-200 text-lg max-w-xl mb-2">
            Know your win number. Know your daily targets. Know exactly where you stand.
          </p>
          {candidate && (
            <p className="text-gold-400 font-bold text-sm mb-6">{candidate.name} · {candidate.race} · {geo}</p>
          )}
          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={openEdit}
              className="bg-gold-400 hover:bg-gold-500 text-navy font-black px-8 py-3 rounded-xl text-sm tracking-widest uppercase transition-colors focus:outline-none focus:ring-2 focus:ring-white">
              {plan.electionDate ? '✎ Edit Plan' : '⚡ Set Up Your Victory Plan'}
            </button>
            {isEst && plan.electionDate && (
              <span className="text-amber-300 text-xs font-bold bg-amber-500/20 px-3 py-1.5 rounded-full">
                ⚠ Using estimated numbers — confirm when ready
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── No election date yet ─────────────────────────────────────────── */}
      {!plan.electionDate && !editing && (
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 py-16 text-center">
          <p className="text-4xl mb-4 opacity-30">🗳</p>
          <p className="text-gray-600 font-semibold">No victory plan yet.</p>
          <p className="text-gray-400 text-sm mt-1 mb-6 max-w-xs mx-auto">
            All you need to start is your election date — everything else uses proven baseline targets you can refine later.
          </p>
          <button onClick={openEdit}
            className="bg-navy text-white font-black px-8 py-3 rounded-xl text-sm uppercase tracking-widest hover:bg-navy-700 transition-colors">
            ⚡ Get Started
          </button>
        </div>
      )}

      {/* ── Main content (shown once we have election date) ───────────────── */}
      {plan.electionDate && (
        <>
          {/* Estimated data warning */}
          {isEst && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <span className="text-amber-500 text-lg shrink-0 mt-0.5">⚠</span>
              <div>
                <p className="text-sm font-bold text-amber-800">Numbers are estimated</p>
                <p className="text-xs text-amber-600 mt-0.5">
                  These are typical GOP district figures for a {raceLevel}-level race. Once you know your exact registered voter count and historical turnout, update your plan for precise targets.{' '}
                  <button onClick={openEdit} className="underline font-semibold">Update now</button>
                </p>
              </div>
            </div>
          )}

          {/* Election countdown */}
          <div className={`rounded-2xl px-6 py-4 flex items-center justify-between gap-4 ${days <= 30 ? 'bg-red-500' : days <= 90 ? 'bg-yellow-500' : 'bg-navy'}`}>
            <div>
              <p className="text-white/70 text-xs font-black uppercase tracking-widest">Election Day</p>
              <p className="text-white font-display text-xl font-black mt-0.5">{electionDateLabel}</p>
            </div>
            <div className="text-right">
              <p className="font-display text-5xl font-black text-white leading-none">{days}</p>
              <p className="text-white/70 text-xs font-black uppercase tracking-widest mt-1">days left · {weeksLeft}w</p>
            </div>
          </div>

          {/* Key numbers */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatBox label="Win Number"       value={fmt(winNumber)}    sub={`${threshold}%+ of expected turnout`}             accent="border-red-200"    estimated={isEst} />
            <StatBox label="GOP Base Votes"   value={fmt(gopBaseVotes)} sub={`${plan.gopBase}% of ${fmt(expectedVotes)} voters`} accent="border-blue-100"   estimated={isEst} />
            <StatBox label="Votes Needed"     value={fmt(persuadable)}  sub="from persuadable voters"                          accent="border-yellow-200" estimated={isEst} />
            <StatBox label="Days Remaining"   value={String(days)}      sub={weeksLeft > 0 ? `${weeksLeft} weeks left` : 'Final stretch!'} accent={days <= 30 ? 'border-red-300' : 'border-green-100'} />
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
                    {isEst && <p className="text-[10px] text-amber-500 mt-1">estimated</p>}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-500 flex items-center gap-2">🚪 Doors to knock</span>
                      <span className="font-black text-navy">{fmt(dailyTarget * 0.6)}/day</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-500 flex items-center gap-2">📞 Calls to make</span>
                      <span className="font-black text-navy">{fmt(dailyTarget * 0.3)}/day</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-500 flex items-center gap-2">💬 Texts to send</span>
                      <span className="font-black text-navy">{fmt(dailyTarget * 0.1)}/day</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-400 text-center">Typical 60/30/10 door:phone:text split</p>
                </div>
              </div>
            </div>

            {/* Outreach progress */}
            <div className="bg-white rounded-2xl border-2 border-navy-100 shadow-sm overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-navy to-blue-500" />
              <div className="p-6">
                <h2 className="text-xs font-black uppercase tracking-[0.25em] text-gray-400 mb-5">Outreach Progress</h2>
                <div className="space-y-5">
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <p className="text-xs font-bold text-gray-500">Contacts Logged</p>
                      <p className="font-display text-2xl font-black text-navy">{fmt(totalContacts)}<span className="text-sm text-gray-400 font-normal"> / {fmt(contactsNeeded)}</span></p>
                    </div>
                    <Gauge value={totalContacts} max={contactsNeeded} color="bg-gradient-to-r from-navy to-blue-500" />
                  </div>
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <p className="text-xs font-bold text-gray-500">Voter File Loaded</p>
                      <p className="font-display text-2xl font-black text-navy">{fmt(totalVoters)}</p>
                    </div>
                    <Gauge value={totalVoters} max={voters} color="bg-gradient-to-r from-gold-400 to-yellow-500" />
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

            {/* Victory math breakdown */}
            <div className="bg-white rounded-2xl border-2 border-gold-200 shadow-sm overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-gold-400 to-yellow-500" />
              <div className="p-6">
                <h2 className="text-xs font-black uppercase tracking-[0.25em] text-gray-400 mb-5">Victory Math</h2>
                <div className="space-y-3">
                  {[
                    { label: 'Registered voters',            value: fmt(voters),         note: isEst ? 'estimated' : 'confirmed',          highlight: false },
                    { label: `Turnout (${plan.expectedTurnout}%)`,   value: fmt(expectedVotes),  note: 'likely voters',                   highlight: false },
                    { label: `Win threshold (${threshold}%+)`,       value: fmt(winNumber),      note: 'votes needed to win ✓',           highlight: true  },
                    { label: `GOP base (${plan.gopBase}%)`,          value: fmt(gopBaseVotes),   note: 'solid Republican votes',          highlight: false },
                    { label: 'Persuadables needed',          value: fmt(persuadable),    note: 'votes to earn',                           highlight: true  },
                    { label: `At ${plan.conversionRate}% conversion`, value: fmt(contactsNeeded), note: 'total contacts needed',          highlight: false },
                    { label: `Over ${days} days`,            value: `${fmt(dailyTarget)}/day`, note: 'daily target',                    highlight: true  },
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

          {/* Turnout scenarios */}
          <div className="bg-white rounded-2xl border-2 border-navy-100 shadow-sm overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-navy to-gold-400" />
            <div className="p-6">
              <h2 className="text-xs font-black uppercase tracking-[0.25em] text-gray-400 mb-4">Turnout Scenarios</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                {[-10, 0, +10].map(delta => {
                  const t  = Math.max(10, Math.min(90, plan.expectedTurnout + delta))
                  const v  = Math.round(voters * (t / 100))
                  const wn = Math.floor(v * (threshold / 100)) + 1
                  const gb = Math.round(v * (plan.gopBase / 100))
                  const nd = Math.max(0, wn - gb)
                  const ct = plan.conversionRate > 0 ? Math.round(nd / (plan.conversionRate / 100)) : 0
                  const style = delta < 0 ? 'border-blue-100' : delta > 0 ? 'border-red-100' : 'border-gold-200 bg-gold-50'
                  const label = delta < 0 ? 'Low Turnout' : delta > 0 ? 'High Turnout' : 'Expected'
                  return (
                    <div key={delta} className={`rounded-xl border-2 p-4 ${style}`}>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">{label} ({t}%)</p>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs"><span className="text-gray-500">Total votes</span><span className="font-bold text-navy">{fmt(v)}</span></div>
                        <div className="flex justify-between text-xs"><span className="text-gray-500">Win number</span><span className="font-bold text-red-600">{fmt(wn)}</span></div>
                        <div className="flex justify-between text-xs"><span className="text-gray-500">Persuadables</span><span className="font-bold text-navy">{fmt(nd)}</span></div>
                        <div className="flex justify-between text-xs font-black pt-1 border-t border-gray-100"><span className="text-gray-600">Contacts needed</span><span className="text-navy">{fmt(ct)}</span></div>
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
              { href: '/voters',      icon: '🗳', label: 'Voter File',   desc: `${fmt(totalVoters)} voters loaded` },
              { href: '/outreach',    icon: '📞', label: 'Log Contacts', desc: `${fmt(totalContacts)} logged so far` },
              { href: '/legislative', icon: '💰', label: 'Fundraising',  desc: `$${totalRaised >= 1000 ? `${(totalRaised / 1000).toFixed(1)}k` : fmt(totalRaised)} raised` },
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

      {/* ── Setup / Edit Modal ────────────────────────────────────────────── */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => plan.electionDate && setEditing(false)}>
          <div className="absolute inset-0 bg-navy/70 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="h-1.5 bg-gradient-to-r from-red-500 to-gold-400" />

            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="font-display font-black text-navy uppercase tracking-wide text-sm">
                  {step === 1 ? 'Step 1 of 2 — The Basics' : 'Step 2 of 2 — Your Numbers'}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {step === 1
                    ? 'Just your election date and race type to get started'
                    : "Optional — we'll use typical GOP district numbers if you're not sure yet"}
                </p>
              </div>
              {plan.electionDate && (
                <button onClick={() => setEditing(false)} className="text-xl text-gray-300 hover:text-navy transition-colors leading-none">✕</button>
              )}
            </div>

            <div className="p-6 space-y-6">

              {/* ── STEP 1 ──────────────────────────────────────────── */}
              {step === 1 && (
                <>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">
                      Election Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={draft.electionDate}
                      onChange={e => setDraft(d => ({ ...d, electionDate: e.target.value }))}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Race Type</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['two-way', 'three-way', 'four-way'] as const).map(rt => (
                        <button key={rt} onClick={() => setDraft(d => ({ ...d, raceType: rt }))}
                          className={`py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border-2 transition-all ${
                            draft.raceType === rt ? 'bg-navy text-white border-navy' : 'border-gray-200 text-gray-400 hover:border-navy hover:text-navy'
                          }`}>
                          {rt.replace('-', ' ')}
                          <span className="block text-[9px] opacity-60 normal-case font-normal mt-0.5">{WIN_THRESHOLD[rt]}%+ to win</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Step 1 CTA */}
                  <div className="space-y-2 pt-2">
                    <button
                      onClick={() => { setStep(2); applyEstimates() }}
                      disabled={!draft.electionDate}
                      className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-black uppercase tracking-widest py-3 rounded-xl text-sm transition-colors"
                    >
                      Next: Your Numbers →
                    </button>
                    <button
                      onClick={saveEdit}
                      disabled={!draft.electionDate}
                      className="w-full border-2 border-gray-200 text-gray-500 hover:text-navy hover:border-navy disabled:opacity-50 font-bold py-2.5 rounded-xl text-xs transition-colors"
                    >
                      Skip — use typical estimates for now
                    </button>
                  </div>
                </>
              )}

              {/* ── STEP 2 ──────────────────────────────────────────── */}
              {step === 2 && (
                <>
                  {/* Estimates notice */}
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700 leading-relaxed">
                    <strong>Not sure about these numbers?</strong> That's OK. We've pre-filled typical GOP district figures for a {raceLevel}-level race.
                    You can come back and update any field once you have real data.
                    Good sources: your county clerk's office, state SOS website, or your state GOP.
                  </div>

                  {/* Registered voters */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-1.5">
                      Registered Voters in Your Universe
                    </label>
                    <p className="text-[11px] text-gray-400 mb-2">
                      Total registered voters in your district. Find this at your county clerk or state SOS website.
                    </p>
                    <input
                      type="number"
                      value={draft.registeredVoters || ''}
                      onChange={e => setDraft(d => ({ ...d, registeredVoters: parseInt(e.target.value) || 0, isEstimated: !e.target.value }))}
                      placeholder={`~${levelDefaults.voters.toLocaleString()} (typical for ${raceLevel} race)`}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
                    />
                  </div>

                  <SliderField
                    label="Expected Turnout"
                    hint="What % of registered voters are likely to vote? Check historical results from your county for similar elections."
                    value={draft.expectedTurnout} min={15} max={90}
                    onChange={v => setDraft(d => ({ ...d, expectedTurnout: v }))}
                  />

                  <SliderField
                    label="GOP Base Performance"
                    hint="What % of total expected votes are solid Republican? Check past presidential or top-of-ticket results in your district."
                    value={draft.gopBase} min={10} max={65}
                    onChange={v => setDraft(d => ({ ...d, gopBase: v }))}
                  />

                  <SliderField
                    label="Contact → Vote Conversion"
                    hint="What % of voter contacts you make result in a confirmed vote? Typical first-time campaigns see 10–20%."
                    value={draft.conversionRate} min={5} max={35}
                    onChange={v => setDraft(d => ({ ...d, conversionRate: v }))}
                  />

                  {/* Live preview */}
                  <div className="bg-gold-50 border-2 border-gold-200 rounded-xl px-5 py-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Preview</p>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { l: 'Win number',          v: fmt(pwn) },
                        { l: 'Persuadables needed', v: fmt(ppt) },
                        { l: 'Total contacts',      v: fmt(ptc) },
                        { l: 'Daily target',        v: pd > 0 ? `${fmt(Math.ceil(ptc / pd))}/day` : '—' },
                      ].map(({ l, v }) => (
                        <div key={l}>
                          <p className="text-[10px] text-gray-500">{l}</p>
                          <p className="font-display text-xl font-black text-red-600">{v}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep(1)}
                      className="border-2 border-gray-200 text-gray-500 hover:border-navy hover:text-navy font-bold py-3 px-4 rounded-xl text-sm transition-colors"
                    >
                      ← Back
                    </button>
                    <button
                      onClick={saveEdit}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white font-black uppercase tracking-widest py-3 rounded-xl text-sm transition-colors shadow-glow-red"
                    >
                      Save Victory Plan
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
