import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { summarizeArticle } from '@/layers/summarization'

export const maxDuration = 60

const delay = (ms: number) => new Promise(r => setTimeout(r, ms))

export async function POST() {
  const pending = await prisma.article.findMany({
    where: { summary: null },
    include: { outlet: true },
    take: 10, // small batch to respect rate limits
  })

  if (pending.length === 0) {
    return NextResponse.json({ updated: 0, message: 'All articles already have summaries.' })
  }

  let updated = 0
  let errors  = 0
  const errorMessages: string[] = []

  for (const article of pending) {
    try {
      const summary = await summarizeArticle(
        article.title,
        article.rawText || article.title,
        article.outlet.name,
        article.datePublished.toISOString(),
      )
      await prisma.article.update({ where: { id: article.id }, data: { summary } })
      updated++
      await delay(800) // avoid rate limits
    } catch (e) {
      errors++
      const msg = e instanceof Error ? e.message : String(e)
      errorMessages.push(msg.slice(0, 120))
    }
  }

  const totalPending = await prisma.article.count({ where: { summary: null } })

  return NextResponse.json({
    updated,
    errors,
    remaining: totalPending,
    errorSample: errorMessages.slice(0, 3),
  })
}
