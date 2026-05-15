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
    where: { userId_type: { userId, type: 'suggested-actions-v2' } },
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
    `You are a Republican campaign strategist. Output ONLY a numbered list of exactly 4 action items. Format strictly as:
1. [action]
2. [action]
3. [action]
4. [action]

Each action is one direct, specific sentence. No headers, no preamble, no explanation — only those 4 lines.`,
    context.join('\n\n'),
    300,
  )

  const actions = raw
    .split('\n')
    .map(l => l.replace(/^\s*\d+[\.\)]\s*/, '').trim())
    .filter(l => l.length > 10)
    .slice(0, 4)

  await prisma.generatedContent.upsert({
    where:  { userId_type: { userId, type: 'suggested-actions-v2' } },
    update: { content: JSON.stringify({ date: today, actions }) },
    create: { userId, type: 'suggested-actions-v2', content: JSON.stringify({ date: today, actions }) },
  })

  return NextResponse.json({ actions })
}
