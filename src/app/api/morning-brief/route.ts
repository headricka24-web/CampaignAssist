import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import { ask } from '@/lib/claude'
import { buildRaceContext } from '@/lib/raceContext'

export const maxDuration = 60

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

export async function GET() {
  const session = await auth()
  const userId  = session?.user?.id
  if (!userId) return NextResponse.json({ content: null })

  const date     = todayKey()
  const existing = await prisma.dailyBrief.findFirst({
    where: { date, userId },
  })
  if (existing) return NextResponse.json({ content: existing.content, cached: true })
  return NextResponse.json({ content: null })
}

export async function POST() {
  const session = await auth()
  const userId  = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const date     = todayKey()
  const existing = await prisma.dailyBrief.findFirst({
    where: { date, userId },
  })
  if (existing) return NextResponse.json({ content: existing.content, cached: true })

  const candidate = await prisma.candidate.findFirst({
    where: { userId },
    select: { name: true, race: true, state: true, incumbent: true, raceLevel: true, district: true, county: true, city: true },
  })
  const name      = candidate?.name      ?? 'the candidate'
  const race      = candidate?.race      ?? 'this race'
  const state     = candidate?.state     ?? 'the state'
  const incumbent = candidate?.incumbent ? 'incumbent' : 'challenger'
  const raceCtx   = candidate ? buildRaceContext({ ...candidate, name, race, state, incumbent: candidate.incumbent ?? false }) : `CANDIDATE: ${name}, running for ${race} in ${state}.`

  const articles = await prisma.article.findMany({
    where:   { userId },
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
    `${raceCtx}

Here are today's news articles. Write a morning brief covering:
1. The most important developments affecting this race
2. What each means for the Republican campaign strategy
3. Any threats from opponents or the media to counter
4. Opportunities to press the conservative advantage

Articles:\n\n${bulletList}`,
  )

  await prisma.dailyBrief.create({
    data: { date, userId, content },
  })

  return NextResponse.json({ content, cached: false })
}
