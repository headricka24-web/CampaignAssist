import Link from 'next/link'

export const metadata = { title: 'What We Offer — CampaignAssist' }

// ─── Reusable mock UI primitives (match real app exactly) ─────────────────────

function StatCard({ label, value, accent = 'blue', icon }: {
  label: string; value: string | number; accent?: 'blue'|'red'|'gold'|'green'; icon?: string
}) {
  const a = {
    blue:  { bar: 'from-navy-400 to-navy',       text: 'text-navy',      icon: 'bg-navy-100 text-navy'      },
    red:   { bar: 'from-red-400 to-red-700',     text: 'text-red-600',   icon: 'bg-red-100 text-red-600'    },
    gold:  { bar: 'from-gold-300 to-gold-500',   text: 'text-gold-600',  icon: 'bg-gold-100 text-gold-600'  },
    green: { bar: 'from-green-400 to-green-600', text: 'text-green-700', icon: 'bg-green-100 text-green-700'},
  }[accent]
  return (
    <div className="bg-white rounded-2xl shadow-patriot overflow-hidden border border-white/80">
      <div className={`h-1 bg-gradient-to-r ${a.bar}`} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 mb-2">{label}</p>
            <p className={`text-4xl font-display font-bold ${a.text} tabular-nums`}>{value}</p>
          </div>
          {icon && <div className={`w-10 h-10 rounded-xl ${a.icon} flex items-center justify-center text-xl shrink-0 mt-0.5`}>{icon}</div>}
        </div>
      </div>
    </div>
  )
}

function SentimentBadge({ s }: { s: string }) {
  const styles: Record<string, string> = {
    Positive: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    Neutral:  'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
    Negative: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
  }
  const dots: Record<string, string> = {
    Positive: 'bg-emerald-500', Neutral: 'bg-sky-500', Negative: 'bg-rose-500',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${styles[s] ?? 'bg-gray-100 text-gray-500'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dots[s] ?? 'bg-gray-400'}`} />
      {s}
    </span>
  )
}

function BucketBadge({ b }: { b: string }) {
  const map: Record<string, string> = {
    CandidateCoverage: 'bg-navy-100 text-navy',
    OpponentCoverage:  'bg-red-100 text-red-700',
    GeneralRace:       'bg-gold-100 text-gold-700',
    HotButtons:        'bg-orange-50 text-orange-700',
  }
  const labels: Record<string, string> = {
    CandidateCoverage: '🗳️ Candidate', OpponentCoverage: '⚔️ Opponent',
    GeneralRace: '🏛️ General', HotButtons: '🔥 Hot Button',
  }
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${map[b] ?? 'bg-gray-100 text-gray-500'}`}>{labels[b] ?? b}</span>
}

// Wraps each snapshot in a browser chrome with a SAMPLE DATA badge
function Screenshot({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-200 select-none">
      {/* Browser chrome */}
      <div className="bg-gray-100 border-b border-gray-200 px-4 py-2.5 flex items-center gap-3">
        <div className="flex gap-1.5 shrink-0">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 bg-white rounded px-3 py-1 text-[11px] text-gray-400 font-mono truncate">
          campaignassist.org/{title.toLowerCase().replace(/\s+/g, '-')}
        </div>
        <span className="shrink-0 text-[9px] font-black uppercase tracking-widest bg-gold-400 text-navy px-2 py-0.5 rounded-full">
          Sample Data
        </span>
      </div>
      <div className="pointer-events-none">{children}</div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WhatWeOfferPage() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">

      {/* Nav */}
      <header className="sticky top-0 z-40">
        <div className="h-1.5 bg-gradient-to-r from-red-600 via-white to-blue-700" />
        <nav className="bg-navy/95 backdrop-blur-sm border-b border-navy-500/50">
          <div className="container mx-auto max-w-7xl px-6 h-20 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-gradient flex items-center justify-center text-2xl font-bold text-white shrink-0 shadow-glow-red">★</div>
              <div className="leading-tight">
                <span className="font-display font-black text-3xl tracking-widest uppercase text-white">Campaign<span className="text-gold-400">Assist</span></span>
                <p className="text-[10px] uppercase tracking-[0.2em] text-blue-300/70 -mt-0.5">Intelligence · Strategy · Victory</p>
              </div>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/what-we-offer" className="text-sm font-bold text-gold-400 uppercase tracking-widest border-b-2 border-gold-400 pb-0.5">What We Offer</Link>
              <Link href="/login" className="text-sm font-medium text-blue-300 hover:text-white transition-colors px-3 py-2">Log In</Link>
              <Link href="/signup" className="text-sm font-bold bg-gold-400 hover:bg-gold-500 text-navy px-5 py-2 rounded-xl transition-colors uppercase tracking-wide">Get Started Free</Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-hero-gradient py-16">
        <div className="absolute inset-0 bg-stripe-pattern opacity-20" />
        <div className="absolute top-8 right-20 text-gold-400 opacity-20 text-4xl select-none">★</div>
        <div className="absolute bottom-8 left-20 text-white opacity-10 text-3xl select-none">★</div>
        <div className="relative container mx-auto max-w-4xl px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-red-500/80 text-white text-xs font-black tracking-widest uppercase px-4 py-1.5 rounded-full mb-6 shadow-glow-red">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            ★ Live Platform Preview
          </div>
          <h1 className="font-display font-black text-white text-4xl md:text-6xl leading-tight mb-4">
            See it before<br /><span className="text-gold-400">you sign up.</span>
          </h1>
          <p className="text-blue-200 text-lg md:text-xl max-w-2xl mx-auto">
            Real screenshots of every tool — populated with sample data so you know exactly what you're getting.
          </p>
        </div>
      </section>

      {/* ── 1. Dashboard ─────────────────────────────────────────────────────── */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto max-w-7xl px-6 space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-navy text-gold-400 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-3">★ Command — Dashboard</div>
            <h2 className="font-display font-black text-navy text-3xl md:text-4xl">Your Campaign Dashboard</h2>
            <p className="text-gray-400 mt-2 max-w-xl mx-auto">Everything at a glance — stories tracked, sentiment pulse, latest news, and your morning intelligence brief in one place.</p>
          </div>

          <Screenshot title="dashboard">
            <div className="bg-gray-50 p-5 space-y-4">
              {/* Hero banner */}
              <div className="relative rounded-2xl overflow-hidden bg-hero-gradient">
                <div className="absolute inset-0 bg-stripe-pattern opacity-30" />
                <div className="absolute top-3 right-5 text-white opacity-10 text-5xl leading-none">★★★</div>
                <div className="relative px-6 py-5 flex items-center justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-1.5 bg-red-500/80 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full mb-2">
                      <span className="w-1.5 h-1.5 bg-white rounded-full" />Live Intelligence Feed
                    </div>
                    <h3 className="font-display text-xl font-black text-white">Know Your Race. <span className="text-gold-400">Own the Narrative.</span></h3>
                    <p className="text-blue-200 text-xs mt-1 max-w-sm">Your command center for monitoring coverage, tracking opposition, and driving your message.</p>
                  </div>
                  <div className="hidden md:flex gap-2 shrink-0">
                    <div className="bg-red-500 text-white font-bold px-4 py-2 rounded-lg text-xs">★ Run Intelligence Scan</div>
                    <div className="border border-gold-400 text-gold-400 font-bold px-4 py-2 rounded-lg text-xs">Enter War Room</div>
                  </div>
                </div>
              </div>

              {/* Stat cards */}
              <div className="grid grid-cols-4 gap-3">
                <StatCard label="Stories Monitored" value={247}  accent="blue"  icon="📰" />
                <StatCard label="Breaking Today"    value={12}   accent="gold"  icon="⚡" />
                <StatCard label="Favorable"         value={118}  accent="green" icon="▲" />
                <StatCard label="Opposition"        value={43}   accent="red"   icon="▼" />
              </div>

              {/* Morning brief + recent articles */}
              <div className="grid lg:grid-cols-3 gap-4">
                {/* Morning brief */}
                <div className="lg:col-span-1 bg-white rounded-2xl shadow-patriot overflow-hidden border border-white/80">
                  <div className="h-1.5 bg-gradient-to-r from-navy via-red-500 to-gold-400" />
                  <div className="p-5">
                    <div className="flex items-center gap-2.5 mb-1">
                      <div className="w-8 h-8 rounded-lg bg-gold-100 flex items-center justify-center shrink-0">
                        <span className="text-gold-500 font-black text-sm">★</span>
                      </div>
                      <div>
                        <div className="font-display text-sm font-bold text-navy">Daily Intelligence Brief</div>
                        <div className="text-[10px] text-gray-400 uppercase tracking-widest">Monday, May 5, 2026</div>
                      </div>
                    </div>
                    <div className="mt-4 space-y-2 text-xs text-gray-600 leading-relaxed">
                      <p><strong className="text-navy">Top Story:</strong> Smith leads in latest district polling, up 4 points since last month. Favorable coverage outpaces opposition 3:1 this week.</p>
                      <p><strong className="text-navy">Watch:</strong> Education funding debate gaining traction — 14 stories this week. Recommend proactive messaging by Thursday.</p>
                      <p><strong className="text-navy">Opportunity:</strong> Opponent's infrastructure record is under scrutiny. Three outlets ran critical pieces in the last 48 hours.</p>
                    </div>
                  </div>
                </div>

                {/* Recent articles */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-patriot overflow-hidden border border-white/80">
                  <div className="h-1 bg-red-gradient" />
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">Latest Intelligence</span>
                      <span className="text-xs text-navy-400 font-semibold">View All →</span>
                    </div>
                    <ul className="divide-y divide-gray-100">
                      {[
                        { title: 'Smith Leads in Latest District Poll, Up 4 Points',        outlet: 'State Tribune',  date: 'May 5',  s: 'Positive', b: 'CandidateCoverage' },
                        { title: 'Education Funding Debate Heats Up Ahead of Election',     outlet: 'Capitol News',   date: 'May 5',  s: 'Neutral',  b: 'GeneralRace'       },
                        { title: 'Opposition Attacks Smith on Infrastructure Record',       outlet: 'Daily Dispatch', date: 'May 4',  s: 'Negative', b: 'OpponentCoverage'  },
                        { title: 'Voters Rank Economy Top Issue in New Survey',             outlet: 'Metro Post',     date: 'May 4',  s: 'Neutral',  b: 'HotButtons'        },
                        { title: 'Smith Campaign Announces Major Fundraising Milestone',    outlet: 'Political Wire', date: 'May 3',  s: 'Positive', b: 'CandidateCoverage' },
                      ].map(a => (
                        <li key={a.title} className="py-2.5 flex items-start gap-2.5">
                          <span className="text-gold-500 text-xs mt-0.5">★</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-xs text-navy line-clamp-1">{a.title}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">{a.outlet} · {a.date}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <BucketBadge b={a.b} />
                            <SentimentBadge s={a.s} />
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </Screenshot>
        </div>
      </section>

      {/* ── 2. News Tracker ──────────────────────────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="container mx-auto max-w-7xl px-6 space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-navy text-gold-400 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-3">★ Intelligence — News Feed</div>
            <h2 className="font-display font-black text-navy text-3xl md:text-4xl">News Tracker</h2>
            <p className="text-gray-400 mt-2 max-w-xl mx-auto">Every story classified by category — candidate coverage, opposition, district news, and hot-button issues — scored by sentiment automatically.</p>
          </div>

          <Screenshot title="news">
            <div className="bg-gray-50 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">News Tracker</h2>
                <div className="flex gap-2">
                  <div className="bg-navy text-white font-bold px-4 py-2 rounded-lg text-xs">▶ Run Scan</div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 bg-white rounded-xl p-1 border border-gray-100 shadow-sm w-fit">
                {[
                  { key: 'CandidateCoverage', label: 'Candidate Coverage', icon: '🗳️', active: true,  count: 118, color: 'text-navy' },
                  { key: 'OpponentCoverage',  label: 'Opponent Coverage',  icon: '⚔️', active: false, count: 43,  color: 'text-red-500' },
                  { key: 'GeneralRace',       label: 'General Race',       icon: '🏛️', active: false, count: 61,  color: 'text-gold-600' },
                  { key: 'HotButtons',        label: 'Hot Button Issues',  icon: '🔥', active: false, count: 25,  color: 'text-orange-600' },
                ].map(t => (
                  <div key={t.key} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-default ${t.active ? 'bg-navy text-white shadow-sm' : `${t.color} hover:bg-gray-50`}`}>
                    <span>{t.icon}</span>
                    <span className="hidden sm:inline">{t.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${t.active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>{t.count}</span>
                  </div>
                ))}
              </div>

              {/* Article table */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="grid grid-cols-[1fr_120px_100px_90px] gap-4 px-4 py-2.5 bg-gray-50 border-b border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  <span>Title ↕</span><span>Outlet ↕</span><span>Date ↕</span><span>Sentiment ↕</span>
                </div>
                {[
                  { title: 'Smith Leads in Latest District Poll, Up 4 Points',        outlet: 'State Tribune',  date: 'May 5',  s: 'Positive', summary: 'A new poll shows Smith leading by 4 points, with particular strength among suburban voters and seniors in the eastern precincts.' },
                  { title: 'Smith Campaign Announces Major Fundraising Milestone',     outlet: 'Political Wire', date: 'May 3',  s: 'Positive', summary: null },
                  { title: 'Smith Introduces Education Reform Bill in State Senate',   outlet: 'Capitol News',   date: 'May 2',  s: 'Positive', summary: 'The bill proposes increased funding for rural schools and a new accountability framework for district administrators.' },
                  { title: 'Q&A: Smith on the Economy and Local Jobs',                outlet: 'Metro Post',     date: 'Apr 30', s: 'Neutral',  summary: null },
                  { title: 'Smith Speaks at Veterans Event in Westfield',             outlet: 'Westfield Rec.', date: 'Apr 28', s: 'Positive', summary: null },
                ].map((a, i) => (
                  <div key={a.title} className={`grid grid-cols-[1fr_120px_100px_90px] gap-4 px-4 py-3 items-start ${i % 2 === 0 ? '' : 'bg-gray-50/50'} border-b border-gray-50`}>
                    <div>
                      <p className="text-xs font-semibold text-navy line-clamp-1">{a.title}</p>
                      {a.summary && <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{a.summary}</p>}
                    </div>
                    <span className="text-xs text-gray-500">{a.outlet}</span>
                    <span className="text-xs text-gray-400">{a.date}</span>
                    <SentimentBadge s={a.s} />
                  </div>
                ))}
              </div>
            </div>
          </Screenshot>
        </div>
      </section>

      {/* ── 3. Constituent Profile ───────────────────────────────────────────── */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto max-w-7xl px-6 space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-navy text-gold-400 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-3">★ Intelligence — Constituents</div>
            <h2 className="font-display font-black text-navy text-3xl md:text-4xl">Constituent Profiles</h2>
            <p className="text-gray-400 mt-2 max-w-xl mx-auto">Real Census Bureau, BLS, and FEC data pulled automatically for your district — plus AI-generated strategic analysis of your voter blocs.</p>
          </div>

          <Screenshot title="constituents">
            <div className="bg-gray-50 p-5 space-y-4">
              {/* Hero */}
              <div className="relative rounded-2xl overflow-hidden bg-hero-gradient">
                <div className="absolute inset-0 bg-stripe-pattern opacity-30" />
                <div className="relative px-6 py-6 flex items-center justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-1.5 bg-gold-400 text-navy text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full mb-2">✦ Voter Intelligence</div>
                    <h3 className="font-display text-2xl font-black text-white">Know Your <span className="text-gold-400">Constituents.</span></h3>
                    <p className="text-blue-200 text-xs mt-1 max-w-sm">Stop guessing. Real data on who your voters are and what moves them.</p>
                  </div>
                  <div className="bg-gold-400 text-navy font-black px-5 py-2.5 rounded-xl text-xs shrink-0">★ Generate Profile</div>
                </div>
              </div>

              {/* Profile card */}
              <div className="bg-white rounded-2xl border-2 border-navy-100 shadow-patriot overflow-hidden">
                <div className="h-1.5 bg-gold-gradient" />
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">📊</span>
                      <div>
                        <div className="font-display font-black text-navy uppercase tracking-wide">Ohio — District 14 Constituent Profile</div>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">✓ U.S. Census Bureau, 2022 ACS 5-Year</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">✓ BLS LAUS, April 2026</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">✓ FEC, 2024 U.S. House</span>
                          <span className="text-[10px] text-gray-400">+ strategic analysis by AI</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-5 text-sm text-gray-700 leading-relaxed">
                    <div>
                      <h4 className="font-bold text-navy text-base mb-2">## OVERVIEW</h4>
                      <p>District 14 encompasses 742,394 residents across a mix of mid-size cities and rural townships in central Ohio. The median household income of $58,200 sits slightly below the state average, reflecting a predominantly working-class and trades-employed workforce. Major employers include manufacturing, healthcare, and agriculture. The district is split roughly 60/40 between small urban centers and rural counties.</p>
                    </div>
                    <div>
                      <h4 className="font-bold text-navy text-base mb-2">## DEMOGRAPHIC BREAKDOWN</h4>
                      <p>The district is 81.4% White, 7.2% Black/African American, 5.9% Hispanic/Latino, and 2.1% Asian. Median age of 41.2 indicates a mature voter base. Education: 28.3% hold a bachelor's degree or higher — below the national average of 33%. Homeownership stands at 67.3%, with veterans comprising 8.4% of the civilian adult population.</p>
                    </div>
                    <div>
                      <h4 className="font-bold text-navy text-base mb-2">## KEY VOTER BLOCS</h4>
                      <p><strong>Working-class homeowners</strong> (est. 34% of electorate): Concentrated in western townships. Top issues: property taxes, local manufacturing jobs, healthcare costs. High turnout when directly engaged. <strong>Rural veterans</strong> (est. 8%): Reliable, high-turnout. Respond to service, values, and infrastructure messaging. <strong>Suburban families</strong> (est. 22%): Eastern corridor. Driven by school quality and public safety. Persuadable in non-presidential cycles.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Screenshot>
        </div>
      </section>

      {/* ── 4. War Room ──────────────────────────────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="container mx-auto max-w-7xl px-6 space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-navy text-gold-400 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-3">★ Intelligence — War Room</div>
            <h2 className="font-display font-black text-navy text-3xl md:text-4xl">War Room</h2>
            <p className="text-gray-400 mt-2 max-w-xl mx-auto">Threats from news coverage are identified and severity-scored automatically. Click any threat to generate a full counter-response in seconds.</p>
          </div>

          <Screenshot title="war-room">
            <div className="bg-gray-50 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-xl font-black text-navy">⚡ Threat Scanner</h2>
                  <p className="text-xs text-gray-400 mt-0.5">3 threats detected from recent coverage</p>
                </div>
                <div className="bg-red-500 text-white font-black px-4 py-2 rounded-lg text-xs shadow-glow-red">⚡ Scan Now</div>
              </div>

              <div className="space-y-3">
                {[
                  { severity: 'HIGH',   icon: '🚨', threat: 'Infrastructure Attack Ad', angle: 'Opponent claims Smith voted against highway funding bill in 2022', why: 'Ad is running on local TV and social media. Story picked up by 3 outlets.' },
                  { severity: 'MEDIUM', icon: '⚠️', threat: 'Education Funding Question', angle: 'Editorial questions Smith\'s stance on school board funding formula', why: 'Gaining traction in parent community Facebook groups.' },
                  { severity: 'LOW',    icon: '👁',  threat: 'Opposition Fundraising Story', angle: 'Opponent announces $400K fundraising quarter', why: 'May shift donor psychology. Monitor for narrative shift.' },
                ].map(t => {
                  const sev = {
                    HIGH:   { badge: 'bg-red-100 text-red-700',    border: 'border-red-200',    bar: 'from-red-500 to-red-700'      },
                    MEDIUM: { badge: 'bg-yellow-100 text-yellow-700', border: 'border-yellow-200', bar: 'from-yellow-400 to-orange-500' },
                    LOW:    { badge: 'bg-blue-100 text-blue-700',   border: 'border-blue-200',   bar: 'from-blue-400 to-blue-600'    },
                  }[t.severity as 'HIGH'|'MEDIUM'|'LOW']
                  return (
                    <div key={t.threat} className={`bg-white rounded-2xl border-2 ${sev.border} overflow-hidden`}>
                      <div className={`h-1 bg-gradient-to-r ${sev.bar}`} />
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1">
                            <span className="text-xl mt-0.5">{t.icon}</span>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${sev.badge}`}>{t.severity}</span>
                                <span className="font-black text-sm text-navy">{t.threat}</span>
                              </div>
                              <p className="text-xs text-gray-600 mb-1"><strong>Angle:</strong> {t.angle}</p>
                              <p className="text-xs text-gray-400"><strong>Why it matters:</strong> {t.why}</p>
                            </div>
                          </div>
                          <div className="bg-red-500 text-white font-black px-3 py-1.5 rounded-lg text-[10px] shrink-0">⚡ Respond</div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </Screenshot>
        </div>
      </section>

      {/* ── 5. Voter File ────────────────────────────────────────────────────── */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto max-w-7xl px-6 space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-navy text-gold-400 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-3">★ Field Ops — Voters</div>
            <h2 className="font-display font-black text-navy text-3xl md:text-4xl">Voter File Manager</h2>
            <p className="text-gray-400 mt-2 max-w-xl mx-auto">Upload your voter file and instantly see your list segmented by support level, issue interest, and contact priority.</p>
          </div>

          <Screenshot title="voters">
            <div className="bg-gray-50 p-5 space-y-4">
              <div className="grid lg:grid-cols-4 gap-4">
                {/* Sidebar */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-3 mb-2">Segments</div>
                  {[
                    { label: 'All Voters',        count: 31920, active: false },
                    { label: 'Strong Republican', count: 12480, active: true  },
                    { label: 'Lean Support',      count: 8340,  active: false },
                    { label: 'Persuadable',       count: 6210,  active: false },
                    { label: 'GOTV Target',       count: 4890,  active: false },
                    { label: 'Not Contacted',     count: 18440, active: false },
                    { label: 'Needs Follow-Up',   count: 724,   active: false },
                  ].map(s => (
                    <div key={s.label} className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold cursor-default transition-colors ${s.active ? 'bg-navy text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                      <span>{s.label}</span>
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${s.active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400'}`}>{s.count.toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                {/* Table */}
                <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                  <div className="grid grid-cols-[1.5fr_1fr_80px_100px_100px] gap-3 px-4 py-2.5 bg-gray-50 border-b border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400">
                    <span>Name</span><span>Precinct</span><span>Party</span><span>Support</span><span>Status</span>
                  </div>
                  {[
                    { name: 'James T.',    precinct: 'Westfield 4A', party: 'R', support: 'Strong Support', status: 'Not Contacted', tags: ['GOTV Target'] },
                    { name: 'Maria G.',   precinct: 'Eastview 2B',  party: 'R', support: 'Lean Support',   status: 'Reached',       tags: ['Lean Support', 'economy'] },
                    { name: 'David H.',   precinct: 'Central 1C',   party: 'I', support: 'Persuadable',    status: 'Not Contacted', tags: ['Persuadable', 'schools'] },
                    { name: 'Sarah M.',   precinct: 'Westfield 4A', party: 'R', support: 'Strong Support', status: 'Not Contacted', tags: ['Strong Republican', 'GOTV Target'] },
                    { name: 'Robert K.',  precinct: 'Northside 3D', party: 'R', support: 'Lean Support',   status: 'Left Message',  tags: ['Lean Support'] },
                  ].map((v, i) => (
                    <div key={v.name} className={`grid grid-cols-[1.5fr_1fr_80px_100px_100px] gap-3 px-4 py-2.5 items-center border-b border-gray-50 ${i % 2 === 0 ? '' : 'bg-gray-50/40'}`}>
                      <div>
                        <div className="text-xs font-semibold text-navy">{v.name}</div>
                        <div className="flex gap-1 mt-0.5 flex-wrap">
                          {v.tags.slice(0, 2).map(t => <span key={t} className="text-[9px] bg-navy-100 text-navy px-1.5 py-0.5 rounded-full font-bold">{t}</span>)}
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">{v.precinct}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full w-fit ${v.party === 'R' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{v.party === 'R' ? 'Rep' : 'Ind'}</span>
                      <span className="text-[10px] text-gray-600 font-medium">{v.support}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full w-fit ${v.status === 'Reached' ? 'bg-green-100 text-green-700' : v.status === 'Left Message' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>{v.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Screenshot>
        </div>
      </section>

      {/* ── 6. Media Studio ──────────────────────────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="container mx-auto max-w-7xl px-6 space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-navy text-gold-400 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-3">★ Communications — Media Studio</div>
            <h2 className="font-display font-black text-navy text-3xl md:text-4xl">Media Studio</h2>
            <p className="text-gray-400 mt-2 max-w-xl mx-auto">Generate social posts, newsletters, fundraising emails, and talking points — all tailored to your candidate and race.</p>
          </div>

          <Screenshot title="media">
            <div className="bg-gray-50 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-black text-navy">🏛️ Media Studio</h2>
                <div className="flex gap-2">
                  <div className="border border-gray-200 text-gray-500 font-semibold px-3 py-1.5 rounded-lg text-xs">Tone: Punchy ▾</div>
                  <div className="bg-navy text-white font-bold px-4 py-1.5 rounded-lg text-xs">Generate Content</div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 flex-wrap">
                {[
                  { label: 'Facebook', active: true },
                  { label: 'Instagram', active: false },
                  { label: 'Newsletter', active: false },
                  { label: 'Taglines', active: false },
                  { label: 'Strategy', active: false },
                  { label: 'Talking Points', active: false },
                ].map(t => (
                  <div key={t.label} className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-default ${t.active ? 'bg-navy text-white' : 'bg-white text-gray-500 border border-gray-100'}`}>{t.label}</div>
                ))}
              </div>

              <div className="bg-white rounded-2xl border-2 border-navy-100 shadow-patriot overflow-hidden">
                <div className="h-1 bg-red-gradient" />
                <div className="p-5 space-y-4">
                  {[
                    { post: "Our district deserves leadership that shows up — not just at election time, but every single day. That's the commitment I'm making to every family in District 14. Join us: [LINK]", note: 'Post 1 of 3' },
                    { post: "The numbers don't lie. Unemployment in our district is down. New businesses are opening. But we're not done. Let's keep the momentum going — together. [LINK]", note: 'Post 2 of 3' },
                    { post: "Parents shouldn't have to choose between a good school and a good neighborhood. I'm fighting for both. Add your name if you agree: [LINK]", note: 'Post 3 of 3' },
                  ].map(p => (
                    <div key={p.note} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{p.note}</span>
                        <div className="flex gap-1.5">
                          <div className="text-[10px] bg-navy text-white font-bold px-2.5 py-1 rounded-lg">Copy</div>
                          <div className="text-[10px] border border-gray-200 text-gray-500 font-bold px-2.5 py-1 rounded-lg">Edit</div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-700 leading-relaxed">{p.post}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Screenshot>
        </div>
      </section>

      {/* ── 7. Press Contacts ────────────────────────────────────────────────── */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto max-w-7xl px-6 space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-navy text-gold-400 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-3">★ Communications — Press Contacts</div>
            <h2 className="font-display font-black text-navy text-3xl md:text-4xl">Press &amp; Media Contacts</h2>
            <p className="text-gray-400 mt-2 max-w-xl mx-auto">Your full press list in one place — relationship status, beat coverage, outreach history, and import from any spreadsheet or PDF.</p>
          </div>

          <Screenshot title="press">
            <div className="bg-gray-50 p-5 space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-xl font-black text-navy">📢 Press Contacts</h2>
                  <p className="text-xs text-gray-400 mt-0.5">18 contacts · 4 outlets</p>
                </div>
                <div className="flex gap-2">
                  <div className="border border-gray-200 text-gray-500 font-bold px-3 py-1.5 rounded-lg text-xs">↑ Import File</div>
                  <div className="bg-navy text-white font-bold px-4 py-1.5 rounded-lg text-xs">+ Add Contact</div>
                </div>
              </div>

              {/* Contact table */}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="grid grid-cols-[1.5fr_1fr_80px_90px_100px] gap-3 px-4 py-2.5 bg-gray-50 border-b border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  <span>Name / Outlet</span><span>Beat</span><span>Role</span><span>Email</span><span>Relationship</span>
                </div>
                {[
                  { name: 'Sarah Chen',    outlet: 'State Tribune',   beat: 'Politics',    role: 'Reporter',  rel: 'warm',  relColor: 'bg-blue-100 text-blue-700' },
                  { name: 'Mike Torres',   outlet: 'Capitol News',    beat: 'Govt.',       role: 'Editor',    rel: 'ally',  relColor: 'bg-green-100 text-green-700' },
                  { name: 'Dana Reeves',   outlet: 'Daily Dispatch',  beat: 'Local Govt.', role: 'Reporter',  rel: 'cold',  relColor: 'bg-gray-100 text-gray-500' },
                  { name: 'James Park',    outlet: 'Metro Post',      beat: 'Business',    role: 'Columnist', rel: 'warm',  relColor: 'bg-blue-100 text-blue-700' },
                  { name: 'Lisa Morales',  outlet: 'Political Wire',  beat: 'Elections',   role: 'Reporter',  rel: 'hostile','relColor': 'bg-red-100 text-red-700' },
                ].map((c, i) => (
                  <div key={c.name} className={`grid grid-cols-[1.5fr_1fr_80px_90px_100px] gap-3 px-4 py-3 items-center border-b border-gray-50 ${i % 2 === 0 ? '' : 'bg-gray-50/40'}`}>
                    <div>
                      <p className="text-xs font-semibold text-navy">{c.name}</p>
                      <p className="text-[10px] text-gray-400">{c.outlet}</p>
                    </div>
                    <span className="text-xs text-gray-500">{c.beat}</span>
                    <span className="text-[10px] bg-navy-50 text-navy px-2 py-0.5 rounded-full font-bold w-fit">{c.role}</span>
                    <span className="text-[10px] text-blue-500">✉ on file</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full w-fit capitalize ${c.relColor}`}>{c.rel}</span>
                  </div>
                ))}
              </div>

              {/* Outreach log preview */}
              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Recent Outreach Log</p>
                {[
                  { name: 'Sarah Chen',  action: 'Emailed press release re: education bill',       date: 'May 13', status: 'Sent' },
                  { name: 'Mike Torres', action: 'Phone call — confirmed interview for Wednesday',  date: 'May 12', status: 'Connected' },
                  { name: 'Dana Reeves', action: 'Left voicemail re: campaign announcement',        date: 'May 10', status: 'No Response' },
                ].map(o => (
                  <div key={o.date + o.name} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-xs font-semibold text-navy">{o.name} <span className="text-gray-300 font-normal">·</span> <span className="text-gray-400 font-normal">{o.action}</span></p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <span className="text-[10px] text-gray-300">{o.date}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${o.status === 'Connected' ? 'bg-green-100 text-green-700' : o.status === 'Sent' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'}`}>{o.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Screenshot>
        </div>
      </section>

      {/* ── 8. Budget Tracker ────────────────────────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="container mx-auto max-w-7xl px-6 space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-navy text-gold-400 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-3">★ Finance — Budget Tracker</div>
            <h2 className="font-display font-black text-navy text-3xl md:text-4xl">Campaign Budget</h2>
            <p className="text-gray-400 mt-2 max-w-xl mx-auto">Track every dollar in and out by category. Import bank statements, review transactions, and keep your campaign finances clean and compliant.</p>
          </div>

          <Screenshot title="budget">
            <div className="bg-gray-50 p-5 space-y-4">
              {/* Summary cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-green-400 to-green-600" />
                  <div className="p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Total Income</p>
                    <p className="font-display font-bold text-3xl text-green-600">$124,800</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">18 transactions</p>
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-red-400 to-red-600" />
                  <div className="p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Total Expenses</p>
                    <p className="font-display font-bold text-3xl text-red-600">$87,340</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">34 transactions</p>
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="h-1 bg-gradient-to-r from-navy to-blue-700" />
                  <div className="p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Cash on Hand</p>
                    <p className="font-display font-bold text-3xl text-navy">$37,460</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">as of today</p>
                  </div>
                </div>
              </div>

              {/* Transaction table */}
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Recent Transactions</p>
                  <div className="bg-navy text-white font-bold px-3 py-1 rounded-lg text-[10px]">↑ Import File</div>
                </div>
                {[
                  { date: 'May 13', desc: 'Facebook Ad Buy — May',        cat: 'Advertising', type: 'expense', amount: '-$4,200',  color: 'text-red-500' },
                  { date: 'May 12', desc: 'Major Donor — K. Henderson',   cat: 'Donations',   type: 'income',  amount: '+$10,000', color: 'text-green-600' },
                  { date: 'May 11', desc: 'Campaign Manager — May',        cat: 'Staff',       type: 'expense', amount: '-$5,500',  color: 'text-red-500' },
                  { date: 'May 10', desc: 'Small Dollar Donations',        cat: 'Donations',   type: 'income',  amount: '+$3,240',  color: 'text-green-600' },
                  { date: 'May 9',  desc: 'Printing — Door Hangers',       cat: 'Printing',    type: 'expense', amount: '-$1,180',  color: 'text-red-500' },
                ].map((t, i) => (
                  <div key={t.desc} className={`grid grid-cols-[80px_1fr_100px_90px] gap-3 px-4 py-2.5 items-center border-b border-gray-50 ${i % 2 === 0 ? '' : 'bg-gray-50/40'}`}>
                    <span className="text-[10px] text-gray-400">{t.date}</span>
                    <span className="text-xs font-medium text-navy">{t.desc}</span>
                    <span className="text-[10px] bg-navy-50 text-navy px-2 py-0.5 rounded-full font-bold w-fit">{t.cat}</span>
                    <span className={`text-xs font-black text-right ${t.color}`}>{t.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          </Screenshot>
        </div>
      </section>

      {/* ── 9. Advertising ──────────────────────────────────────────────────── */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto max-w-7xl px-6 space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-orange-500 text-white text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-3">▶ Advertising — New</div>
            <h2 className="font-display font-black text-navy text-3xl md:text-4xl">Ad Copy Studio &amp; Media Strategy</h2>
            <p className="text-gray-400 mt-2 max-w-xl mx-auto">Generate professional TV scripts, radio spots, digital ads, and direct mail — plus a phase-by-phase media strategy and local outlet list for your market.</p>
          </div>

          {/* Three feature cards */}
          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                icon: '📺',
                title: 'Ad Copy Studio',
                color: 'from-red-500 to-red-700',
                bg: 'bg-red-50',
                border: 'border-red-100',
                text: 'text-red-700',
                formats: ['TV :30', 'TV :60', 'Radio :30', 'Radio :60', 'Digital Display', 'Social Video', 'Direct Mail', 'Pre-Roll :15'],
                desc: 'Pick a format, enter a focus issue, and get a full professional script in seconds. Every output is saved and copyable.',
              },
              {
                icon: '🎯',
                title: 'Ad Strategy Advisor',
                color: 'from-orange-500 to-orange-700',
                bg: 'bg-orange-50',
                border: 'border-orange-100',
                text: 'text-orange-700',
                formats: ['Early Campaign', 'Mid-Campaign', 'Final Push', 'GOTV', 'Under $5K', '$5K–$25K', '$25K–$100K', '$100K+'],
                desc: 'Select your campaign phase and budget. Get a full ad mix with budget allocation, targeting priorities, and what to avoid.',
              },
              {
                icon: '📡',
                title: 'Media Outlet Finder',
                color: 'from-violet-500 to-violet-700',
                bg: 'bg-violet-50',
                border: 'border-violet-100',
                text: 'text-violet-700',
                formats: ['Local TV', 'Radio (incl. conservative talk)', 'Digital & Streaming', 'Newspapers', 'Hyperlocal / Community', 'Buying Tips'],
                desc: 'Auto-detects your race geography and surfaces the real outlets that matter — with notes on which buys make sense for your level.',
              },
            ].map(f => (
              <div key={f.title} className={`bg-white rounded-2xl border ${f.border} overflow-hidden shadow-sm`}>
                <div className={`h-1.5 bg-gradient-to-r ${f.color}`} />
                <div className="p-5">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className={`w-10 h-10 rounded-xl ${f.bg} flex items-center justify-center text-xl shrink-0`}>{f.icon}</div>
                    <h3 className={`font-black text-sm uppercase tracking-wide ${f.text}`}>{f.title}</h3>
                  </div>
                  <p className="text-gray-500 text-xs leading-relaxed mb-4">{f.desc}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {f.formats.map(fmt => (
                      <span key={fmt} className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${f.bg} ${f.text}`}>{fmt}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Mock TV script output */}
          <Screenshot title="advertising/copy">
            <div className="bg-gray-50 p-5 space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center text-xl shadow-lg">📺</div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-orange-500 font-black">Advertising</p>
                    <h2 className="font-display font-black text-navy text-xl">Ad Copy Studio</h2>
                  </div>
                </div>
              </div>

              {/* Focus input */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">Focus Issue / Theme</p>
                <div className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-400">Border security and public safety…</div>
              </div>

              {/* Format cards */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { icon: '📺', label: 'TV Spot', sub: ':30 second', bar: 'from-red-500 to-red-700', active: true },
                  { icon: '📺', label: 'TV Spot', sub: ':60 second', bar: 'from-red-700 to-red-900', active: false },
                  { icon: '📻', label: 'Radio Spot', sub: ':30 second', bar: 'from-blue-500 to-blue-700', active: false },
                  { icon: '📱', label: 'Social Video', sub: ':15–:30 script', bar: 'from-orange-400 to-orange-600', active: false },
                ].map((f, i) => (
                  <div key={i} className={`bg-white rounded-2xl border overflow-hidden shadow-sm ${f.active ? 'border-navy ring-2 ring-navy/10' : 'border-gray-100'}`}>
                    <div className={`h-1 bg-gradient-to-r ${f.bar}`} />
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xl">{f.icon}</span>
                        <div>
                          <p className="text-xs font-black text-navy">{f.label}</p>
                          <p className="text-[10px] text-gray-400">{f.sub}</p>
                        </div>
                      </div>
                      <div className={`w-full py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide text-center ${f.active ? 'bg-navy text-white' : 'bg-gray-100 text-gray-400'}`}>
                        {f.active ? '✓ Generated' : 'Generate'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Script output */}
              <div className="bg-white border-2 border-navy-100 rounded-2xl overflow-hidden shadow-patriot">
                <div className="h-1 bg-red-gradient" />
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📺</span>
                    <div>
                      <p className="font-black text-xs text-navy uppercase tracking-wide">TV Spot :30</p>
                      <p className="text-[10px] text-gray-400">Border security · Smith for Congress</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="bg-navy text-white text-[10px] font-bold px-3 py-1.5 rounded-lg">Copy All</div>
                    <div className="border border-gray-200 text-gray-400 text-[10px] font-bold px-2.5 py-1.5 rounded-lg">↺ Redo</div>
                  </div>
                </div>
                <div className="p-5 space-y-3 text-xs">
                  <div><span className="font-black text-navy uppercase tracking-widest text-[10px]">TITLE:</span> <span className="text-gray-700">"Enough"</span></div>
                  <div className="space-y-1.5 text-gray-600 leading-relaxed">
                    <p><span className="font-bold text-navy">[VISUAL]</span> Aerial shot of the southern border. Razor wire. Empty patrol road at dusk.</p>
                    <p><span className="font-bold text-navy">[VO]</span> <em>"Three thousand illegal crossings. Last month alone. In our district."</em></p>
                    <p><span className="font-bold text-navy">[VISUAL]</span> Cut to hometown streets. Family walking to school.</p>
                    <p><span className="font-bold text-navy">[VO]</span> <em>"Tom Smith won't negotiate with that. He'll end it."</em></p>
                    <p><span className="font-bold text-navy">[SUPER]</span> TOM SMITH · CONGRESS · OHIO 14TH</p>
                    <p><span className="font-bold text-navy">[TAG]</span> <em>"I'm Tom Smith and I approve this message."</em></p>
                  </div>
                </div>
              </div>
            </div>
          </Screenshot>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-hero-gradient py-20">
        <div className="absolute inset-0 bg-stripe-pattern opacity-20" />
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] select-none pointer-events-none">
          <span className="text-white font-black" style={{ fontSize: '28rem', lineHeight: 1 }}>★</span>
        </div>
        <div className="relative container mx-auto max-w-3xl px-6 text-center">
          <div className="text-gold-400 text-xl mb-5 tracking-widest">★ ★ ★</div>
          <h2 className="font-display text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
            Ready to run<br />a smarter campaign?
          </h2>
          <p className="text-blue-200 text-lg mb-8">Everything you just saw is live and ready to go. Set up takes two minutes.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/signup" className="bg-gold-400 hover:bg-gold-500 text-navy font-black text-sm px-10 py-4 rounded-xl transition-all shadow-2xl hover:-translate-y-0.5">
              🚀 Let's get your campaign up and running!
            </Link>
            <Link href="/" className="border-2 border-white/20 hover:border-white/50 text-white font-medium text-sm px-8 py-4 rounded-xl transition-colors">
              ← Back to Home
            </Link>
          </div>
          <p className="text-blue-400/50 text-xs mt-4">Free to start. No credit card needed.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-navy">
        <div className="h-1.5 bg-gradient-to-r from-red-600 via-white/20 to-blue-700 opacity-60" />
        <div className="container mx-auto max-w-7xl px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-gradient flex items-center justify-center text-base text-white font-bold shadow-glow-red">★</div>
            <span className="font-display font-bold tracking-widest uppercase text-white text-lg">Campaign<span className="text-gold-400">Assist</span></span>
          </Link>
          <p className="text-blue-300/40 text-xs">Built for modern political campaigns. © {new Date().getFullYear()} CampaignAssist.</p>
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
