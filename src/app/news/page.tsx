export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import NewsClient from '@/components/NewsClient'

const BUCKETS = ['CandidateCoverage', 'OpponentCoverage', 'GeneralRace', 'HotButtons'] as const

async function getData() {
  const [candidates, articlesByBucket] = await Promise.all([
    prisma.candidate.findMany({ orderBy: { name: 'asc' } }),
    Promise.all(
      BUCKETS.map((bucket) =>
        prisma.article.findMany({
          where: { bucket },
          include: { outlet: true },
          orderBy: { datePublished: 'desc' },
          take: 200,
        }),
      ),
    ),
  ])

  return {
    candidates,
    buckets: Object.fromEntries(BUCKETS.map((b, i) => [b, articlesByBucket[i]])),
  }
}

export default async function NewsPage() {
  try {
    const { candidates, buckets } = await getData()
    return (
      <section aria-labelledby="news-heading">
        <h1 id="news-heading" className="text-2xl font-bold text-gray-900 mb-6">News Tracker</h1>
        <NewsClient candidates={candidates} initialBuckets={buckets} />
      </section>
    )
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return (
      <section>
        <h1 className="text-2xl font-bold text-red-600 mb-4">Database Error</h1>
        <pre className="text-sm bg-red-50 p-4 rounded overflow-auto">{msg}</pre>
      </section>
    )
  }
}
