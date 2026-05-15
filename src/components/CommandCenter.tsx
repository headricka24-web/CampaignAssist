'use client'

import Link from 'next/link'
import CampaignTimeline from './CampaignTimeline'
import { useState, useEffect } from 'react'

// ── Suggested Actions Widget ──────────────────────────────────────────────────

function SuggestedActionsWidget() {
  const [actions, setActions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [open,    setOpen]    = useState(false)

  useEffect(() => {
    fetch('/api/suggested-actions')
      .then(r => r.json())
      .then(d => { if (d.actions?.length) setActions(d.actions) })
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      {/* ── Notebook button (stays in hero) ── */}
      <button
        onClick={() => setOpen(true)}
        className="group relative w-52 rounded-2xl overflow-hidden text-left transition-all duration-200 hover:scale-[1.02]"
        style={{ background: 'rgba(4,14,31,0.80)', border: '1.5px solid rgba(212,160,23,0.4)', backdropFilter: 'blur(6px)' }}
      >
        {/* Binding strip */}
        <div className="h-1.5 bg-gradient-to-r from-gold-400 via-gold-300/70 to-gold-400/20" />

        {/* Spiral holes */}
        <div className="flex items-center gap-[7px] px-4 py-2">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ background: '#040e1f', border: '1px solid rgba(212,160,23,0.35)', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.6)' }} />
          ))}
        </div>

        {/* Body */}
        <div className="px-4 pb-5 pt-1">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="text-3xl leading-none">📓</span>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
              </span>
              <span className="text-[9px] font-black uppercase tracking-widest text-green-400/80">Live</span>
            </div>
          </div>

          <p className="text-sm font-black text-white/90 leading-tight mb-1">Today's<br/>Recommended Actions</p>
          <p className="text-[11px] text-white/40 mb-4">
            {loading ? 'Generating…' : `${actions.length} priorities ready`}
          </p>

          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest transition-colors text-gold-400/60 group-hover:text-gold-400">
            Open notebook <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </div>
        </div>
      </button>

      {/* ── Slide-out panel from right ── */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        style={{ background: 'rgba(10,22,40,0.5)', backdropFilter: 'blur(2px)' }}
        onClick={() => setOpen(false)}
      />

      {/* Panel */}
      <div className={`fixed top-0 right-0 bottom-0 w-96 z-50 flex flex-col transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ background: '#050f20', borderLeft: '1px solid rgba(212,160,23,0.25)' }}>

        <div className="h-1 bg-gradient-to-r from-gold-400 via-gold-300/60 to-transparent" />

        {/* Panel header */}
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">📓</span>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.28em] text-gold-400">Today's Recommended Actions</p>
              <p className="text-[11px] text-white/35 mt-0.5">Based on today's intelligence brief</p>
            </div>
          </div>
          <button onClick={() => setOpen(false)}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all text-sm">
            ✕
          </button>
        </div>

        {/* Actions list */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          {loading ? (
            <div className="flex items-center gap-3 text-white/40">
              <span className="w-4 h-4 border-2 rounded-full animate-spin shrink-0"
                style={{ borderColor: 'rgba(212,160,23,0.3)', borderTopColor: '#e8b820' }} />
              <span className="text-sm">Generating your priorities…</span>
            </div>
          ) : actions.length === 0 ? (
            <p className="text-sm text-white/30">Run your first news scan to unlock personalized recommendations.</p>
          ) : actions.map((a, i) => (
            <div key={i} className="flex items-start gap-4">
              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[11px] font-black"
                style={{ background: 'rgba(212,160,23,0.15)', border: '1px solid rgba(212,160,23,0.4)', color: '#e8b820' }}>
                {i + 1}
              </div>
              <p className="text-sm text-white/75 leading-relaxed">{a}</p>
            </div>
          ))}
        </div>

        <div className="px-6 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-[10px] uppercase tracking-widest font-bold text-white/20">Refreshes daily · Powered by CampaignAssist AI</p>
        </div>
      </div>
    </>
  )
}

type Candidate = {
  name:      string
  race:      string
  state:     string
  raceLevel: string | null
  district:  string | null
  county:    string | null
  city:      string | null
}

// ── Department config ─────────────────────────────────────────────────────────

const DEPARTMENTS = [
  {
    name:    'Command',
    tagline: 'Overview & field strategy',
    from:    'from-red-700',
    to:      'to-red-950',
    glow:    'shadow-red-900/50',
    mark:    '★',
    links: [
      { href: '/dashboard', label: 'Dashboard',       desc: 'Overview & morning brief'   },
      { href: '/victory',   label: 'Path to Victory', desc: 'Win number & daily targets' },
    ],
  },
  {
    name:    'Intelligence',
    tagline: 'News, threats & voter insight',
    from:    'from-[#0f2744]',
    to:      'to-[#071a35]',
    glow:    'shadow-blue-900/50',
    mark:    '◉',
    links: [
      { href: '/war-room',     label: 'War Room',     desc: 'Threats & opposition'  },
      { href: '/briefing',     label: 'Hot Buttons',  desc: 'Issue briefing'        },
      { href: '/news',         label: 'News Feed',    desc: 'Live coverage scan'    },
      { href: '/constituents', label: 'Constituents', desc: 'Voter bloc profiles'   },
    ],
  },
  {
    name:    'Communications',
    tagline: 'Message, media & fundraising',
    from:    'from-indigo-800',
    to:      'to-indigo-950',
    glow:    'shadow-indigo-900/50',
    mark:    '✦',
    links: [
      { href: '/media',       label: 'Media Studio',   desc: 'Content & talking points' },
      { href: '/legislative', label: "Let's Fund",     desc: 'Fundraising letters'      },
      { href: '/press',       label: 'Press Contacts', desc: 'Media relationships'      },
    ],
  },
  {
    name:    'Field Ops',
    tagline: 'Outreach, voters & ground game',
    from:    'from-emerald-800',
    to:      'to-emerald-950',
    glow:    'shadow-emerald-900/50',
    mark:    '◎',
    links: [
      { href: '/outreach', label: 'Outreach', desc: 'Contacts, donors & events' },
      { href: '/voters',   label: 'Voters',   desc: 'Voter file management'     },
    ],
  },
  {
    name:    'Finance',
    tagline: 'Budget, income & expenses',
    from:    'from-amber-700',
    to:      'to-amber-950',
    glow:    'shadow-amber-900/50',
    mark:    '◆',
    links: [
      { href: '/budget',     label: 'Budget',     desc: 'Income, expenses & cash on hand'    },
      { href: '/compliance', label: 'Compliance', desc: 'Registration, rules & filing guide' },
    ],
  },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function lastName(fullName: string) {
  const parts = fullName.trim().split(/\s+/)
  return parts[parts.length - 1]
}

function geoLabel(c: Candidate) {
  const level = (c.raceLevel ?? '').toLowerCase()
  if (level === 'federal'   && c.district) return `${c.state} CD-${c.district}`
  if (level === 'state'     && c.district) return `${c.state} District ${c.district}`
  if (level === 'county'    && c.county)   return `${c.county} County, ${c.state}`
  if (level === 'municipal' && c.city)     return `${c.city}, ${c.state}`
  return c.state
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

// ── Department card ───────────────────────────────────────────────────────────

function DeptCard({ dept }: { dept: typeof DEPARTMENTS[number] }) {
  return (
    <div className={`relative rounded-2xl overflow-hidden bg-gradient-to-br ${dept.from} ${dept.to} shadow-xl ${dept.glow} group`}>
      {/* Stripe texture */}
      <div className="absolute inset-0 bg-stripe-pattern opacity-10 pointer-events-none" />

      {/* Faded watermark */}
      <div className="absolute bottom-2 right-3 text-white/5 text-[80px] font-black leading-none select-none pointer-events-none">
        {dept.mark}
      </div>

      {/* Header */}
      <div className="relative px-5 pt-5 pb-4">
        <p className="text-white/50 text-[10px] font-black uppercase tracking-[0.25em] mb-0.5">
          {dept.tagline}
        </p>
        <h3 className="text-white font-display font-black text-xl tracking-wide uppercase">
          {dept.name}
        </h3>
        <div className="h-px bg-white/15 mt-3" />
      </div>

      {/* Links */}
      <div className="relative px-2 pb-3 space-y-0.5">
        {dept.links.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/10 transition-colors group/link"
          >
            <div>
              <p className="text-white text-sm font-bold leading-none">{link.label}</p>
              <p className="text-white/45 text-[11px] mt-0.5">{link.desc}</p>
            </div>
            <span className="text-white/30 group-hover/link:text-white/70 transition-colors text-sm">→</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function CommandCenter({ candidate, electionDate }: { candidate: Candidate; electionDate: string }) {
  const last = lastName(candidate.name)
  const geo  = geoLabel(candidate)

  return (
    <div className="min-h-full -m-6">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="relative bg-[#0a1e38] overflow-hidden">
        <div className="absolute inset-0 bg-stripe-pattern opacity-20 pointer-events-none" />
        <div className="absolute top-6 right-[12%] text-white/[0.04] text-[220px] font-black leading-none select-none pointer-events-none">★</div>

        <div className="h-1.5 bg-red-gradient" />

        <div className="relative max-w-5xl mx-auto px-8 py-16 md:py-20">
          <div className="flex items-end gap-10">

            {/* ── Left: heading + CTAs ── */}
            <div className="flex-1 min-w-0">
              {/* Live pill */}
              <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-8">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse-slow" />
                <span className="text-green-400/80 text-[10px] font-black uppercase tracking-[0.3em]">Live · All Systems Online</span>
              </div>

              <h1 className="font-display font-black text-white text-4xl md:text-6xl leading-[1.1] mb-4">
                {greeting()}, Team <span className="text-gold-400">{last}.</span>
              </h1>

              <p className="text-blue-100/80 text-base md:text-lg font-medium mb-1">
                {candidate.name} &nbsp;·&nbsp; {candidate.race} &nbsp;·&nbsp; {geo}
              </p>
              <p className="text-blue-200/55 text-sm mb-10 max-w-xl">
                Your complete campaign intelligence platform — ready for battle.
              </p>

              <div className="flex items-center gap-4 flex-wrap">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-3 bg-red-600 hover:bg-red-700 text-white font-black text-sm uppercase tracking-widest px-8 py-3.5 rounded-xl shadow-glow-red transition-all"
                >
                  Enter Dashboard <span>→</span>
                </Link>
                <Link
                  href="/my-candidate"
                  className="inline-flex items-center gap-2 border border-white/25 hover:border-white/50 text-white/70 hover:text-white text-xs font-bold uppercase tracking-widest px-5 py-3.5 rounded-xl transition-all"
                >
                  ⚙ Campaign Settings
                </Link>
              </div>
            </div>

            {/* ── Right: Suggested Actions widget ── */}
            <div className="hidden lg:block shrink-0">
              <SuggestedActionsWidget />
            </div>

          </div>
        </div>

        <div className="h-1 bg-red-gradient opacity-60" />
        <div className="h-px bg-gold-gradient opacity-30" />
      </div>

      {/* ── Campaign Timeline ─────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-8 pt-8 pb-4">
        <CampaignTimeline electionDate={electionDate} />
      </div>

      {/* ── Shortcut grid ─────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-8 py-8">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-5">
          Quick Access — Select a Department
        </p>

        {/* Row 1: 3 cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          {DEPARTMENTS.slice(0, 3).map(dept => (
            <DeptCard key={dept.name} dept={dept} />
          ))}
        </div>

        {/* Row 2: 2 cards, spanning full width */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {DEPARTMENTS.slice(3).map(dept => (
            <DeptCard key={dept.name} dept={dept} />
          ))}
        </div>
      </div>
    </div>
  )
}
