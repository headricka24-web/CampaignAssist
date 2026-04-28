import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ask } from '@/lib/claude'

function todayKey() {
  return new Date().toISOString().slice(0, 10) // YYYY-MM-DD
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
    `You are a sharp political communications director writing a morning intelligence brief for a campaign team.
Write in a confident, punchy, campaign-staff tone — no fluff. Use clear headers and bullet points.
Keep the total brief under 350 words.`,
    `Here are today's news articles. Write a morning brief summarizing the most important developments,
what they mean for the campaign, and any threats or opportunities to watch:\n\n${bulletList}`,
  )

  await prisma.dailyBrief.upsert({
    where: { date },
    create: { date, content },
    update: { content },
  })

  return NextResponse.json({ content, cached: false })
}
