import Link from 'next/link'
import { auth } from '@/auth'
import { HeroBackgroundToasts, NewsTicker, DonorTicker } from '@/components/LandingAnimations'

export const dynamic = 'force-dynamic'

const FEATURES = [
  {
    icon: '🗺️',
    title: 'Constituent Profiles',
    blurb: 'Real Census Bureau demographics, BLS employment data, and FEC election history for your exact district.',
  },
  {
    icon: '📰',
    title: 'News Intelligence',
    blurb: 'Monitor every story about your candidate, your opponent, and your district across hundreds of outlets.',
  },
  {
    icon: '🗳️',
    title: 'Voter Intelligence',
    blurb: 'Upload your voter file and instantly identify GOTV targets, persuadables, and your base.',
  },
  {
    icon: '⚡',
    title: 'War Room',
    blurb: 'Rapid-response rebuttals, talking points, and press statements generated from live news coverage.',
  },
  {
    icon: '📋',
    title: 'Campaign Outreach',
    blurb: 'Track donors, volunteers, and voter contacts. Log activity and never miss a follow-up.',
  },
  {
    icon: '🏛️',
    title: 'Media Studio',
    blurb: 'Social posts, newsletters, email scripts, and taglines — tailored to your candidate and your race.',
  },
  {
    icon: '🔥',
    title: 'Hot Button Briefing',
    blurb: "Today's top issues summarized so you always know what voters are talking about.",
  },
  {
    icon: '💰',
    title: 'Fundraising Tools',
    blurb: 'Fundraising emails, call scripts, direct mail copy, and major donor asks — built around your message.',
  },
]

const HOW_IT_WORKS = [
  {
    number: '01',
    phase: 'Know Your District',
    headline: 'Start with real data.',
    body: 'Add your candidate and race. CampaignAssist immediately pulls Census demographics, BLS employment figures, and FEC election history for your exact geography.',
    color: 'from-blue-600 to-blue-800',
    accent: 'bg-blue-500',
  },
  {
    number: '02',
    phase: 'Know Your Voters',
    headline: 'Find every persuadable.',
    body: 'Get a full constituent intelligence profile. Upload your voter file to segment GOTV targets, swing voters, and your base — AI-tagged by issue and contact priority.',
    color: 'from-red-600 to-red-800',
    accent: 'bg-red-500',
  },
  {
    number: '03',
    phase: 'Run Your Campaign',
    headline: 'Execute from one place.',
    body: 'Monitor news daily, manage outreach, generate content, and track everything — all from a single dashboard built for modern campaigns.',
    color: 'from-yellow-500 to-gold-500',
    accent: 'bg-gold-400',
  },
]

const STATS = [
  { value: '8',    label: 'AI-powered tools' },
  { value: '100+', label: 'sources monitored' },
  { value: '50+',  label: 'Census data points' },
  { value: '2 min', label: 'to your first briefing' },
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
          <div className="container mx-auto max-w-7xl px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-gradient flex items-center justify-center text-2xl font-bold text-white select-none shrink-0 shadow-glow-red">★</div>
              <div className="leading-tight">
                <span className="font-display font-black text-3xl tracking-widest uppercase text-white">
                  Campaign<span className="text-gold-400">Assist</span>
                </span>
                <p className="text-[10px] uppercase tracking-[0.2em] text-blue-300/70 -mt-0.5">Intelligence · Strategy · Victory</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/what-we-offer"
                className="text-sm font-bold text-blue-200 hover:text-gold-400 transition-colors uppercase tracking-widest px-3 py-2">
                What We Offer
              </Link>
              {loggedIn ? (
                <Link href="/dashboard"
                  className="text-sm font-bold bg-gold-400 hover:bg-gold-500 text-navy px-5 py-2 rounded-xl transition-colors uppercase tracking-wide">
                  Dashboard →
                </Link>
              ) : (
                <>
                  <Link href="/login"
                    className="text-sm font-medium text-blue-300 hover:text-white transition-colors px-4 py-2">
                    Log In
                  </Link>
                  <Link href="/signup"
                    className="text-sm font-bold bg-gold-400 hover:bg-gold-500 text-navy px-5 py-2 rounded-xl transition-colors uppercase tracking-wide">
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
        <div className="absolute inset-0 bg-stripe-pattern opacity-30" />

        {/* Big background stars */}
        <div className="absolute -top-10 -right-10 text-white opacity-[0.04] text-[500px] font-black leading-none select-none pointer-events-none">★</div>
        <div className="absolute bottom-0 -left-20 text-white opacity-[0.03] text-[350px] font-black leading-none select-none pointer-events-none">★</div>

        {/* Scattered star field */}
        <div className="absolute top-10 left-16 text-gold-400 opacity-30 text-4xl select-none">★</div>
        <div className="absolute top-20 right-24 text-white opacity-15 text-2xl select-none">★</div>
        <div className="absolute top-1/3 left-1/4 text-gold-400 opacity-20 text-xl select-none">★</div>
        <div className="absolute top-1/4 right-1/3 text-white opacity-10 text-3xl select-none">★</div>
        <div className="absolute bottom-28 right-1/4 text-gold-400 opacity-25 text-3xl select-none">★</div>
        <div className="absolute bottom-16 left-1/3 text-white opacity-10 text-xl select-none">★</div>
        <div className="absolute bottom-40 right-16 text-gold-400 opacity-20 text-2xl select-none">★</div>
        <div className="absolute top-2/3 left-12 text-white opacity-10 text-lg select-none">★</div>

        {/* Background toast notifications — fade in/out behind the text */}
        <HeroBackgroundToasts />

        <div className="relative container mx-auto max-w-7xl px-6 py-20">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 bg-red-500/80 text-white text-xs font-black tracking-widest uppercase px-4 py-1.5 rounded-full mb-8 shadow-glow-red">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              ★ AI-Powered Campaign Intelligence
            </div>

            <h1 className="font-display font-black text-white leading-[0.95] mb-8">
              <span className="block text-4xl md:text-5xl lg:text-6xl mb-3 text-blue-200 font-bold tracking-wide">Take your Campaign</span>
              <span className="block text-5xl md:text-7xl lg:text-[90px] tracking-tight">to the Highest Level.</span>
            </h1>

            <p className="text-blue-100 text-xl md:text-2xl max-w-2xl mb-4 leading-relaxed font-medium">
              The all-in-one platform that gives every candidate — from city council to U.S. Senate — the intelligence and tools to run a modern, data-driven campaign.
            </p>
            <p className="text-blue-300/60 text-sm mb-12 uppercase tracking-[0.2em] font-semibold">
              ★ Real data · Real news · Built for every campaign ★
            </p>

            <div className="flex flex-wrap gap-4 items-center">
              {loggedIn ? (
                <Link href="/dashboard"
                  className="bg-gold-400 hover:bg-gold-500 text-navy font-black text-sm uppercase tracking-widest px-10 py-4 rounded-xl transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5">
                  ★ Go to Your Dashboard
                </Link>
              ) : (
                <>
                  <Link href="/signup"
                    className="bg-gold-400 hover:bg-gold-500 text-navy font-black text-sm px-10 py-4 rounded-xl transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5">
                    🚀 Let's get your campaign up and running!
                  </Link>
                  <Link href="/what-we-offer"
                    className="btn-what inline-flex items-center gap-2 px-8 py-4 rounded-xl text-sm uppercase tracking-widest">
                    ✨ What is CampaignAssist?
                  </Link>
                </>
              )}
            </div>
            {!loggedIn && <p className="text-blue-400/50 text-xs mt-4">Free to start. No credit card needed.</p>}
          </div>
        </div>
      </section>

      {/* ── News Ticker ── */}
      <NewsTicker />

      {/* ── Stats Banner ── */}
      <section className="bg-red-600 py-5">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="flex flex-wrap justify-center md:justify-between gap-6 md:gap-0 divide-y md:divide-y-0 md:divide-x divide-red-500">
            {STATS.map(s => (
              <div key={s.label} className="flex-1 min-w-[140px] text-center px-6 py-1">
                <div className="font-display font-black text-4xl text-white leading-none">{s.value}</div>
                <div className="text-red-200 text-xs uppercase tracking-widest font-semibold mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Constituent Intelligence Spotlight ── */}
      <section className="bg-navy py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-stripe-pattern opacity-10" />
        <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-[0.03] flex items-center justify-end pr-12 select-none pointer-events-none">
          <span className="text-white font-black" style={{ fontSize: '28rem', lineHeight: 1 }}>🗺</span>
        </div>
        <div className="relative container mx-auto max-w-7xl px-6">
          <div className="grid md:grid-cols-2 gap-14 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-gold-400/10 border border-gold-400/20 text-gold-400 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-6">
                ★ Core Feature
              </div>
              <h2 className="font-display font-black text-white text-4xl md:text-5xl leading-tight mb-6">
                Know your district<br />
                <span className="text-gold-400">before you knock<br />a single door.</span>
              </h2>
              <p className="text-blue-200 text-lg leading-relaxed mb-8">
                CampaignAssist pulls real data from the U.S. Census Bureau, Bureau of Labor Statistics, and FEC to build a full demographic and electoral profile of your exact race geography — automatically.
              </p>
              <ul className="space-y-3">
                {[
                  'Population, income, age, and education breakdowns by district',
                  'Current unemployment rate from BLS live data',
                  'Federal election results from the last 3 cycles via FEC',
                  'AI-generated analysis of your base, swing voters, and persuadables',
                ].map(item => (
                  <li key={item} className="flex items-start gap-3 text-blue-100 text-sm">
                    <span className="text-gold-400 shrink-0 mt-0.5">★</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Demographic Data Points', value: '50+', sub: 'U.S. Census Bureau' },
                { label: 'News Sources', value: '100+', sub: 'monitored daily' },
                { label: 'AI-Powered Tools', value: '8', sub: 'across every function' },
                { label: 'Time to First Briefing', value: '2 min', sub: 'from signup' },
              ].map(stat => (
                <div key={stat.label} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors">
                  <div className="font-display font-black text-3xl text-gold-400 mb-1">{stat.value}</div>
                  <div className="text-white text-sm font-semibold mb-0.5">{stat.label}</div>
                  <div className="text-blue-400 text-xs">{stat.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-navy text-gold-400 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
              ✦ How It Works
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-black text-navy">
              From signup to strategy<br />in three steps.
            </h2>
          </div>

          <div className="space-y-5">
            {HOW_IT_WORKS.map((step) => (
              <div key={step.number} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className={`h-1.5 bg-gradient-to-r ${step.color}`} />
                <div className="p-8 flex flex-col md:flex-row gap-8 items-start">
                  <div className="shrink-0">
                    <div className={`font-display font-black text-7xl leading-none bg-gradient-to-br ${step.color} bg-clip-text text-transparent`}>
                      {step.number}
                    </div>
                    <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mt-1">{step.phase}</div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display font-black text-navy text-2xl mb-3">{step.headline}</h3>
                    <p className="text-gray-500 leading-relaxed">{step.body}</p>
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
            <h2 className="font-display text-3xl md:text-4xl font-black text-navy mb-3">
              Every tool your campaign needs.
            </h2>
            <p className="text-gray-400 text-sm uppercase tracking-widest font-semibold">All under one roof. All powered by AI.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {FEATURES.map(f => (
              <div key={f.title}
                className="group bg-gray-50 hover:bg-navy rounded-2xl p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg border border-gray-100 hover:border-navy cursor-default">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-black text-navy group-hover:text-gold-400 text-sm uppercase tracking-wide mb-1.5 transition-colors">{f.title}</h3>
                <p className="text-gray-400 group-hover:text-blue-200 text-xs leading-relaxed transition-colors">{f.blurb}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Donor Ticker ── */}
      <DonorTicker />

      {/* ── CTA ── */}
      <section className="relative overflow-hidden bg-hero-gradient py-24">
        <div className="absolute inset-0 bg-stripe-pattern opacity-20" />
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] select-none pointer-events-none">
          <span className="text-white font-black" style={{ fontSize: '32rem', lineHeight: 1 }}>★</span>
        </div>
        <div className="relative container mx-auto max-w-3xl px-6 text-center">
          <div className="text-gold-400 text-xl mb-6 tracking-widest">★ ★ ★</div>
          <h2 className="font-display text-5xl md:text-6xl font-black text-white mb-4 leading-tight">
            Your campaign deserves<br />better tools.
          </h2>
          <p className="text-blue-200 text-xl mb-10 leading-relaxed">
            Set up your account in two minutes. Add your race and CampaignAssist starts working immediately.
          </p>
          {loggedIn ? (
            <Link href="/dashboard"
              className="inline-block bg-gold-400 hover:bg-gold-500 text-navy font-bold text-sm uppercase tracking-widest px-12 py-5 rounded-xl transition-all shadow-2xl hover:-translate-y-0.5">
              Back to Your Dashboard →
            </Link>
          ) : (
            <div className="space-y-4">
              <Link href="/signup"
                className="inline-block bg-gold-400 hover:bg-gold-500 text-navy font-black text-sm px-12 py-5 rounded-xl transition-all shadow-2xl hover:-translate-y-0.5">
                🚀 Let's get your campaign up and running!
              </Link>
              <p className="text-blue-300/50 text-sm">No credit card. No commitment.</p>
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
          <p className="text-blue-300/40 text-xs text-center">
            Built for modern political campaigns. © {new Date().getFullYear()} CampaignAssist.
          </p>
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
