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

export async function POST(req: Request) {
  const session = await auth()
  const userId  = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const force = searchParams.get('force') === 'true'

  const date     = todayKey()
  const existing = await prisma.dailyBrief.findFirst({
    where: { date, userId },
  })
  if (existing && !force) return NextResponse.json({ content: existing.content, cached: true })

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
    `You are a seasoned Republican political communications director writing a morning intelligence brief for a GOP campaign team. Write from a conservative, Republican perspective.

Your job is to deliver a genuinely informative strategic briefing — not a collection of punchy one-liners, but substantive analysis that helps the team understand what is happening, why it matters, and what to do about it. For each key development or threat, include relevant policy context and background so the team understands the substance of the issue, not just the headline. Write in organized paragraphs with clear headers. Keep the total brief to 450-600 words.`,
    `${raceCtx}

Here are today's news articles. Write a morning intelligence brief covering:
1. KEY DEVELOPMENTS — The 2-3 most important stories affecting this race. For each: summarize what's happening, explain the relevant policy or political context, and assess what it means for the campaign's strategy.
2. ACTIVE THREATS — Specific attacks, narratives, or media angles the campaign should be prepared to counter. For each threat, explain the underlying issue and suggest a substantive Republican response.
3. OPPORTUNITIES — Where the conservative message can gain ground today and why.

Articles:\n\n${bulletList}`,
  )

  await prisma.dailyBrief.upsert({
    where:  { date_userId: { date, userId } },
    update: { content },
    create: { date, userId, content },
  })

  return NextResponse.json({ content, cached: false })
}
