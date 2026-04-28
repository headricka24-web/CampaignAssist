import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ask } from '@/lib/claude'

export const maxDuration = 60

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

export async function GET() {
  const date = todayKey()
  const existing = await prisma.dailyBrief.findUnique({ where: { date } })
  if (existing) return NextResponse.json({ content: existing.content, cached: true })
  return NextResponse.json({ content: null })
}

export async function POST() {
  const date = todayKey()

  const existing = await prisma.dailyBrief.findUnique({ where: { date } })
  if (existing) return NextResponse.json({ content: existing.content, cached: true })

  const candidate = await prisma.candidate.findFirst()
  const name      = candidate?.name      ?? 'the candidate'
  const race      = candidate?.race      ?? 'this race'
  const state     = candidate?.state     ?? 'the state'
  const incumbent = candidate?.incumbent ? 'incumbent' : 'challenger'

  const articles = await prisma.article.findMany({
    include: { outlet: true },
    orderBy: { datePublished: 'desc' },
    take: 40,
  })

  if (articles.length === 0) {
    return NextResponse.json({ content: null, reason: 'no_articles' })
  }

  const bulletList = articles
    .map(a => `- [${a.bucket ?? 'General'}] "${a.title}" (${a.outlet.name}) — ${a.summary ?? a.rawText?.slice(0, 120) ?? ''}`)
    .join('\n')

  const content = await ask(
    `You are a sharp Republican political communications director writing a morning intelligence brief for a GOP campaign team.
Write from a conservative, Republican perspective. Be direct, confident, and tactical — no fluff.
Identify threats from the left and opportunities to advance the Republican message.
Use clear headers and bullet points. Keep the total brief under 350 words.`,
    `Candidate: ${name} (Republican, ${incumbent}), running for ${race} in ${state}.

Here are today's news articles. Write a morning brief covering:
1. The most important developments affecting this race
2. What each means for the Republican campaign strategy
3. Any threats from opponents or the media to counter
4. Opportunities to press the conservative advantage

Articles:\n\n${bulletList}`,
  )

  await prisma.dailyBrief.upsert({
    where:  { date },
    create: { date, content },
    update: { content },
  })

  return NextResponse.json({ content, cached: false })
}
