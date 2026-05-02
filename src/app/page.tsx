import Link from 'next/link'
import { auth } from '@/auth'

export const dynamic = 'force-dynamic'

const FEATURES = [
  {
    icon: '📰',
    title: 'News Intelligence',
    description: 'AI scans hundreds of sources daily. Every story about your race, your opponent, and your district — classified, scored, and waiting in your feed.',
    color: 'border-blue-100',
    bar: 'from-blue-500 to-blue-700',
  },
  {
    icon: '⚡',
    title: 'War Room',
    description: 'Real-time rapid response. Get AI-drafted rebuttals, talking points, and press statements within seconds of a breaking story.',
    color: 'border-red-100',
    bar: 'from-red-500 to-red-600',
  },
  {
    icon: '🗳️',
    title: 'Voter Intelligence',
    description: 'Upload your voter file and instantly segment GOTV targets, persuadables, and issue voters. Know who to call and exactly what to say.',
    color: 'border-gold-100',
    bar: 'from-yellow-400 to-gold-400',
  },
  {
    icon: '📋',
    title: 'Campaign Outreach',
    description: 'Manage donors, volunteers, and contacts in one place. Set fundraising goals, track shifts, and import data from any spreadsheet or PDF.',
    color: 'border-green-100',
    bar: 'from-green-500 to-green-700',
  },
  {
    icon: '🗺️',
    title: 'Constituent Profiles',
    description: 'Census Bureau demographics, BLS employment data, and FEC election history — assembled into a district-level intelligence brief for every race.',
    color: 'border-purple-100',
    bar: 'from-purple-500 to-purple-700',
  },
  {
    icon: '🏛️',
    title: 'Media Studio',
    description: "AI-generated press releases, fundraising emails, social copy, and event announcements — tailored to your candidate's voice and platform.",
    color: 'border-navy-100',
    bar: 'from-navy to-blue-600',
  },
]

const TESTIMONIALS = [
  { quote: 'CampaignAssist gave our small campaign the intelligence firepower of a statewide operation.', author: 'State House Candidate, New Hampshire' },
  { quote: 'The morning brief alone saves my comms director two hours every day.', author: 'County Commissioner, Texas' },
  { quote: 'We identified our persuadables in 20 minutes. Previously that analysis took us a week.', author: 'Campaign Manager, Florida' },
]

export default async function LandingPage() {
  const session  = await auth()
  const loggedIn = !!session?.user

  return (
    <div className="min-h-screen bg-white">

      {/* ── Nav ── */}
      <header className="sticky top-0 z-40">
        <div className="h-1 bg-red-gradient" />
        <nav className="bg-navy/95 backdrop-blur-sm border-b border-navy-500/50">
          <div className="container mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-red-gradient flex items-center justify-center text-lg font-bold text-white select-none shrink-0">★</div>
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
                  Go to Dashboard →
                </Link>
              ) : (
                <>
                  <Link href="/login"
                    className="text-sm font-bold text-blue-300 hover:text-white transition-colors px-4 py-2">
                    Log In
                  </Link>
                  <Link href="/signup"
                    className="text-sm font-black uppercase tracking-widest bg-gold-400 hover:bg-gold-500 text-navy px-5 py-2 rounded-xl transition-colors">
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>
        <div className="h-px bg-gold-gradient opacity-40" />
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-hero-gradient">
        <div className="absolute inset-0 bg-stripe-pattern opacity-30" />
        <div className="absolute top-10 right-20 text-white opacity-[0.04] text-[260px] font-black leading-none select-none pointer-events-none">★</div>
        <div className="relative container mx-auto max-w-7xl px-6 py-24 md:py-32">
          <div className="inline-flex items-center gap-2 bg-red-500/80 text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-6">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            AI-Powered Campaign Intelligence
          </div>
          <h1 className="font-display text-5xl md:text-7xl font-black text-white leading-tight mb-6 max-w-3xl">
            Win Your Race.<br />
            <span className="text-gold-400">Own the Narrative.</span>
          </h1>
          <p className="text-blue-200 text-xl max-w-2xl mb-10 leading-relaxed">
            The complete AI command center for Republican campaigns. Real-time news intelligence, voter analytics, opposition research, and outreach tools — built for candidates who play to win.
          </p>
          <div className="flex flex-wrap gap-4">
            {loggedIn ? (
              <Link href="/dashboard"
                className="bg-gold-400 hover:bg-gold-500 text-navy font-black text-sm uppercase tracking-widest px-8 py-4 rounded-xl transition-colors shadow-lg">
                ★ Go to Your Dashboard
              </Link>
            ) : (
              <>
                <Link href="/signup"
                  className="bg-gold-400 hover:bg-gold-500 text-navy font-black text-sm uppercase tracking-widest px-8 py-4 rounded-xl transition-colors shadow-lg">
                  ★ Start Free — Create Account
                </Link>
                <Link href="/login"
                  className="border-2 border-white/30 hover:border-white/60 text-white font-bold text-sm px-8 py-4 rounded-xl transition-colors">
                  Log In to Dashboard
                </Link>
              </>
            )}
          </div>
          {!loggedIn && <p className="text-blue-300/60 text-sm mt-5">No credit card required to get started.</p>}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-navy text-gold-400 text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full mb-4">
              ✦ Platform Features
            </div>
            <h2 className="font-display text-4xl font-black text-navy mb-4">
              Everything a Modern Campaign Needs
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              From your morning intelligence brief to election night — CampaignAssist covers every corner of the campaign.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(f => (
              <div key={f.title} className={`bg-white rounded-2xl border-2 ${f.color} overflow-hidden hover:shadow-lg transition-shadow`}>
                <div className={`h-1 bg-gradient-to-r ${f.bar}`} />
                <div className="p-6">
                  <div className="text-3xl mb-4">{f.icon}</div>
                  <h3 className="font-display font-black text-navy text-lg mb-2">{f.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{f.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Social Proof ── */}
      <section className="py-20 bg-white">
        <div className="container mx-auto max-w-5xl px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">From the Field</p>
            <h2 className="font-display text-3xl font-black text-navy">Campaigns That Run Smarter</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="bg-gray-50 rounded-2xl p-6 border-2 border-gray-100">
                <div className="text-gold-400 text-2xl mb-3">★★★★★</div>
                <p className="text-navy font-semibold text-sm leading-relaxed mb-4">"{t.quote}"</p>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wide">— {t.author}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative overflow-hidden bg-hero-gradient py-20">
        <div className="absolute inset-0 bg-stripe-pattern opacity-20" />
        <div className="relative container mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-display text-4xl font-black text-white mb-4">
            Ready to Run a <span className="text-gold-400">Smarter Campaign?</span>
          </h2>
          <p className="text-blue-200 text-lg mb-8">
            Create your account and have your intelligence dashboard running in under five minutes.
          </p>
          {loggedIn ? (
            <Link href="/dashboard"
              className="inline-block bg-gold-400 hover:bg-gold-500 text-navy font-black text-sm uppercase tracking-widest px-10 py-4 rounded-xl transition-colors shadow-lg">
              ★ Go to Your Dashboard
            </Link>
          ) : (
            <Link href="/signup"
              className="inline-block bg-gold-400 hover:bg-gold-500 text-navy font-black text-sm uppercase tracking-widest px-10 py-4 rounded-xl transition-colors shadow-lg">
              ★ Create Your Free Account
            </Link>
          )}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-navy">
        <div className="h-px bg-gold-gradient opacity-60" />
        <div className="container mx-auto max-w-7xl px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-red-gradient flex items-center justify-center text-sm text-white">★</div>
            <span className="font-display font-bold tracking-widest uppercase text-white">
              Campaign<span className="text-gold-400">Assist</span>
            </span>
            <span className="text-blue-400 hidden sm:block">· Intelligence · Strategy · Victory</span>
          </div>
          <span className="text-gold-400/60">© {new Date().getFullYear()}</span>
        </div>
        <div className="h-1 bg-red-gradient opacity-60" />
      </footer>
    </div>
  )
}
