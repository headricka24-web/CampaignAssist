export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import StatCard from '@/components/StatCard'
import SentimentBadge from '@/components/SentimentBadge'
import MorningBrief from '@/components/MorningBrief'
import PollTracker from '@/components/PollTracker'
import Link from 'next/link'

type Threat = {
  severity: 'HIGH' | 'MEDIUM' | 'LOW'
  threat: string
  angle: string
  why: string
}

async function getDashboardData(userId: string) {
  const yesterday = new Date(Date.now() - 86_400_000)
  const where = { userId }

  const [
    total, newToday, byBucket, bySentiment, articles,
    lastArticle, warRoomContent, hotButtonsContent,
  ] = await Promise.all([
    prisma.article.count({ where }),
    prisma.article.count({ where: { ...where, createdAt: { gte: yesterday } } }),
    prisma.article.groupBy({ by: ['bucket'], where, _count: true }),
    prisma.article.groupBy({ by: ['sentiment'], where, _count: true }),
    prisma.article.findMany({
      where,
      orderBy: { datePublished: 'desc' },
      take: 6,
      include: { outlet: true },
    }),
    prisma.article.findFirst({ where, orderBy: { createdAt: 'desc' }, select: { createdAt: true } }),
    prisma.generatedContent.findUnique({ where: { userId_type: { userId, type: 'war-room-threats' } } }),
    prisma.generatedContent.findUnique({ where: { userId_type: { userId, type: 'hot-buttons-briefing' } } }),
  ])

  // Parse war room threats
  let threats: Threat[] = []
  if (warRoomContent?.content) {
    try { threats = JSON.parse(warRoomContent.content) } catch { /* ignore */ }
  }

  // Parse hot buttons briefing into a short summary (first 300 chars)
  const hotButtonSnippet = hotButtonsContent?.content
    ? hotButtonsContent.content.replace(/\*\*/g, '').replace(/#{1,3}\s/g, '').replace(/\n+/g, ' ').slice(0, 280).trim()
    : null

  return {
    total, newToday, byBucket, bySentiment,
    recentArticles: articles,
    lastScanned: lastArticle?.createdAt ?? null,
    threats,
    hotButtonSnippet,
  }
}

const bucketAccent: Record<string, 'blue' | 'red' | 'gold' | 'green'> = {
  CandidateCoverage: 'blue',
  OpponentCoverage:  'red',
  GeneralRace:       'gold',
  HotButtons:        'green',
}

const bucketIcon: Record<string, string> = {
  CandidateCoverage: '🗳️',
  OpponentCoverage:  '⚔️',
  GeneralRace:       '🏛️',
  HotButtons:        '🔥',
}

const SEV_STYLE = {
  HIGH:   { badge: 'bg-red-100 text-red-700 border-red-200',       bar: 'bg-red-500',    icon: '🚨' },
  MEDIUM: { badge: 'bg-yellow-100 text-yellow-700 border-yellow-200', bar: 'bg-yellow-400', icon: '⚠️' },
  LOW:    { badge: 'bg-blue-100 text-blue-700 border-blue-200',     bar: 'bg-blue-400',   icon: '👁' },
}

function timeAgo(date: Date): string {
  const mins  = Math.floor((Date.now() - date.getTime()) / 60_000)
  if (mins < 2)   return 'Just now'
  if (mins < 60)  return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default async function DashboardPage() {
  const session   = await auth()
  const userId    = session?.user?.id
  if (!userId) return null

  const candidate = await prisma.candidate.findFirst({
    where:  { userId },
    select: { id: true, name: true, race: true, state: true },
  })

  const {
    total, newToday, byBucket, bySentiment,
    recentArticles, lastScanned, threats, hotButtonSnippet,
  } = await getDashboardData(userId)

  const positiveCount  = bySentiment.find(s => s.sentiment === 'Positive')?._count ?? 0
  const negativeCount  = bySentiment.find(s => s.sentiment === 'Negative')?._count ?? 0
  const scoredCount    = positiveCount + negativeCount
  const sentimentScore = scoredCount > 0 ? Math.round((positiveCount / scoredCount) * 100) : 0

  const highThreats = threats.filter(t => t.severity === 'HIGH')
  const topThreats  = highThreats.length > 0 ? highThreats.slice(0, 2) : threats.slice(0, 2)

  // Build priority action items
  type Priority = { icon: string; label: string; desc: string; href: string; tag: 'URGENT' | 'TODAY' | 'READY' }
  const priorities: Priority[] = []

  if (total === 0) {
    priorities.push({ icon: '📰', label: 'Run your first news scan', desc: 'Populate your intelligence feed to unlock all features.', href: '/news', tag: 'URGENT' })
  } else if (newToday === 0) {
    priorities.push({ icon: '🔄', label: 'Refresh your news feed', desc: `Last scanned ${lastScanned ? timeAgo(lastScanned) : 'a while ago'} — get today's coverage.`, href: '/news', tag: 'TODAY' })
  }

  if (threats.length === 0 && total > 0) {
    priorities.push({ icon: '🚨', label: 'Scan for threats', desc: 'Check the War Room for attack angles in today\'s coverage.', href: '/war-room', tag: 'TODAY' })
  } else if (highThreats.length > 0) {
    priorities.push({ icon: '🚨', label: `${highThreats.length} HIGH threat${highThreats.length > 1 ? 's' : ''} need a response`, desc: highThreats[0]?.threat ?? '', href: '/war-room', tag: 'URGENT' })
  }

  if (total > 0) {
    priorities.push({ icon: '📣', label: 'Generate today\'s content', desc: 'Facebook, Instagram, newsletter — all ready in seconds.', href: '/media', tag: 'READY' })
    priorities.push({ icon: '💰', label: 'Build a fundraising ask', desc: 'Email appeal, call script, or donor pitch — pick your format.', href: '/legislative', tag: 'READY' })
  }

  if (!hotButtonSnippet && total > 0) {
    priorities.push({ icon: '🔥', label: 'Check voter hot buttons', desc: 'See what issues are moving voters in your state right now.', href: '/briefing', tag: 'TODAY' })
  }

  const tagStyle = {
    URGENT: 'bg-red-100 text-red-700',
    TODAY:  'bg-yellow-100 text-yellow-700',
    READY:  'bg-green-100 text-green-700',
  }

  return (
    <div className="space-y-8">

      {/* ── Hero Banner ──────────────────────────────────────────── */}
      <div className="relative rounded-2xl overflow-hidden bg-hero-gradient shadow-patriot">
        <div className="absolute inset-0 bg-stripe-pattern opacity-50" />
        <div className="absolute top-4 right-6 text-white opacity-10 text-7xl select-none leading-none">
          ★★★<br/>★★★★<br/>★★★
        </div>
        <div className="relative px-8 py-10">
          <div className="inline-flex items-center gap-2 bg-red-500 bg-opacity-80 text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            Live Intelligence Feed
            {lastScanned && (
              <span className="ml-1 opacity-75">· updated {timeAgo(lastScanned)}</span>
            )}
          </div>

          {candidate ? (
            <>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h1 className="font-display text-4xl font-bold text-white leading-tight">
                    {candidate.name}
                  </h1>
                  {(candidate.race || candidate.state) && (
                    <p className="text-blue-300 text-sm mt-1 font-medium">
                      {[candidate.race, candidate.state].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>
                <Link href="/my-candidate"
                  className="shrink-0 inline-flex items-center gap-1.5 border border-gold-400/50 hover:border-gold-400 text-gold-400 hover:bg-gold-400/10 text-xs font-black uppercase tracking-widest px-4 py-2 rounded-lg transition-all mt-1">
                  ★ My Candidate
                </Link>
              </div>
              <div className="flex gap-3 mt-6">
                <Link href="/news"
                  className="bg-red-500 hover:bg-red-600 text-white font-bold px-6 py-2.5 rounded-lg text-sm tracking-wide transition-colors shadow-glow-red focus:outline-none focus:ring-2 focus:ring-gold-400">
                  ★ Run Intelligence Scan
                </Link>
                <Link href="/war-room"
                  className="border border-gold-400 text-gold-400 hover:bg-gold-400 hover:text-navy font-bold px-6 py-2.5 rounded-lg text-sm tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-gold-400">
                  Enter War Room
                </Link>
              </div>
            </>
          ) : (
            <>
              <h1 className="font-display text-4xl font-bold text-white leading-tight mb-3">
                Campaign Intelligence HQ
              </h1>
              <p className="text-blue-200 text-base max-w-xl mb-6">
                Add your candidate to personalize your intelligence feed, constituent profiles, and voter analysis.
              </p>
              <div className="flex gap-3">
                <Link href="/my-candidate"
                  className="bg-gold-400 hover:bg-gold-500 text-navy font-black px-6 py-2.5 rounded-lg text-sm tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-white">
                  ★ My Candidate
                </Link>
                <Link href="/news"
                  className="border border-white/30 text-white hover:bg-white/10 font-bold px-6 py-2.5 rounded-lg text-sm tracking-wide transition-colors">
                  Run Intelligence Scan
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Stats Row ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link href="/news"><StatCard label="Stories Monitored"  value={total}         accent="blue"  icon="📰" /></Link>
        <Link href="/news?tab=breaking"><StatCard label="Breaking Today"     value={newToday}      accent="gold"  icon="⚡" /></Link>
        <Link href="/news?tab=favorable"><StatCard label="Favorable"          value={positiveCount} accent="green" icon="▲" /></Link>
        <Link href="/news?tab=opposition"><StatCard label="Opposition"         value={negativeCount} accent="red"   icon="▼" /></Link>
      </div>

      {/* ── Command Center: 3-column layout ───────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* TODAY'S PRIORITIES */}
        <div className="lg:col-span-1 bg-white rounded-2xl border-2 border-navy-100 shadow-patriot overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-gold-400 to-red-500" />
          <div className="p-5">
            <h2 className="text-xs font-black uppercase tracking-[0.25em] text-gray-400 mb-4">Today's Priorities</h2>
            {priorities.length === 0 ? (
              <div className="py-4 text-center">
                <div className="text-3xl mb-2">✅</div>
                <p className="text-sm text-gray-500 font-semibold">You're all caught up.</p>
                <p className="text-xs text-gray-400 mt-1">Check back after your next scan.</p>
              </div>
            ) : (
              <ul className="space-y-2.5">
                {priorities.map((p, i) => (
                  <li key={i}>
                    <Link href={p.href}
                      className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:border-navy-200 hover:bg-gray-50 transition-all group">
                      <span className="text-xl shrink-0 mt-0.5">{p.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className="text-xs font-black text-navy group-hover:text-red-500 transition-colors leading-snug">{p.label}</span>
                          <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full ${tagStyle[p.tag]}`}>{p.tag}</span>
                        </div>
                        <p className="text-[11px] text-gray-400 line-clamp-2 leading-snug">{p.desc}</p>
                      </div>
                      <span className="text-gray-300 group-hover:text-navy text-xs mt-1 shrink-0 transition-colors">→</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* WAR ROOM SNAPSHOT */}
        <div className="lg:col-span-2 bg-white rounded-2xl border-2 border-red-100 shadow-patriot overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-red-500 to-red-700" />
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-black uppercase tracking-[0.25em] text-gray-400">War Room — Active Threats</h2>
              <Link href="/war-room" className="text-xs text-red-500 hover:text-red-700 font-bold transition-colors">
                Full War Room →
              </Link>
            </div>

            {topThreats.length === 0 ? (
              <div className="py-6 text-center">
                <div className="text-4xl mb-3 opacity-20">🚨</div>
                <p className="text-sm text-gray-500 font-semibold">No threats scanned yet.</p>
                <p className="text-xs text-gray-400 mt-1 mb-4">Run a War Room scan to detect attack angles in your news feed.</p>
                <Link href="/war-room"
                  className="inline-block bg-red-500 hover:bg-red-600 text-white text-xs font-black uppercase tracking-widest px-5 py-2.5 rounded-xl transition-colors">
                  🚨 Scan for Threats
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {topThreats.map((t, i) => {
                  const s = SEV_STYLE[t.severity] ?? SEV_STYLE.MEDIUM
                  return (
                    <div key={i} className={`rounded-xl border p-4 ${s.badge.split(' ').find(c => c.startsWith('border-')) ?? 'border-gray-200'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span>{s.icon}</span>
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${s.badge}`}>
                          {t.severity}
                        </span>
                      </div>
                      <p className="text-xs font-black text-navy mb-1 leading-snug">{t.threat}</p>
                      <p className="text-[11px] text-gray-500 line-clamp-2">{t.angle}</p>
                    </div>
                  )
                })}
                {threats.length > 2 && (
                  <Link href="/war-room" className="block text-center text-xs text-gray-400 hover:text-red-500 font-bold py-1 transition-colors">
                    +{threats.length - 2} more threats → View all
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Morning Brief ─────────────────────────────────────────── */}
      <MorningBrief />

      {/* ── Hot Buttons Snapshot + Sentiment + Recent Articles ────── */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Sentiment + Hot Buttons stacked */}
        <div className="space-y-6">

          {/* Sentiment Gauge */}
          <div className="bg-white rounded-2xl border-2 border-navy-100 shadow-patriot overflow-hidden">
            <div className="h-1 bg-gold-gradient" />
            <div className="p-5">
              <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Sentiment Pulse</h2>
              <div className="flex items-end justify-between mb-3">
                <span className="font-display text-5xl font-bold text-navy">{sentimentScore}%</span>
                <span className="text-xs text-green-600 font-semibold">favorable</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-4">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-1000"
                  style={{ width: `${sentimentScore}%` }}
                  role="meter" aria-valuenow={sentimentScore} aria-valuemin={0} aria-valuemax={100}
                />
              </div>
              <ul className="space-y-1.5">
                {bySentiment.map(s => (
                  <li key={s.sentiment} className="flex items-center justify-between text-sm">
                    <SentimentBadge sentiment={s.sentiment} />
                    <span className="font-bold text-gray-700">{s._count.toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Hot Buttons Snapshot */}
          <div className="bg-white rounded-2xl border-2 border-orange-100 shadow-sm overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-orange-400 to-red-500" />
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-black uppercase tracking-[0.25em] text-gray-400">Hot Button Issues</h2>
                <Link href="/briefing" className="text-xs text-orange-500 hover:text-orange-700 font-bold transition-colors">
                  Full Briefing →
                </Link>
              </div>
              {hotButtonSnippet ? (
                <p className="text-xs text-gray-600 leading-relaxed line-clamp-5">{hotButtonSnippet}…</p>
              ) : (
                <div className="py-3 text-center">
                  <p className="text-xs text-gray-400 mb-3">No briefing generated yet.</p>
                  <Link href="/briefing"
                    className="inline-block text-xs font-black uppercase tracking-widest bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl transition-colors">
                    🔥 Scan Live Issues
                  </Link>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Intelligence Breakdown + Recent Articles */}
        <div className="lg:col-span-2 space-y-6">

          {/* Bucket Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {byBucket.map(b => (
              <StatCard
                key={b.bucket}
                label={b.bucket?.replace(/([A-Z])/g, ' $1').trim() ?? 'Unclassified'}
                value={b._count}
                accent={bucketAccent[b.bucket ?? ''] ?? 'blue'}
                icon={bucketIcon[b.bucket ?? '']}
              />
            ))}
          </div>

          {/* Recent Articles */}
          <div className="bg-white rounded-2xl border-2 border-navy-100 shadow-patriot overflow-hidden">
            <div className="h-1 bg-red-gradient" />
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Latest Intelligence</h2>
                <Link href="/news" className="text-xs text-navy-400 hover:text-red-500 font-semibold transition-colors">
                  View All →
                </Link>
              </div>
              <ul className="divide-y divide-gray-100">
                {recentArticles.map(a => (
                  <li key={a.id} className="py-3 flex items-start gap-3 group">
                    <span className="text-gold-500 text-xs mt-0.5 select-none">★</span>
                    <div className="flex-1 min-w-0">
                      <a href={a.url} target="_blank" rel="noopener noreferrer"
                        className="font-semibold text-sm text-navy hover:text-red-500 transition-colors line-clamp-1 focus:outline-none focus:underline">
                        {a.title}
                      </a>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {a.outlet.name} · {new Date(a.datePublished).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <SentimentBadge sentiment={a.sentiment} />
                  </li>
                ))}
                {recentArticles.length === 0 && (
                  <li className="py-10 text-center">
                    <p className="text-gray-500 font-semibold text-sm">Your intelligence feed is ready.</p>
                    <p className="text-gray-400 text-xs mt-1 mb-4">Run your first scan to start tracking coverage.</p>
                    <Link href="/news"
                      className="inline-block bg-navy text-white text-xs font-bold px-5 py-2.5 rounded-lg hover:bg-navy-700 transition-colors">
                      ★ Start Intelligence Scan
                    </Link>
                  </li>
                )}
              </ul>
            </div>
          </div>

        </div>
      </div>

      {/* ── Polling Tracker ───────────────────────────────────────── */}
      <PollTracker />

    </div>
  )
}
