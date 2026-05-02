import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import {
  scrapeForCandidate,
  scrapeForOpponent,
  scrapeGeneralRace,
  scrapeHotButtons,
} from '@/layers/scraper'
import { classifyArticle } from '@/layers/classification'
import type { ScrapedArticle } from '@/layers/scraper'

export const maxDuration = 60

async function getOrCreateOutlet(name: string) {
  const clean = name.replace(/\s*\(.*?\)\s*/g, '').trim() || name
  const existing = await prisma.outlet.findFirst({ where: { name: clean } })
  if (existing) return existing
  return prisma.outlet.create({ data: { name: clean, type: 'News' } })
}

async function processArticle(
  scraped:       ScrapedArticle,
  candidateName: string,
  opponentName:  string,
  forcedBucket:  string,
  hasApiKey:     boolean,
  userId:        string | null,
) {
  // Deduplicate per user — same URL can exist for different users
  const existing = await prisma.article.findFirst({
    where: { url: scraped.url, userId: userId ?? null },
  })
  if (existing) return { status: 'skipped' }

  const outlet  = await getOrCreateOutlet(scraped.outletName)
  const rawText = scraped.snippet || scraped.title

  let bucket    = forcedBucket
  let topics:   string[] = []
  let sentiment = 'Neutral'
  let confidence = 0.5

  if (hasApiKey) {
    try {
      const cls  = await classifyArticle(scraped.title, rawText, candidateName, opponentName)
      bucket     = cls.bucket
      topics     = cls.topics
      sentiment  = cls.sentiment
      confidence = cls.confidence
    } catch { /* save with defaults */ }
  }

  await prisma.article.create({
    data: {
      userId,
      title:         scraped.title,
      url:           scraped.url,
      datePublished: new Date(scraped.datePublished),
      outletId:      outlet.id,
      language:      'en',
      sourceType:    'News',
      rawText,
      summary:       null,
      bucket,
      topics:        JSON.stringify(topics),
      sentiment,
      confidence,
    },
  })
  return { status: 'ingested' }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  const userId  = session?.user?.id ?? null

  const { candidateId, opponentName, hotButtonTopics } = await req.json() as {
    candidateId: string
    opponentName?: string
    hotButtonTopics?: string[]
  }

  const candidate = await prisma.candidate.findFirst({
    where: { id: candidateId, userId: userId ?? undefined },
  })
  if (!candidate) return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })

  const apiKey    = process.env.ANTHROPIC_API_KEY ?? ''
  const hasApiKey = apiKey.length > 0 && apiKey !== 'your_key_here' && apiKey.startsWith('sk-')
  const opponent  = opponentName ?? ''
  const results   = { ingested: 0, skipped: 0, errors: 0, aiEnabled: hasApiKey }

  const [candidateArticles, opponentArticles, generalArticles, hotButtonArticles] =
    await Promise.allSettled([
      scrapeForCandidate(candidate.name, candidate.state, candidate.race),
      opponent ? scrapeForOpponent(opponent, candidate.state, candidate.race) : Promise.resolve([]),
      scrapeGeneralRace(candidate.race, candidate.state),
      hotButtonTopics?.length ? scrapeHotButtons(hotButtonTopics, candidate.state) : Promise.resolve([]),
    ])

  const batches: [ScrapedArticle[], string][] = [
    [candidateArticles.status === 'fulfilled' ? candidateArticles.value : [], 'CandidateCoverage'],
    [opponentArticles.status  === 'fulfilled' ? opponentArticles.value  : [], 'OpponentCoverage'],
    [generalArticles.status   === 'fulfilled' ? generalArticles.value   : [], 'GeneralRace'],
    [hotButtonArticles.status === 'fulfilled' ? hotButtonArticles.value : [], 'HotButtons'],
  ]

  const allTasks = batches.flatMap(([articles, bucket]) =>
    articles.map(article =>
      processArticle(article, candidate.name, opponent, bucket, hasApiKey, userId)
        .then(r => { if (r.status === 'skipped') results.skipped++; else results.ingested++ })
        .catch(() => { results.errors++ })
    )
  )
  await Promise.all(allTasks)

  await prisma.auditLog.create({
    data: { action: 'scan', entity: 'Candidate', entityId: candidateId, meta: JSON.stringify(results) },
  })

  return NextResponse.json(results)
}
