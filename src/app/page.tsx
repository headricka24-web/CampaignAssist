import Link from 'next/link'
import { auth } from '@/auth'

export const dynamic = 'force-dynamic'

const PLAYBOOK = [
  {
    number: '01',
    phase: 'Know Your Battlefield',
    headline: 'Intelligence Before Action.',
    body: 'Every morning, AI scans hundreds of news sources and drops a classified brief on your desk. Track every story about your candidate, your opponent, and your district — classified, scored, and ranked by threat level.',
    tools: ['Morning Brief', 'News Intelligence', 'War Room Threat Scanner'],
    color: 'from-blue-600 to-blue-800',
    accent: 'bg-blue-500',
  },
  {
    number: '02',
    phase: 'Know Your Voters',
    headline: 'Data Wins Races.',
    body: 'Pull real Census Bureau demographics, BLS employment numbers, and FEC election history for your exact district. Upload your voter file and instantly know your GOTV targets, your persuadables, and your base.',
    tools: ['Constituent Profiles', 'Voter Intelligence', 'District Demographics'],
    color: 'from-red-600 to-red-800',
    accent: 'bg-red-500',
  },
  {
    number: '03',
    phase: 'Win the Race',
    headline: 'Execute With Precision.',
    body: 'Manage donors, volunteers, and contacts. Generate press releases, fundraising emails, and social copy in seconds. From first knock to election night — one dashboard runs it all.',
    tools: ['Campaign Outreach', 'Media Studio', 'Rapid Response'],
    color: 'from-yellow-500 to-gold-500',
    accent: 'bg-gold-400',
  },
]

const FEATURES = [
  { icon: '📰', title: 'News Intelligence',    blurb: 'Every story. Every outlet. Classified and scored in real time.' },
  { icon: '⚡', title: 'War Room',             blurb: 'AI rebuttals, talking points, and press statements in seconds.' },
  { icon: '🗳️', title: 'Voter Intelligence',   blurb: 'Segments, GOTV lists, and persuadables from your own voter file.' },
  { icon: '📋', title: 'Campaign Outreach',    blurb: 'Donors, volunteers, contacts — goals tracked and goals hit.' },
  { icon: '🗺️', title: 'Constituent Profiles', blurb: 'Real Census, BLS, and FEC data for your exact race geography.' },
  { icon: '🏛️', title: 'Media Studio',         blurb: 'Press releases, emails, and social copy on-demand.' },
  { icon: '🔥', title: 'Hot Button Briefing',  blurb: "Today's top issues and how to frame every single one." },
  { icon: '💰', title: "Let's Fund",           blurb: 'AI-written fundraising copy that actually converts.' },
]

const STATS = [
  { value: '6', label: 'AI-powered tools' },
  { value: '100+', label: 'sources monitored' },
  { value: '50+', label: 'Census data points' },
  { value: '1', label: 'dashboard to rule them all' },
]

export default async function LandingPage() {
  const session  = await auth()
  const loggedIn = !!session?.user

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">

      {/* ── Nav ── */}
      <header className="sticky top-0 z-40">
        <div className="h-1.5 bg-gradient-to-r from-red-600 via-white to-blue-700" />
        <nav className="bg-navy/95 backdrop-blur-sm border-b border-navy-500/50">
          <div className="container mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-red-gradient flex items-center justify-center text-lg font-bold text-white select-none shrink-0 shadow-glow-red">★</div>
              <div className="leading-tight">
                <span className="font-display font-bold text-xl tracking-widest uppercase text-white">
                  Campaign<span className="text-gold-400">Assist</span>
                </span>
                <p className="text-[9px] uppercase tracking-[0.2em] text-blue-300/70 -mt-0.5">Intelligence · Strategy · Victory</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {loggedIn ? (
                <Link href="/dashboard"
                  className="text-sm font-black uppercase tracking-widest bg-gold-400 hover:bg-gold-500 text-navy px-5 py-2 rounded-xl transition-colors">
                  Dashboard →
                </Link>
              ) : (
                <>
                  <Link href="/login"
                    className="text-sm font-bold text-blue-300 hover:text-white transition-colors px-4 py-2">
                    Log In
                  </Link>
                  <Link href="/signup"
                    className="text-sm font-black uppercase tracking-widest bg-gold-400 hover:bg-gold-500 text-navy px-5 py-2 rounded-xl transition-colors">
                    Get Started Free
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-hero-gradient min-h-[90vh] flex items-center">
        <div className="absolute inset-0 bg-stripe-pattern opacity-25" />

        {/* Giant background stars */}
        <div className="absolute -top-10 -right-10 text-white opacity-[0.03] text-[400px] font-black leading-none select-none pointer-events-none">★</div>
        <div className="absolute bottom-0 -left-20 text-white opacity-[0.02] text-[300px] font-black leading-none select-none pointer-events-none">★</div>

        {/* Star field */}
        <div className="absolute top-12 left-1/4 text-gold-400 opacity-20 text-3xl select-none">★</div>
        <div className="absolute top-24 right-1/3 text-white opacity-10 text-xl select-none">★</div>
        <div className="absolute bottom-20 right-1/4 text-gold-400 opacity-15 text-2xl select-none">★</div>
        <div className="absolute bottom-32 left-1/3 text-white opacity-10 text-lg select-none">★</div>

        <div className="relative container mx-auto max-w-7xl px-6 py-20">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 bg-red-500 text-white text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-8 shadow-glow-red">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              Now Live — AI Campaign Intelligence
            </div>

            <h1 className="font-display font-black text-white leading-[0.9] mb-8">
              <span className="block text-6xl md:text-8xl lg:text-[110px]">WIN</span>
              <span className="block text-4xl md:text-6xl lg:text-7xl text-gold-400">YOUR RACE.</span>
            </h1>

            <p className="text-blue-100 text-xl md:text-2xl max-w-2xl mb-4 leading-relaxed font-medium">
              The AI command center that gives every Republican campaign — from city council to U.S. Senate — the intelligence firepower of a top-tier operation.
            </p>
            <p className="text-blue-300/70 text-base mb-12">
              Real data. Real news. Real results. ★ Built for candidates who refuse to lose.
            </p>

            <div className="flex flex-wrap gap-4 items-center">
              {loggedIn ? (
                <Link href="/dashboard"
                  className="bg-gold-400 hover:bg-gold-500 text-navy font-black text-base uppercase tracking-widest px-10 py-4 rounded-xl transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5">
                  ★ Your Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/signup"
                    className="bg-gold-400 hover:bg-gold-500 text-navy font-black text-base uppercase tracking-widest px-10 py-4 rounded-xl transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5">
                    ★ Launch Your Campaign
                  </Link>
                  <Link href="/login"
                    className="border-2 border-white/20 hover:border-white/50 text-white font-bold text-sm px-8 py-4 rounded-xl transition-colors">
                    Sign In →
                  </Link>
                </>
              )}
            </div>
            {!loggedIn && <p className="text-blue-400/50 text-sm mt-4">Free to start. No credit card needed.</p>}
          </div>
        </div>
      </section>

      {/* ── Stats Banner ── */}
      <section className="bg-red-600 py-5">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="flex flex-wrap justify-center md:justify-between gap-6 md:gap-0 divide-y md:divide-y-0 md:divide-x divide-red-500">
            {STATS.map(s => (
              <div key={s.label} className="flex-1 min-w-[140px] text-center px-6 py-1">
                <div className="font-display font-black text-4xl text-white leading-none">{s.value}</div>
                <div className="text-red-200 text-xs uppercase tracking-widest font-bold mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Manifesto ── */}
      <section className="bg-navy py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-stripe-pattern opacity-10" />
        <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-[0.03] flex items-center justify-end pr-12 select-none pointer-events-none">
          <span className="text-white font-black" style={{ fontSize: '28rem', lineHeight: 1 }}>🦅</span>
        </div>
        <div className="relative container mx-auto max-w-4xl px-6 text-center">
          <div className="text-gold-400 text-3xl mb-6 tracking-widest">★ ★ ★</div>
          <h2 className="font-display font-black text-white text-4xl md:text-5xl leading-tight mb-6">
            The Best Candidates Deserve<br />
            <span className="text-gold-400">The Best Intelligence.</span>
          </h2>
          <p className="text-blue-200 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto mb-6">
            We built CampaignAssist so a first-time city council candidate has the same data firepower as a U.S. Senate operation. The playing field just got level. America deserves candidates who fight with everything they've got — and now you have the tools to do exactly that.
          </p>
          <p className="text-gold-400/80 font-black text-sm uppercase tracking-[0.3em]">
            Intelligence · Strategy · Victory · God Bless America
          </p>
        </div>
      </section>

      {/* ── The Playbook ── */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-navy text-gold-400 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
              ✦ The Winning Playbook
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-black text-navy">
              Three Phases. One Mission.
            </h2>
          </div>

          <div className="space-y-6">
            {PLAYBOOK.map((p) => (
              <div key={p.number} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className={`h-1.5 bg-gradient-to-r ${p.color}`} />
                <div className="p-8 flex flex-col md:flex-row gap-8 items-start">
                  <div className="shrink-0">
                    <div className={`font-display font-black text-7xl leading-none bg-gradient-to-br ${p.color} bg-clip-text text-transparent`}>
                      {p.number}
                    </div>
                    <div className="text-xs font-black uppercase tracking-widest text-gray-400 mt-1">{p.phase}</div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display font-black text-navy text-2xl mb-3">{p.headline}</h3>
                    <p className="text-gray-500 leading-relaxed mb-4">{p.body}</p>
                    <div className="flex flex-wrap gap-2">
                      {p.tools.map(t => (
                        <span key={t} className={`${p.accent} text-white text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full`}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section className="py-20 bg-white">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-black text-navy mb-3">
              Every Tool Your Campaign Needs
            </h2>
            <p className="text-gray-400 text-sm uppercase tracking-widest font-bold">All under one roof. All powered by AI.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {FEATURES.map(f => (
              <div key={f.title}
                className="group bg-gray-50 hover:bg-navy rounded-2xl p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg cursor-default border border-gray-100 hover:border-navy">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-black text-navy group-hover:text-gold-400 text-sm uppercase tracking-wide mb-1 transition-colors">{f.title}</h3>
                <p className="text-gray-400 group-hover:text-blue-200 text-xs leading-relaxed transition-colors">{f.blurb}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Battle Cry CTA ── */}
      <section className="relative overflow-hidden bg-hero-gradient py-24">
        <div className="absolute inset-0 bg-stripe-pattern opacity-20" />
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] select-none pointer-events-none">
          <span className="text-white font-black" style={{ fontSize: '32rem', lineHeight: 1 }}>★</span>
        </div>

        <div className="relative container mx-auto max-w-3xl px-6 text-center">
          <div className="text-gold-400 text-2xl mb-6">★ ★ ★ ★ ★</div>
          <h2 className="font-display text-5xl md:text-6xl font-black text-white mb-4 leading-tight">
            Ready to Fight?
          </h2>
          <p className="text-blue-200 text-xl mb-10 leading-relaxed">
            Create your account in 30 seconds and have your campaign intelligence dashboard live before lunch.
          </p>
          {loggedIn ? (
            <Link href="/dashboard"
              className="inline-block bg-gold-400 hover:bg-gold-500 text-navy font-black text-base uppercase tracking-widest px-12 py-5 rounded-xl transition-all shadow-2xl hover:-translate-y-0.5">
              ★ Back to Your Dashboard
            </Link>
          ) : (
            <div className="space-y-4">
              <Link href="/signup"
                className="inline-block bg-gold-400 hover:bg-gold-500 text-navy font-black text-base uppercase tracking-widest px-12 py-5 rounded-xl transition-all shadow-2xl hover:-translate-y-0.5">
                ★ Launch Your Free Campaign Dashboard
              </Link>
              <p className="text-blue-300/50 text-sm">No credit card. No commitment. Just victory.</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-navy">
        <div className="h-1.5 bg-gradient-to-r from-red-600 via-white/20 to-blue-700 opacity-60" />
        <div className="container mx-auto max-w-7xl px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-gradient flex items-center justify-center text-base text-white font-bold shadow-glow-red">★</div>
            <div>
              <span className="font-display font-bold tracking-widest uppercase text-white text-lg">
                Campaign<span className="text-gold-400">Assist</span>
              </span>
              <p className="text-blue-400/60 text-[10px] uppercase tracking-widest">Intelligence · Strategy · Victory</p>
            </div>
          </div>
          <div className="text-center">
            <p className="text-blue-300/40 text-xs">Built for Republican campaigns. Built to win.</p>
            <p className="text-gold-400/40 text-xs mt-0.5">★ God Bless America · © {new Date().getFullYear()}</p>
          </div>
          <div className="flex gap-4 text-xs text-blue-400/50 font-bold uppercase tracking-widest">
            <Link href="/login"  className="hover:text-white transition-colors">Log In</Link>
            <Link href="/signup" className="hover:text-gold-400 transition-colors">Sign Up</Link>
          </div>
        </div>
        <div className="h-1 bg-red-gradient opacity-40" />
      </footer>
    </div>
  )
}
