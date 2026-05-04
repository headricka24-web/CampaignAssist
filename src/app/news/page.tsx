export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import NewsClient from '@/components/NewsClient'

const BUCKETS = ['CandidateCoverage', 'OpponentCoverage', 'GeneralRace', 'HotButtons'] as const

async function getData(userId: string | null) {
  const where = { userId: userId ?? null }

  const [candidates, articlesByBucket] = await Promise.all([
    prisma.candidate.findMany({
      where: userId ? { userId } : { userId: null },
      orderBy: { name: 'asc' },
    }),
    Promise.all(
      BUCKETS.map((bucket) =>
        prisma.article.findMany({
          where: { ...where, bucket },
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
    const session = await auth()
    const userId  = session?.user?.id ?? null
    const { candidates, buckets } = await getData(userId)
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
