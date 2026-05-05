import Link from 'next/link'
import { auth } from '@/auth'

export const dynamic = 'force-dynamic'

const FEATURES = [
  {
    icon: '🗺️',
    title: 'Constituent Profiles',
    blurb: 'Real Census Bureau demographics, BLS employment data, and FEC election history — pulled automatically for your exact race geography.',
  },
  {
    icon: '📰',
    title: 'News Intelligence',
    blurb: 'Monitor every story about your candidate, your opponent, and your district across hundreds of outlets. Classified and scored daily.',
  },
  {
    icon: '🗳️',
    title: 'Voter Intelligence',
    blurb: 'Upload your voter file and instantly segment GOTV targets, persuadables, and your base. AI-tagged by issue and contact priority.',
  },
  {
    icon: '⚡',
    title: 'War Room',
    blurb: 'Rapid-response rebuttals, talking points, and press statements drafted in seconds from live news coverage.',
  },
  {
    icon: '📋',
    title: 'Campaign Outreach',
    blurb: 'Track donors, volunteers, and voter contacts. Log activity, set follow-up reminders, and watch your numbers climb.',
  },
  {
    icon: '🏛️',
    title: 'Media Studio',
    blurb: 'On-demand social posts, newsletters, email scripts, and taglines — tailored to your candidate, your race, and your tone.',
  },
  {
    icon: '🔥',
    title: 'Hot Button Briefing',
    blurb: "Today's top issues summarized and framed — so you always know what voters are talking about and how to respond.",
  },
  {
    icon: '💰',
    title: "Fundraising Tools",
    blurb: 'AI-written fundraising emails, call scripts, direct mail copy, and major donor asks — built around your race and message.',
  },
]

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Set up your race',
    body: 'Add your candidate, your district, and your opponent. CampaignAssist immediately pulls real demographic and election data for your geography.',
  },
  {
    step: '02',
    title: 'Know your constituents',
    body: 'Get a full intelligence profile: who lives in your district, how they vote, what issues they care about, and where your persuadable voters are.',
  },
  {
    step: '03',
    title: 'Run your campaign',
    body: 'Monitor news, manage outreach, generate content, and track everything — all from a single dashboard built for modern campaigns.',
  },
]

export default async function LandingPage() {
  const session  = await auth()
  const loggedIn = !!session?.user

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">

      {/* ── Nav ── */}
      <header className="sticky top-0 z-40">
        <nav className="bg-white border-b border-gray-100 shadow-sm">
          <div className="container mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center shrink-0">
                <span className="text-gold-400 font-black text-sm">C</span>
              </div>
              <span className="font-bold text-lg text-navy tracking-tight">
                Campaign<span className="text-blue-500">Assist</span>
              </span>
            </div>
            <div className="flex items-center gap-3">
              {loggedIn ? (
                <Link href="/dashboard"
                  className="text-sm font-semibold bg-navy hover:bg-navy-700 text-white px-5 py-2 rounded-lg transition-colors">
                  Go to Dashboard →
                </Link>
              ) : (
                <>
                  <Link href="/login"
                    className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors px-3 py-2">
                    Log in
                  </Link>
                  <Link href="/signup"
                    className="text-sm font-semibold bg-navy hover:bg-navy-700 text-white px-5 py-2 rounded-lg transition-colors">
                    Get started free
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>
      </header>

      {/* ── Hero ── */}
      <section className="bg-white py-24 md:py-32">
        <div className="container mx-auto max-w-5xl px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-8 border border-blue-100">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
            AI-powered campaign intelligence
          </div>

          <h1 className="font-display font-black text-navy text-5xl md:text-6xl lg:text-7xl leading-tight mb-6 tracking-tight">
            Campaigning just got<br />
            <span className="text-blue-500">a software update.</span>
          </h1>

          <p className="text-gray-500 text-xl md:text-2xl max-w-2xl mx-auto mb-10 leading-relaxed">
            The all-in-one platform that gives every candidate — from city council to U.S. Senate — the data, tools, and intelligence to run a modern campaign.
          </p>

          <div className="flex flex-wrap gap-3 justify-center items-center">
            {loggedIn ? (
              <Link href="/dashboard"
                className="bg-navy hover:bg-navy-700 text-white font-semibold px-8 py-3.5 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-lg text-sm">
                Go to your dashboard →
              </Link>
            ) : (
              <>
                <Link href="/signup"
                  className="bg-navy hover:bg-navy-700 text-white font-semibold px-8 py-3.5 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-lg text-sm">
                  Create your free account
                </Link>
                <Link href="/login"
                  className="text-gray-500 hover:text-gray-900 font-medium text-sm px-5 py-3.5 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors">
                  Sign in
                </Link>
              </>
            )}
          </div>
          {!loggedIn && <p className="text-gray-400 text-xs mt-4">No credit card required.</p>}
        </div>
      </section>

      {/* ── Constituent Intelligence Spotlight ── */}
      <section className="bg-navy py-20 md:py-28">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 text-blue-200 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
                Core feature
              </div>
              <h2 className="font-display font-black text-white text-4xl md:text-5xl leading-tight mb-6">
                Know your district<br />
                <span className="text-gold-400">before you knock<br />a single door.</span>
              </h2>
              <p className="text-blue-200 text-lg leading-relaxed mb-6">
                Most campaigns guess at who their voters are. CampaignAssist pulls real data from the U.S. Census Bureau, Bureau of Labor Statistics, and FEC to build a complete demographic and electoral profile of your exact race geography.
              </p>
              <ul className="space-y-3">
                {[
                  'Population, income, age, and education breakdowns',
                  'Current unemployment from BLS live data',
                  'Election results from the last 3 cycles via FEC',
                  'AI analysis of your base, swing voters, and persuadables',
                ].map(item => (
                  <li key={item} className="flex items-start gap-3 text-blue-100 text-sm">
                    <span className="text-gold-400 mt-0.5 shrink-0">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Demographic Data Points', value: '50+', sub: 'from U.S. Census Bureau' },
                { label: 'News Sources Monitored', value: '100+', sub: 'updated daily' },
                { label: 'AI Tools', value: '8', sub: 'across every campaign function' },
                { label: 'Setup Time', value: '< 2 min', sub: 'before your first briefing' },
              ].map(stat => (
                <div key={stat.label} className="bg-white/5 border border-white/10 rounded-2xl p-5">
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
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="text-center mb-14">
            <h2 className="font-display font-black text-navy text-3xl md:text-4xl mb-3">
              Up and running in minutes.
            </h2>
            <p className="text-gray-400 text-base max-w-xl mx-auto">
              Add your race and CampaignAssist gets to work immediately — no setup required.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map((step) => (
              <div key={step.step} className="bg-white rounded-2xl p-7 border border-gray-100 shadow-sm">
                <div className="font-display font-black text-5xl text-gray-100 leading-none mb-4">{step.step}</div>
                <h3 className="font-bold text-navy text-lg mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section className="py-20 bg-white">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="text-center mb-12">
            <h2 className="font-display font-black text-navy text-3xl md:text-4xl mb-3">
              Every tool your campaign needs.
            </h2>
            <p className="text-gray-400 text-sm max-w-lg mx-auto">
              From the first door knock to election night — one platform covers every function of a modern campaign.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {FEATURES.map(f => (
              <div key={f.title}
                className="group bg-gray-50 hover:bg-navy rounded-2xl p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg border border-gray-100 hover:border-navy cursor-default">
                <div className="text-2xl mb-3">{f.icon}</div>
                <h3 className="font-bold text-navy group-hover:text-gold-400 text-sm mb-1.5 transition-colors">{f.title}</h3>
                <p className="text-gray-400 group-hover:text-blue-200 text-xs leading-relaxed transition-colors">{f.blurb}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-gray-50 border-t border-gray-100 py-24">
        <div className="container mx-auto max-w-2xl px-6 text-center">
          <h2 className="font-display font-black text-navy text-4xl md:text-5xl mb-4 leading-tight">
            Your campaign deserves<br />better tools.
          </h2>
          <p className="text-gray-500 text-lg mb-10 leading-relaxed">
            Set up your account in two minutes. Add your candidate and race, and CampaignAssist starts working immediately.
          </p>
          {loggedIn ? (
            <Link href="/dashboard"
              className="inline-block bg-navy hover:bg-navy-700 text-white font-semibold px-10 py-4 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-lg text-sm">
              Back to your dashboard →
            </Link>
          ) : (
            <div className="space-y-3">
              <Link href="/signup"
                className="inline-block bg-navy hover:bg-navy-700 text-white font-semibold px-10 py-4 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-lg text-sm">
                Create your free account
              </Link>
              <p className="text-gray-400 text-xs">No credit card required. Free to start.</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-navy border-t border-white/5">
        <div className="container mx-auto max-w-7xl px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
              <span className="text-gold-400 font-black text-xs">C</span>
            </div>
            <span className="font-bold text-white tracking-tight">
              Campaign<span className="text-blue-400">Assist</span>
            </span>
          </div>
          <p className="text-blue-400/50 text-xs text-center">
            Built for modern political campaigns. © {new Date().getFullYear()} CampaignAssist.
          </p>
          <div className="flex gap-4 text-xs text-blue-400/60 font-medium">
            <Link href="/login"  className="hover:text-white transition-colors">Log in</Link>
            <Link href="/signup" className="hover:text-white transition-colors">Sign up</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
