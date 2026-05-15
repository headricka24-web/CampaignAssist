import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import { ask } from '@/lib/claude'

export const maxDuration = 30

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

export async function GET() {
  const session = await auth()
  const userId  = session?.user?.id
  if (!userId) return NextResponse.json({ actions: [] })

  const today = todayKey()

  const cached = await prisma.generatedContent.findUnique({
    where: { userId_type: { userId, type: 'suggested-actions' } },
  })
  if (cached) {
    try {
      const parsed = JSON.parse(cached.content) as { date: string; actions: string[] }
      if (parsed.date === today) return NextResponse.json({ actions: parsed.actions })
    } catch {}
  }

  // Pull from existing stored content — no new RSS calls
  const [warRoom, hotButtons, recentArticles] = await Promise.all([
    prisma.generatedContent.findUnique({ where: { userId_type: { userId, type: 'war-room-threats' } } }),
    prisma.generatedContent.findUnique({ where: { userId_type: { userId, type: 'hot-buttons-briefing' } } }),
    prisma.article.findMany({
      where: { userId },
      orderBy: { datePublished: 'desc' },
      take: 10,
      select: { title: true, sentiment: true, bucket: true },
    }),
  ])

  if (!warRoom && !hotButtons && recentArticles.length === 0) {
    return NextResponse.json({ actions: [
      'Run your first news intelligence scan to unlock personalized action items.',
      'Set up your Path to Victory with your election date and win number.',
      'Upload your voter file to start tracking contact outreach.',
    ] })
  }

  const context: string[] = []
  if (warRoom?.content) {
    try {
      const threats = JSON.parse(warRoom.content) as Array<{ severity: string; threat: string }>
      const high = threats.filter(t => t.severity === 'HIGH').slice(0, 3)
      if (high.length > 0) context.push(`ACTIVE HIGH THREATS:\n${high.map(t => `- ${t.threat}`).join('\n')}`)
    } catch {}
  }
  if (hotButtons?.content) {
    context.push(`HOT BUTTON CONTEXT:\n${hotButtons.content.slice(0, 400)}`)
  }
  if (recentArticles.length > 0) {
    context.push(`RECENT COVERAGE:\n${recentArticles.slice(0, 5).map(a => `- [${a.sentiment}] ${a.title}`).join('\n')}`)
  }

  const raw = await ask(
    `You are a Republican campaign strategist. Based on the current intelligence context, generate exactly 4 concrete, specific, actionable campaign priorities for today. Each should be one clear sentence. No fluff, no headers — just 4 action items, one per line.`,
    context.join('\n\n'),
    300,
  )

  const actions = raw
    .split('\n')
    .map(l => l.replace(/^[\d\-\*\.\s]+/, '').trim())
    .filter(Boolean)
    .slice(0, 4)

  await prisma.generatedContent.upsert({
    where:  { userId_type: { userId, type: 'suggested-actions' } },
    update: { content: JSON.stringify({ date: today, actions }) },
    create: { userId, type: 'suggested-actions', content: JSON.stringify({ date: today, actions }) },
  })

  return NextResponse.json({ actions })
}
