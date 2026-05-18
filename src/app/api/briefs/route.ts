import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateDailyDigest, generateIssueBrief, generateNewsletter } from '@/layers/content-generation'
import type { BriefType } from '@/lib/types'
import { auth } from '@/auth'

export async function POST(req: NextRequest) {
  const session = await auth()
  const userId  = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { binId, type, topic } = await req.json() as { binId: string; type: BriefType; topic?: string }

  const bin = await prisma.bin.findUnique({
    where: { id: binId },
    include: {
      candidate: true,
      items: { include: { article: true }, orderBy: { sortOrder: 'asc' } },
    },
  })
  if (!bin) return NextResponse.json({ error: 'Bin not found' }, { status: 404 })
  if (bin.candidate.userId !== userId) return NextResponse.json({ error: 'Bin not found' }, { status: 404 })

  const summaries = bin.items
    .map((i) => i.article.summary)
    .filter((s): s is string => Boolean(s))

  let content: string

  if (type === 'DailyDigest') {
    content = await generateDailyDigest(bin.digest ?? summaries.join('\n\n'), new Date().toDateString())
  } else if (type === 'IssueBrief') {
    if (!topic) return NextResponse.json({ error: 'topic required for IssueBrief' }, { status: 400 })
    content = await generateIssueBrief(topic, summaries)
  } else if (type === 'Newsletter') {
    content = await generateNewsletter(bin.digest ?? summaries.join('\n\n'), bin.candidate.name)
  } else {
    return NextResponse.json({ error: `Brief type ${type} not yet implemented` }, { status: 400 })
  }

  const brief = await prisma.brief.create({ data: { binId, type, content } })
  return NextResponse.json(brief, { status: 201 })
}

export async function GET(req: NextRequest) {
  const session = await auth()
  const userId  = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const binId = searchParams.get('binId')

  // If a specific bin is requested, verify ownership
  if (binId) {
    const bin = await prisma.bin.findUnique({ where: { id: binId }, include: { candidate: { select: { userId: true } } } })
    if (!bin || bin.candidate.userId !== userId) return NextResponse.json([])
  }

  const briefs = await prisma.brief.findMany({
    where: binId ? { binId } : {},
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(briefs)
}
