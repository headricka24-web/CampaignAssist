'use client'

import Link from 'next/link'

type Candidate = {
  name:      string
  race:      string
  state:     string
  raceLevel: string | null
  district:  string | null
  county:    string | null
  city:      string | null
}

// ── Department shortcuts — mirrors sidebar exactly ────────────────────────────

const DEPARTMENTS = [
  {
    name:  'Command',
    color: 'border-red-200 hover:border-red-400',
    head:  'bg-red-500',
    links: [
      { href: '/dashboard', label: 'Dashboard',       desc: 'Overview & morning brief' },
      { href: '/victory',   label: 'Path to Victory', desc: 'Win number & field targets' },
    ],
  },
  {
    name:  'Intelligence',
    color: 'border-blue-200 hover:border-blue-400',
    head:  'bg-[#1e3a5f]',
    links: [
      { href: '/war-room',     label: 'War Room',     desc: 'Threats & opposition' },
      { href: '/briefing',     label: 'Hot Buttons',  desc: 'Issue briefing' },
      { href: '/news',         label: 'News Feed',    desc: 'Live coverage scan' },
      { href: '/constituents', label: 'Constituents', desc: 'Voter bloc profiles' },
    ],
  },
  {
    name:  'Communications',
    color: 'border-purple-200 hover:border-purple-400',
    head:  'bg-purple-700',
    links: [
      { href: '/media',       label: 'Media Studio',   desc: 'Content generation' },
      { href: '/legislative', label: "Let's Fund",     desc: 'Fundraising letters' },
      { href: '/press',       label: 'Press Contacts', desc: 'Media relationships' },
    ],
  },
  {
    name:  'Field Ops',
    color: 'border-emerald-200 hover:border-emerald-400',
    head:  'bg-emerald-700',
    links: [
      { href: '/outreach', label: 'Outreach', desc: 'Contacts, donors & events' },
      { href: '/voters',   label: 'Voters',   desc: 'Voter file management' },
    ],
  },
  {
    name:  'Finance',
    color: 'border-gold-200 hover:border-yellow-400',
    head:  'bg-yellow-600',
    links: [
      { href: '/budget', label: 'Budget', desc: 'Income, expenses & cash on hand' },
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

// ── Component ─────────────────────────────────────────────────────────────────

export default function CommandCenter({ candidate }: { candidate: Candidate }) {
  const last = lastName(candidate.name)
  const geo  = geoLabel(candidate)

  return (
    <div className="min-h-full -m-6">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="relative bg-[#0f2744] overflow-hidden">
        {/* Stripe texture */}
        <div className="absolute inset-0 bg-stripe-pattern opacity-20 pointer-events-none" />
        {/* Giant star watermark */}
        <div className="absolute inset-0 flex items-center justify-end pr-16 pointer-events-none select-none">
          <span className="text-white opacity-[0.04] text-[300px] font-black leading-none">★</span>
        </div>
        {/* Red top bar */}
        <div className="h-1.5 bg-red-gradient" />

        <div className="relative max-w-5xl mx-auto px-8 py-16 md:py-20">
          <p className="text-blue-300/60 text-xs font-black uppercase tracking-[0.3em] mb-3">
            {greeting()}, Team {last}
          </p>

          <h1 className="font-display font-black text-white text-5xl md:text-6xl leading-tight mb-2">
            Welcome to your
          </h1>
          <h2 className="font-display font-black text-5xl md:text-6xl leading-tight mb-6">
            <span className="text-gold-400">Campaign Command Center.</span>
          </h2>

          <p className="text-blue-200/70 text-lg mb-2 font-medium">
            {candidate.name} &nbsp;·&nbsp; {candidate.race} &nbsp;·&nbsp; {geo}
          </p>
          <p className="text-blue-300/40 text-sm mb-10">
            Everything your campaign needs — intelligence, comms, field ops, and finance — in one place.
          </p>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-3 bg-red-500 hover:bg-red-600 text-white font-black text-base uppercase tracking-widest px-10 py-4 rounded-xl shadow-glow-red transition-all focus:outline-none focus:ring-2 focus:ring-gold-400"
          >
            Enter Dashboard
            <span className="text-xl">→</span>
          </Link>
        </div>

        {/* Gold bottom line */}
        <div className="h-px bg-gold-gradient opacity-40" />
      </div>

      {/* ── Department shortcut grid ───────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-8 py-10">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-gray-400 mb-5">Quick Access</p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {DEPARTMENTS.map(dept => (
            <div
              key={dept.name}
              className={`bg-white rounded-2xl border-2 shadow-sm overflow-hidden transition-all ${dept.color}`}
            >
              {/* Card header */}
              <div className={`${dept.head} px-4 py-2.5`}>
                <p className="text-white text-[10px] font-black uppercase tracking-[0.25em]">{dept.name}</p>
              </div>

              {/* Links */}
              <div className="divide-y divide-gray-50">
                {dept.links.map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors group"
                  >
                    <div>
                      <p className="text-sm font-bold text-gray-800 group-hover:text-[#0f2744] transition-colors">
                        {link.label}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{link.desc}</p>
                    </div>
                    <span className="text-gray-300 group-hover:text-gray-500 transition-colors text-sm">→</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* My Candidate link */}
        <div className="mt-6 flex justify-center">
          <Link
            href="/my-candidate"
            className="text-xs text-gray-400 hover:text-gray-600 transition font-medium"
          >
            ⚙ Update candidate & race settings
          </Link>
        </div>
      </div>
    </div>
  )
}
