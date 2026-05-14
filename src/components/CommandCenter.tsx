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

export default function CommandCenter({ candidate }: { candidate: Candidate }) {
  const last = lastName(candidate.name)
  const geo  = geoLabel(candidate)

  return (
    <div className="min-h-full -m-6">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="relative bg-[#060f1e] overflow-hidden">
        <div className="absolute inset-0 bg-stripe-pattern opacity-15 pointer-events-none" />

        {/* Atmospheric background stars */}
        <div className="absolute -top-32 -right-16 text-white/[0.022] font-black leading-none select-none pointer-events-none" style={{fontSize:'680px'}}>★</div>
        <div className="absolute top-12 right-[20%] text-gold-400/[0.07] text-[110px] font-black leading-none select-none pointer-events-none">★</div>
        <div className="absolute bottom-8 left-[4%] text-white/[0.03] text-[180px] font-black leading-none select-none pointer-events-none">★</div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/[0.012] font-black leading-none select-none pointer-events-none" style={{fontSize:'900px'}}>★</div>

        <div className="h-1.5 bg-red-gradient" />

        <div className="relative max-w-5xl mx-auto px-8 pt-14 pb-10 md:pt-20 md:pb-14">

          {/* Status badges row */}
          <div className="flex flex-wrap items-center gap-2.5 mb-10">
            <div className="inline-flex items-center gap-2 bg-white/[0.05] border border-white/10 rounded-full px-3.5 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse-slow" />
              <span className="text-green-400/90 text-[9px] font-black uppercase tracking-[0.35em]">All Systems Online</span>
            </div>
            <div className="inline-flex items-center gap-1.5 bg-red-500/[0.12] border border-red-500/25 rounded-full px-3.5 py-1.5">
              <span className="text-red-400 text-[9px] font-black uppercase tracking-[0.3em]">★ Mission Active</span>
            </div>
            <div className="inline-flex items-center gap-1.5 bg-gold-400/[0.08] border border-gold-400/20 rounded-full px-3.5 py-1.5">
              <span className="text-gold-400/80 text-[9px] font-black uppercase tracking-[0.3em]">Campaign Intelligence Platform</span>
            </div>
          </div>

          {/* Greeting */}
          <p className="text-blue-400/35 text-xs font-black uppercase tracking-[0.55em] mb-4">
            — {greeting()} —
          </p>

          {/* BIG name headline */}
          <div className="mb-8">
            <h1 className="font-display font-black leading-none">
              <span className="block text-white/60 text-4xl md:text-6xl lg:text-7xl tracking-tight mb-1">Team</span>
              <span className="block text-gold-400 leading-[0.88]" style={{fontSize: 'clamp(68px, 12vw, 108px)'}}>{last}.</span>
            </h1>
          </div>

          {/* Race info */}
          <div className="flex items-center gap-3 flex-wrap mb-4">
            <span className="w-0.5 h-4 rounded-full bg-red-500 shrink-0" />
            <span className="text-white/75 font-semibold text-sm md:text-base">{candidate.name}</span>
            <span className="text-white/15 hidden sm:block">·</span>
            <span className="text-blue-300/45 text-sm md:text-base">{candidate.race}</span>
            <span className="text-white/15 hidden sm:block">·</span>
            <span className="text-blue-300/45 text-sm md:text-base">{geo}</span>
          </div>

          <p className="text-blue-400/30 text-sm mb-10 max-w-lg leading-relaxed">
            Your campaign intelligence platform is fully operational.<br className="hidden sm:block" />
            Every department is standing by and ready.
          </p>

          {/* CTAs */}
          <div className="flex items-center gap-4 flex-wrap mb-12">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-3 bg-red-600 hover:bg-red-500 text-white font-black text-sm uppercase tracking-widest px-9 py-4 rounded-xl shadow-glow-red transition-all hover:-translate-y-0.5 hover:shadow-2xl"
            >
              Enter Dashboard
              <span className="text-base">→</span>
            </Link>
            <Link
              href="/my-candidate"
              className="inline-flex items-center gap-2 border border-white/15 hover:border-white/35 text-white/45 hover:text-white/75 text-xs font-bold uppercase tracking-widest px-6 py-4 rounded-xl transition-all"
            >
              ⚙ Campaign Settings
            </Link>
          </div>

          {/* Department status strip */}
          <div className="border-t border-white/[0.05] pt-6">
            <p className="text-white/20 text-[9px] font-black uppercase tracking-[0.45em] mb-3">Department Status</p>
            <div className="flex flex-wrap gap-2">
              {[
                { name: 'Command',        color: 'text-red-400',     dot: 'bg-red-500'     },
                { name: 'Intelligence',   color: 'text-blue-400',    dot: 'bg-blue-500'    },
                { name: 'Communications', color: 'text-violet-400',  dot: 'bg-violet-500'  },
                { name: 'Field Ops',      color: 'text-emerald-400', dot: 'bg-emerald-500' },
                { name: 'Finance',        color: 'text-amber-400',   dot: 'bg-amber-500'   },
              ].map(d => (
                <div key={d.name} className="inline-flex items-center gap-1.5 bg-white/[0.04] border border-white/[0.07] rounded-full px-3 py-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${d.dot} animate-pulse-slow`} />
                  <span className={`text-[9px] font-black uppercase tracking-[0.18em] ${d.color}`}>{d.name}</span>
                  <span className="text-white/20 text-[8px] uppercase tracking-widest">Online</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bars */}
        <div className="h-1 bg-red-gradient opacity-60" />
        <div className="h-px bg-gold-gradient opacity-30" />
      </div>

      {/* ── Shortcut grid ─────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-8 py-10">
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
