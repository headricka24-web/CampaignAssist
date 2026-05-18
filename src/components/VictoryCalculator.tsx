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
  district:  string | null
  county:    string | null
  city:      string | null
} | null

type VictoryPlan = {
  electionDate:     string
  raceType:         'two-way' | 'three-way' | 'four-way'
  registeredVoters: number
  expectedTurnout:  number
  gopBase:          number
  conversionRate:   number
  dataSource:       string
  analysis:         string
}

type Prefill = {
  registeredVoters: number | null
  turnout:          number
  gopBase:          number
  analysis:         string
  source:           string
}

// ── Constants ─────────────────────────────────────────────────────────────────

const WIN_THRESHOLD: Record<VictoryPlan['raceType'], number> = {
  'two-way':   50,
  'three-way': 35,
  'four-way':  28,
}

const FALLBACK: Record<string, { voters: number; turnout: number; gopBase: number }> = {
  federal:   { voters: 500_000, turnout: 55, gopBase: 47 },
  state:     { voters: 750_000, turnout: 52, gopBase: 47 },
  county:    { voters: 30_000,  turnout: 38, gopBase: 48 },
  municipal: { voters: 8_000,   turnout: 25, gopBase: 45 },
}

const DEFAULT_PLAN: VictoryPlan = {
  electionDate:     '',
  raceType:         'two-way',
  registeredVoters: 0,
  expectedTurnout:  45,
  gopBase:          46,
  conversionRate:   15,
  dataSource:       '',
  analysis:         '',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) { return Math.round(n).toLocaleString() }

function daysUntil(dateStr: string): number {
  if (!dateStr) return 0
  const d = new Date(dateStr + 'T12:00:00Z')
  if (isNaN(d.getTime())) return 0
  return Math.max(0, Math.ceil((d.getTime() - Date.now()) / 86_400_000))
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

function StatBox({ label, value, sub, accent }: {
  label: string; value: string; sub?: string; accent: string
}) {
  return (
    <div className={`bg-white rounded-2xl border-2 ${accent} shadow-sm p-5`}>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">{label}</p>
      <p className="font-display text-3xl font-black text-navy leading-none">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
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
  const [editing,    setEditing]    = useState(false)
  const [date,       setDate]       = useState('')
  const [raceType,   setRaceType]   = useState<VictoryPlan['raceType']>('two-way')
  const [fetching,   setFetching]   = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [fetchError, setFetchError] = useState('')

  useEffect(() => {
    if (!planLoading && !plan.electionDate) setEditing(true)
  }, [planLoading, plan.electionDate])

  const raceLevel     = (candidate?.raceLevel ?? 'state').toLowerCase()
  const levelFallback = FALLBACK[raceLevel] ?? FALLBACK.state

  async function fetchPrefill(): Promise<Prefill | null> {
    try {
      const res  = await fetch('/api/victory/prefill')
      const data = await res.json()
      if (data.error) return null
      return data as Prefill
    } catch {
      return null
    }
  }

  async function handleSave() {
    if (!date) return
    setFetching(true)
    setFetchError('')
    const pf = await fetchPrefill()
    const saved: VictoryPlan = {
      electionDate:     date,
      raceType,
      registeredVoters: pf?.registeredVoters ?? levelFallback.voters,
      expectedTurnout:  pf?.turnout          ?? levelFallback.turnout,
      gopBase:          pf?.gopBase           ?? levelFallback.gopBase,
      conversionRate:   plan.conversionRate,
      dataSource:       pf?.source ?? 'Estimated from race-level historical averages.',
      analysis:         pf?.analysis ?? '',
    }
    await savePlan(saved)
    setFetching(false)
    setEditing(false)
  }

  async function handleRefresh() {
    setRefreshing(true)
    setFetchError('')
    const pf = await fetchPrefill()
    if (pf) {
      await savePlan({
        ...plan,
        registeredVoters: pf.registeredVoters ?? plan.registeredVoters,
        expectedTurnout:  pf.turnout,
        gopBase:          pf.gopBase,
        dataSource:       pf.source,
        analysis:         pf.analysis,
      })
    } else {
      setFetchError('Could not refresh — check your connection.')
    }
    setRefreshing(false)
  }

  function openEdit() {
    setDate(plan.electionDate)
    setRaceType(plan.raceType)
    setFetchError('')
    setEditing(true)
  }

  // ── Electoral math ──────────────────────────────────────────────────────────
  const voters        = plan.registeredVoters > 0 ? plan.registeredVoters : levelFallback.voters
  const expectedVotes = Math.round(voters * (plan.expectedTurnout / 100))
  const threshold     = WIN_THRESHOLD[plan.raceType]
  const winNumber     = Math.floor(expectedVotes * (threshold / 100)) + 1
  const gopBaseVotes  = Math.round(expectedVotes * (plan.gopBase / 100))
  const persuadable   = Math.max(0, winNumber - gopBaseVotes)
  const contactsNeeded = plan.conversionRate > 0 ? Math.round(persuadable / (plan.conversionRate / 100)) : 0
  const days           = daysUntil(plan.electionDate)
  const dailyTarget    = days > 0 ? Math.ceil(contactsNeeded / days) : contactsNeeded
  const weeksLeft      = Math.floor(days / 7)

  const geo = (() => {
    if (raceLevel === 'federal'   && candidate?.district) return `${candidate.state} CD-${candidate.district}`
    if (raceLevel === 'state'     && candidate?.district) return `${candidate.state} District ${candidate.district}`
    if (raceLevel === 'county'    && candidate?.county)   return `${candidate.county} County`
    if (raceLevel === 'municipal' && candidate?.city)     return candidate.city
    return candidate?.state ?? 'your district'
  })()

  const electionDateLabel = plan.electionDate
    ? new Date(plan.electionDate + 'T12:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : null

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
              className="bg-gold-400 hover:bg-gold-500 text-navy font-black px-8 py-3 rounded-xl text-sm tracking-widest uppercase transition-colors">
              {plan.electionDate ? '✎ Edit Election Date' : '⚡ Set Your Election Date'}
            </button>
            {plan.electionDate && (
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 text-white/60 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-40"
              >
                {refreshing
                  ? <><span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" /> Refreshing…</>
                  : '↺ Refresh Data'
                }
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── No election date yet ──────────────────────────────────────────── */}
      {!plan.electionDate && !editing && (
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 py-16 text-center">
          <p className="text-4xl mb-4 opacity-30">🗳</p>
          <p className="text-gray-600 font-semibold">No victory plan yet.</p>
          <p className="text-gray-400 text-sm mt-1 mb-6 max-w-xs mx-auto">
            Enter your election date and we&apos;ll build your win number from Census data and voting history.
          </p>
          <button onClick={openEdit}
            className="bg-navy text-white font-black px-8 py-3 rounded-xl text-sm uppercase tracking-widest hover:bg-navy-700 transition-colors">
            ⚡ Get Started
          </button>
        </div>
      )}

      {/* ── Main content ──────────────────────────────────────────────────── */}
      {plan.electionDate && (
        <>
          {/* Data source attribution */}
          {plan.dataSource && (
            <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
              <span className="text-blue-400 text-base shrink-0 mt-0.5">📊</span>
              <div>
                {plan.analysis && <p className="text-xs font-semibold text-blue-800 mb-0.5">{plan.analysis}</p>}
                <p className="text-[11px] text-blue-500 leading-relaxed">{plan.dataSource}</p>
              </div>
              {fetchError && <p className="text-xs text-red-500 ml-auto shrink-0">{fetchError}</p>}
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
            <StatBox label="Win Number"     value={fmt(winNumber)}    sub={`${threshold}%+ of expected turnout`}              accent="border-red-200"    />
            <StatBox label="GOP Base Votes" value={fmt(gopBaseVotes)} sub={`${plan.gopBase}% of ${fmt(expectedVotes)} voters`} accent="border-blue-100"   />
            <StatBox label="Votes Needed"   value={fmt(persuadable)}  sub="from persuadable voters"                           accent="border-yellow-200" />
            <StatBox label="Days Remaining" value={String(days)}      sub={weeksLeft > 0 ? `${weeksLeft} weeks left` : 'Final stretch!'} accent={days <= 30 ? 'border-red-300' : 'border-green-100'} />
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
                    { label: 'Registered voters',                    value: fmt(voters),          note: 'from Census ACS data',            highlight: false },
                    { label: `Turnout (${plan.expectedTurnout}%)`,   value: fmt(expectedVotes),   note: 'likely voters',                   highlight: false },
                    { label: `Win threshold (${threshold}%+)`,       value: fmt(winNumber),       note: 'votes needed to win ✓',           highlight: true  },
                    { label: `GOP base (${plan.gopBase}%)`,          value: fmt(gopBaseVotes),    note: 'solid Republican votes',          highlight: false },
                    { label: 'Persuadables needed',                  value: fmt(persuadable),     note: 'votes to earn',                   highlight: true  },
                    { label: `At ${plan.conversionRate}% conversion`,value: fmt(contactsNeeded),  note: 'total contacts needed',           highlight: false },
                    { label: `Over ${days} days`,                    value: `${fmt(dailyTarget)}/day`, note: 'daily target',              highlight: true  },
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
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="h-1.5 bg-gradient-to-r from-red-500 to-gold-400" />

            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="font-display font-black text-navy uppercase tracking-wide text-sm">
                  Your Election Date
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  We&apos;ll pull registered voters, turnout, and party data automatically.
                </p>
              </div>
              {plan.electionDate && (
                <button onClick={() => setEditing(false)} className="text-xl text-gray-300 hover:text-navy transition-colors leading-none">✕</button>
              )}
            </div>

            <div className="p-6 space-y-6">

              {/* Election date */}
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">
                  Election Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
                />
              </div>

              {/* Race type */}
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Race Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['two-way', 'three-way', 'four-way'] as const).map(rt => (
                    <button key={rt} onClick={() => setRaceType(rt)}
                      className={`py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border-2 transition-all ${
                        raceType === rt ? 'bg-navy text-white border-navy' : 'border-gray-200 text-gray-400 hover:border-navy hover:text-navy'
                      }`}>
                      {rt.replace('-', ' ')}
                      <span className="block text-[9px] opacity-60 normal-case font-normal mt-0.5">{WIN_THRESHOLD[rt]}%+ to win</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* What we'll fetch */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-wide text-blue-600 mb-2">We&apos;ll automatically pull:</p>
                <ul className="space-y-1">
                  {[
                    'Registered voters from 2023 Census ACS data',
                    'Historical turnout for your race type & geography',
                    'GOP base performance from 2018–2024 election results',
                  ].map(item => (
                    <li key={item} className="flex items-center gap-2 text-[11px] text-blue-700">
                      <span className="text-blue-400">✓</span> {item}
                    </li>
                  ))}
                </ul>
              </div>

              {fetchError && <p className="text-xs text-red-500">{fetchError}</p>}

              <button
                onClick={handleSave}
                disabled={!date || fetching}
                className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-black uppercase tracking-widest py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
              >
                {fetching
                  ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Pulling data…</>
                  : '⚡ Build My Victory Plan'
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
