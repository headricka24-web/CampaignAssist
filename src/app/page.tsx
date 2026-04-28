export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import StatCard from '@/components/StatCard'
import SentimentBadge from '@/components/SentimentBadge'
import MorningBrief from '@/components/MorningBrief'
import Link from 'next/link'

async function getStats() {
  try {
    const yesterday = new Date(Date.now() - 86_400_000)
    const [total, newToday, byBucket, bySentiment, articles] = await Promise.all([
      prisma.article.count(),
      prisma.article.count({ where: { createdAt: { gte: yesterday } } }),
      prisma.article.groupBy({ by: ['bucket'], _count: true }),
      prisma.article.groupBy({ by: ['sentiment'], _count: true }),
      prisma.article.findMany({
        orderBy: { datePublished: 'desc' },
        take: 8,
        include: { outlet: true },
      }),
    ])
    return { total, newToday, byBucket, bySentiment, recentArticles: articles }
  } catch {
    return { total: 0, newToday: 0, byBucket: [], bySentiment: [], recentArticles: [] }
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

export default async function DashboardPage() {
  const { total, newToday, byBucket, bySentiment, recentArticles } = await getStats()

  const positiveCount = bySentiment.find(s => s.sentiment === 'Positive')?._count ?? 0
  const negativeCount = bySentiment.find(s => s.sentiment === 'Negative')?._count ?? 0
  const sentimentScore = total > 0 ? Math.round((positiveCount / total) * 100) : 0

  return (
    <div className="space-y-8">

      {/* Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-hero-gradient shadow-patriot">
        <div className="absolute inset-0 bg-stripe-pattern opacity-50" />
        {/* Stars decoration */}
        <div className="absolute top-4 right-6 text-white opacity-10 text-7xl select-none leading-none">
          ★★★<br/>★★★★<br/>★★★
        </div>
        <div className="relative px-8 py-10">
          <div className="inline-flex items-center gap-2 bg-red-500 bg-opacity-80 text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            Live Intelligence Feed
          </div>
          <h1 className="font-display text-4xl font-bold text-white leading-tight mb-2">
            Know Your Race.<br />
            <span className="text-gold-400">Own the Narrative.</span>
          </h1>
          <p className="text-blue-200 text-lg max-w-xl">
            Your campaign's 24/7 AI war room — monitoring every story, tracking every opponent move, and turning raw news into winning strategy.
          </p>
          <div className="flex gap-3 mt-6">
            <Link href="/news"
              className="bg-red-500 hover:bg-red-600 text-white font-bold px-6 py-2.5 rounded-lg text-sm tracking-wide transition-colors shadow-glow-red focus:outline-none focus:ring-2 focus:ring-gold-400">
              ★ Scan the News
            </Link>
            <Link href="/briefing"
              className="border border-gold-400 text-gold-400 hover:bg-gold-400 hover:text-navy font-bold px-6 py-2.5 rounded-lg text-sm tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-gold-400">
              Generate Brief
            </Link>
          </div>
        </div>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Articles Tracked"  value={total}         accent="blue"  icon="📰" />
        <StatCard label="New Today"          value={newToday}      accent="gold"  icon="⚡" />
        <StatCard label="Favorable Coverage" value={positiveCount} accent="green" icon="▲" />
        <StatCard label="Negative Coverage"  value={negativeCount} accent="red"   icon="▼" />
      </div>

      {/* Bucket Breakdown */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px flex-1 bg-gradient-to-r from-navy-300 to-transparent" />
          <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-navy-400">Coverage Breakdown</h2>
          <div className="h-px flex-1 bg-gradient-to-l from-navy-300 to-transparent" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
      </div>

      {/* Morning Brief */}
      <MorningBrief />

      {/* Bottom two-column */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Sentiment Gauge */}
        <div className="bg-white rounded-2xl border-2 border-navy-100 shadow-patriot overflow-hidden">
          <div className="h-1 bg-gold-gradient" />
          <div className="p-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Sentiment Pulse</h2>
            <div className="flex items-end justify-between mb-3">
              <span className="font-display text-5xl font-bold text-navy">{sentimentScore}%</span>
              <span className="text-sm text-green-600 font-semibold">Favorable</span>
            </div>
            {/* Bar */}
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-4">
              <div
                className="h-full rounded-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-1000"
                style={{ width: `${sentimentScore}%` }}
                role="meter"
                aria-valuenow={sentimentScore}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${sentimentScore}% favorable sentiment`}
              />
            </div>
            <ul className="space-y-2">
              {bySentiment.map(s => (
                <li key={s.sentiment} className="flex items-center justify-between text-sm">
                  <SentimentBadge sentiment={s.sentiment} />
                  <span className="font-bold text-gray-700">{s._count.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Recent Articles */}
        <div className="lg:col-span-2 bg-white rounded-2xl border-2 border-navy-100 shadow-patriot overflow-hidden">
          <div className="h-1 bg-red-gradient" />
          <div className="p-6">
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
                <li className="py-8 text-center">
                  <p className="text-gray-400 text-sm">No articles yet.</p>
                  <Link href="/settings" className="text-navy-400 text-xs hover:text-red-500 font-semibold mt-1 inline-block">
                    Add a candidate in Settings to get started →
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </div>

      </div>
    </div>
  )
}
