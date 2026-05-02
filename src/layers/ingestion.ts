import { prisma } from '@/lib/db'
import { classifyArticle } from './classification'
import { summarizeArticle } from './summarization'
import type { IngestPayload } from '@/lib/types'

export async function ingestArticle(
  payload: IngestPayload,
  candidateName: string,
  opponentName?: string,
) {
  const outlet = await prisma.outlet.findUnique({ where: { id: payload.outletId } })
  if (!outlet) throw new Error(`Outlet ${payload.outletId} not found`)

  const existing = await prisma.article.findFirst({ where: { url: payload.url, userId: null } })
  if (existing) return existing

  const [classification, summary] = await Promise.all([
    classifyArticle(payload.title, payload.rawText, candidateName, opponentName),
    summarizeArticle(payload.title, payload.rawText, outlet.name, payload.datePublished),
  ])

  const article = await prisma.article.create({
    data: {
      title: payload.title,
      url: payload.url,
      datePublished: new Date(payload.datePublished),
      outletId: payload.outletId,
      author: payload.author,
      language: payload.language ?? 'en',
      region: payload.region,
      sourceType: payload.sourceType,
      rawText: payload.rawText,
      summary,
      bucket: classification.bucket,
      topics: JSON.stringify(classification.topics),
      sentiment: classification.sentiment,
      confidence: classification.confidence,
    },
  })

  await prisma.auditLog.create({
    data: { action: 'ingest', entity: 'Article', entityId: article.id },
  })

  return article
}
