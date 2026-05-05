import Link from 'next/link'

export const metadata = { title: 'What We Offer — CampaignAssist' }

// ── Sample data for the mockup ──────────────────────────────────────────────

const SAMPLE_ARTICLES = [
  { title: 'Smith Leads in Latest District Poll, Up 4 Points', outlet: 'The State Tribune', date: 'May 5', sentiment: 'Positive', bucket: 'CandidateCoverage' },
  { title: 'Education Funding Debate Heats Up Ahead of Election', outlet: 'Capitol News', date: 'May 5', sentiment: 'Neutral', bucket: 'GeneralRace' },
  { title: 'Opposition Attacks Smith on Infrastructure Record', outlet: 'Daily Dispatch', date: 'May 4', sentiment: 'Negative', bucket: 'OpponentCoverage' },
  { title: 'Voters Rank Economy Top Issue in New Survey', outlet: 'Metro Post', date: 'May 4', sentiment: 'Neutral', bucket: 'HotButtons' },
  { title: 'Smith Campaign Announces Major Fundraising Milestone', outlet: 'Political Wire', date: 'May 3', sentiment: 'Positive', bucket: 'CandidateCoverage' },
]

const SAMPLE_POLLS = [
  { label: 'Smith', value: 51, isOurs: true },
  { label: 'Opposition', value: 44, isOurs: false },
  { label: 'Undecided', value: 5, isOurs: false },
]

const SAMPLE_SEGMENTS = [
  { label: 'Strong Support', count: 12480, color: 'bg-blue-500' },
  { label: 'Lean Support', count: 8340, color: 'bg-blue-300' },
  { label: 'Persuadable', count: 6210, color: 'bg-yellow-400' },
  { label: 'GOTV Target', count: 4890, color: 'bg-red-400' },
]

const FEATURES_PREVIEW = [
  {
    icon: '📰',
    title: 'News Intelligence',
    desc: 'Every story about your race, classified by topic and scored by sentiment — delivered to your dashboard each morning.',
    color: 'border-blue-200 bg-blue-50',
    badge: 'bg-blue-100 text-blue-700',
  },
  {
    icon: '🗺️',
    title: 'Constituent Profiles',
    desc: 'Real Census Bureau demographics, BLS employment data, and FEC election history pulled automatically for your district.',
    color: 'border-gold-200 bg-yellow-50',
    badge: 'bg-yellow-100 text-yellow-700',
  },
  {
    icon: '🗳️',
    title: 'Voter Intelligence',
    desc: 'Upload your voter file and instantly segment GOTV targets, persuadables, and your base by issue and priority.',
    color: 'border-green-200 bg-green-50',
    badge: 'bg-green-100 text-green-700',
  },
  {
    icon: '⚡',
    title: 'War Room',
    desc: 'Rapid-response rebuttals, talking points, and press statements drafted from live coverage in seconds.',
    color: 'border-red-200 bg-red-50',
    badge: 'bg-red-100 text-red-700',
  },
  {
    icon: '🏛️',
    title: 'Media Studio',
    desc: 'Facebook posts, Instagram captions, newsletters, fundraising emails, and taglines — generated on demand.',
    color: 'border-purple-200 bg-purple-50',
    badge: 'bg-purple-100 text-purple-700',
  },
  {
    icon: '📋',
    title: 'Campaign Outreach',
    desc: 'Manage every donor, volunteer, and contact. Track follow-ups, events, and goals all in one place.',
    color: 'border-navy-200 bg-gray-50',
    badge: 'bg-gray-100 text-gray-700',
  },
]

// ── Sentiment badge ──────────────────────────────────────────────────────────

function SentimentPill({ s }: { s: string }) {
  const cls = s === 'Positive' ? 'bg-green-100 text-green-700' : s === 'Negative' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cls}`}>{s}</span>
}

function BucketPill({ b }: { b: string }) {
  const map: Record<string, string> = {
    CandidateCoverage: 'bg-blue-100 text-blue-700',
    OpponentCoverage:  'bg-red-100 text-red-700',
    GeneralRace:       'bg-yellow-100 text-yellow-700',
    HotButtons:        'bg-orange-100 text-orange-700',
  }
  const label: Record<string, string> = {
    CandidateCoverage: 'Candidate',
    OpponentCoverage:  'Opponent',
    GeneralRace:       'General',
    HotButtons:        'Hot Button',
  }
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${map[b] ?? 'bg-gray-100 text-gray-500'}`}>{label[b] ?? b}</span>
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function WhatWeOfferPage() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">

      {/* ── Nav ── */}
      <header className="sticky top-0 z-40">
        <div className="h-1.5 bg-gradient-to-r from-red-600 via-white to-blue-700" />
        <nav className="bg-navy/95 backdrop-blur-sm border-b border-navy-500/50">
          <div className="container mx-auto max-w-7xl px-6 h-20 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-gradient flex items-center justify-center text-2xl font-bold text-white select-none shrink-0 shadow-glow-red">★</div>
              <div className="leading-tight">
                <span className="font-display font-black text-3xl tracking-widest uppercase text-white">
                  Campaign<span className="text-gold-400">Assist</span>
                </span>
                <p className="text-[10px] uppercase tracking-[0.2em] text-blue-300/70 -mt-0.5">Intelligence · Strategy · Victory</p>
              </div>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/what-we-offer" className="text-sm font-bold text-gold-400 uppercase tracking-widest border-b-2 border-gold-400 pb-0.5">
                What We Offer
              </Link>
              <Link href="/login" className="text-sm font-medium text-blue-300 hover:text-white transition-colors px-3 py-2">
                Log In
              </Link>
              <Link href="/signup" className="text-sm font-bold bg-gold-400 hover:bg-gold-500 text-navy px-5 py-2 rounded-xl transition-colors uppercase tracking-wide">
                Get Started Free
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* ── Hero ── */}
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
            Here's exactly what your CampaignAssist dashboard looks like — real features, real data, real tools. No surprises.
          </p>
        </div>
      </section>

      {/* ── Dashboard Preview ── */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto max-w-7xl px-6">

          <div className="flex items-center gap-3 mb-8">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-gray-200" />
            <div className="flex items-center gap-2 bg-navy text-gold-400 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full">
              ★ Dashboard Overview
            </div>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-gray-200" />
          </div>

          {/* Simulated browser chrome */}
          <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
            <div className="bg-gray-100 border-b border-gray-200 px-4 py-3 flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 bg-white rounded-md px-3 py-1 text-xs text-gray-400 font-mono">
                campaignassist.org/dashboard
              </div>
            </div>

            {/* Simulated app UI */}
            <div className="bg-gray-50 p-6 space-y-6">

              {/* Hero banner */}
              <div className="relative rounded-2xl overflow-hidden bg-hero-gradient shadow-patriot">
                <div className="absolute inset-0 bg-stripe-pattern opacity-30" />
                <div className="absolute top-3 right-5 text-white opacity-10 text-5xl select-none leading-none">★★★</div>
                <div className="relative px-6 py-6 flex items-center justify-between">
                  <div>
                    <div className="inline-flex items-center gap-1.5 bg-red-500/80 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full mb-2">
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                      Live Intelligence Feed
                    </div>
                    <h2 className="font-display text-2xl font-black text-white mb-1">
                      Know Your Race.<br /><span className="text-gold-400">Own the Narrative.</span>
                    </h2>
                    <p className="text-blue-200 text-xs max-w-sm">Your command center for monitoring coverage, tracking opposition, and driving your message.</p>
                  </div>
                  <div className="hidden md:flex gap-2">
                    <div className="bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-2 rounded-lg text-xs">★ Run Intelligence Scan</div>
                    <div className="border border-gold-400 text-gold-400 font-bold px-4 py-2 rounded-lg text-xs">Enter War Room</div>
                  </div>
                </div>
              </div>

              {/* Stat cards */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Stories Monitored', value: '247', icon: '📰', color: 'border-blue-200' },
                  { label: 'Breaking Today',    value: '12',  icon: '⚡', color: 'border-yellow-200' },
                  { label: 'Favorable',         value: '118', icon: '▲', color: 'border-green-200' },
                  { label: 'Opposition',        value: '43',  icon: '▼', color: 'border-red-200' },
                ].map(s => (
                  <div key={s.label} className={`bg-white rounded-xl border-2 ${s.color} p-4`}>
                    <div className="text-xl mb-1">{s.icon}</div>
                    <div className="font-display font-black text-2xl text-navy">{s.value}</div>
                    <div className="text-gray-400 text-xs font-semibold uppercase tracking-wide mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Bottom two-col */}
              <div className="grid lg:grid-cols-3 gap-4">
                {/* Sentiment gauge */}
                <div className="bg-white rounded-2xl border-2 border-navy-100 overflow-hidden">
                  <div className="h-1 bg-gold-gradient" />
                  <div className="p-5">
                    <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Sentiment Pulse</div>
                    <div className="flex items-end justify-between mb-2">
                      <span className="font-display text-4xl font-black text-navy">73%</span>
                      <span className="text-xs text-green-600 font-semibold">favorable</span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden mb-3">
                      <div className="h-full w-[73%] rounded-full bg-gradient-to-r from-green-400 to-green-600" />
                    </div>
                    <div className="space-y-1.5">
                      {[{ s: 'Positive', n: 118 }, { s: 'Neutral', n: 86 }, { s: 'Negative', n: 43 }].map(r => (
                        <div key={r.s} className="flex items-center justify-between text-xs">
                          <SentimentPill s={r.s} />
                          <span className="font-bold text-gray-700">{r.n}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Recent articles */}
                <div className="lg:col-span-2 bg-white rounded-2xl border-2 border-navy-100 overflow-hidden">
                  <div className="h-1 bg-red-gradient" />
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-xs font-bold uppercase tracking-widest text-gray-400">Latest Intelligence</div>
                      <span className="text-xs text-navy-400 font-semibold">View All →</span>
                    </div>
                    <ul className="divide-y divide-gray-100">
                      {SAMPLE_ARTICLES.map(a => (
                        <li key={a.title} className="py-2.5 flex items-start gap-2.5">
                          <span className="text-gold-500 text-xs mt-0.5 select-none">★</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-xs text-navy line-clamp-1">{a.title}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">{a.outlet} · {a.date}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <BucketPill b={a.bucket} />
                            <SentimentPill s={a.sentiment} />
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── News Tracker Preview ── */}
      <section className="py-16 bg-white">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-gray-200" />
            <div className="flex items-center gap-2 bg-navy text-gold-400 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full">
              ★ News Intelligence
            </div>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-gray-200" />
          </div>

          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="font-display font-black text-navy text-3xl md:text-4xl leading-tight mb-4">
                Every story.<br /><span className="text-red-500">Every outlet.</span><br />Every day.
              </h2>
              <p className="text-gray-500 leading-relaxed mb-5">
                CampaignAssist scans hundreds of news sources and automatically classifies every article — your coverage, your opponent's coverage, district news, and hot-button issues. Each story is scored for sentiment so you always know where you stand.
              </p>
              <div className="flex flex-wrap gap-2">
                {['Candidate Coverage', 'Opponent Coverage', 'General Race', 'Hot Buttons'].map(b => (
                  <span key={b} className="bg-navy text-gold-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">{b}</span>
                ))}
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden border-2 border-navy-100 shadow-patriot bg-white">
              <div className="h-1.5 bg-red-gradient" />
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">News Tracker — All Categories</h3>
                  <span className="bg-navy text-gold-400 text-[10px] font-black px-2.5 py-1 rounded-full">247 stories</span>
                </div>
                <div className="space-y-2.5">
                  {SAMPLE_ARTICLES.map(a => (
                    <div key={a.title} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                      <span className="text-gold-500 text-sm mt-0.5">★</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-navy line-clamp-1">{a.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{a.outlet} · {a.date}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <BucketPill b={a.bucket} />
                        <SentimentPill s={a.sentiment} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Constituent + Voter Preview ── */}
      <section className="py-16 bg-navy relative overflow-hidden">
        <div className="absolute inset-0 bg-stripe-pattern opacity-10" />
        <div className="absolute right-0 top-0 bottom-0 opacity-[0.03] flex items-center justify-end pr-12 select-none pointer-events-none">
          <span className="text-white font-black" style={{ fontSize: '24rem', lineHeight: 1 }}>🗺</span>
        </div>
        <div className="relative container mx-auto max-w-7xl px-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
            <div className="flex items-center gap-2 bg-gold-400 text-navy text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full">
              ★ Constituent Intelligence
            </div>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
          </div>

          <div className="grid md:grid-cols-2 gap-10 items-start">
            {/* Constituent profile mockup */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <span className="text-2xl">🗺️</span>
                <div>
                  <div className="text-white font-bold text-sm">District 14 — Ohio Constituent Profile</div>
                  <div className="flex gap-1.5 mt-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-900/50 text-green-400">✓ U.S. Census Bureau, 2022 ACS 5-Year</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-900/50 text-green-400">✓ BLS, Apr 2025</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-5">
                {[
                  { label: 'Population', value: '742,394' },
                  { label: 'Median Income', value: '$58,200' },
                  { label: 'Median Age', value: '41.2' },
                  { label: 'Unemployment', value: '4.1%' },
                  { label: 'Homeownership', value: '67.3%' },
                  { label: 'Veterans', value: '8.4%' },
                ].map(d => (
                  <div key={d.label} className="bg-white/5 rounded-xl p-3">
                    <div className="text-blue-400 text-[10px] uppercase tracking-widest font-bold mb-0.5">{d.label}</div>
                    <div className="text-gold-400 font-black text-xl">{d.value}</div>
                  </div>
                ))}
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="text-blue-300 text-xs font-bold uppercase tracking-widest mb-2">AI Strategic Analysis</div>
                <p className="text-blue-100 text-sm leading-relaxed">
                  District 14 leans competitive, with a strong working-class base in the western precincts and a growing suburban corridor in the east. Veterans (8.4%) and homeowners (67.3%) are overrepresented relative to state averages — reliable engagement targets. Focus persuasion resources on the 35–54 age cohort, where registration is high but turnout is inconsistent.
                </p>
              </div>
            </div>

            {/* Voter segments mockup */}
            <div>
              <h2 className="font-display font-black text-white text-3xl md:text-4xl leading-tight mb-4">
                Know exactly<br /><span className="text-gold-400">who to talk to.</span>
              </h2>
              <p className="text-blue-200 leading-relaxed mb-6">
                Upload your voter file and CampaignAssist instantly segments your list into actionable groups — AI-tagged by issue interest, support level, and turnout history.
              </p>
              <div className="space-y-3">
                {SAMPLE_SEGMENTS.map(seg => (
                  <div key={seg.label} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4">
                    <div className={`w-2 h-10 rounded-full ${seg.color} shrink-0`} />
                    <div className="flex-1">
                      <div className="text-white font-bold text-sm">{seg.label}</div>
                      <div className="text-blue-400 text-xs mt-0.5">{seg.count.toLocaleString()} voters identified</div>
                    </div>
                    <div className="text-gold-400 font-black text-sm">{seg.count.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Polling Preview ── */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-gray-200" />
            <div className="flex items-center gap-2 bg-navy text-gold-400 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full">
              ★ Polling & Analytics
            </div>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-gray-200" />
          </div>

          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="font-display font-black text-navy text-3xl md:text-4xl leading-tight mb-4">
                Always know<br /><span className="text-blue-500">where you stand.</span>
              </h2>
              <p className="text-gray-500 leading-relaxed">
                CampaignAssist extracts polling data from news coverage and visualizes your position in the race automatically — no manual entry needed.
              </p>
            </div>

            <div className="bg-white rounded-2xl border-2 border-navy-100 shadow-patriot overflow-hidden">
              <div className="h-1.5 bg-gold-gradient" />
              <div className="p-6">
                <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Polling Tracker — District 14 Special Election</div>
                <div className="space-y-4">
                  {SAMPLE_POLLS.map(p => (
                    <div key={p.label}>
                      <div className="flex justify-between text-sm font-bold mb-1.5">
                        <span className={p.isOurs ? 'text-navy' : 'text-gray-500'}>{p.label}</span>
                        <span className={p.isOurs ? 'text-navy font-black' : 'text-gray-400'}>{p.value}%</span>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${p.isOurs ? 'bg-gradient-to-r from-blue-500 to-blue-700' : p.label === 'Undecided' ? 'bg-gray-300' : 'bg-gradient-to-r from-red-400 to-red-600'}`}
                          style={{ width: `${p.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-4">Source: Extracted from news coverage · Updated automatically</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Full Feature List ── */}
      <section className="py-16 bg-white">
        <div className="container mx-auto max-w-7xl px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-navy text-gold-400 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
              ✦ Every Tool Included
            </div>
            <h2 className="font-display font-black text-navy text-4xl md:text-5xl">
              Six tools. One dashboard.<br />Zero learning curve.
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES_PREVIEW.map(f => (
              <div key={f.title} className={`rounded-2xl border-2 ${f.color} p-6 hover:-translate-y-1 hover:shadow-md transition-all`}>
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-black text-navy text-base uppercase tracking-wide mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
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
          <p className="text-blue-200 text-lg mb-8">
            Everything you just saw is live and ready to go. Set up takes two minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/signup"
              className="bg-gold-400 hover:bg-gold-500 text-navy font-black text-sm px-10 py-4 rounded-xl transition-all shadow-2xl hover:-translate-y-0.5">
              🚀 Let's get your campaign up and running!
            </Link>
            <Link href="/"
              className="border-2 border-white/20 hover:border-white/50 text-white font-medium text-sm px-8 py-4 rounded-xl transition-colors">
              ← Back to Home
            </Link>
          </div>
          <p className="text-blue-400/50 text-xs mt-4">Free to start. No credit card needed.</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-navy">
        <div className="h-1.5 bg-gradient-to-r from-red-600 via-white/20 to-blue-700 opacity-60" />
        <div className="container mx-auto max-w-7xl px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-gradient flex items-center justify-center text-base text-white font-bold shadow-glow-red">★</div>
            <span className="font-display font-bold tracking-widest uppercase text-white text-lg">
              Campaign<span className="text-gold-400">Assist</span>
            </span>
          </Link>
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
