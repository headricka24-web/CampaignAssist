import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateBinDigest } from '@/layers/summarization'
import { auth } from '@/auth'

export async function GET() {
  const session = await auth()
  const userId  = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const userCandidates = await prisma.candidate.findMany({
    where:  { userId },
    select: { id: true },
  })
  const candidateIds = userCandidates.map(c => c.id)

  const bins = await prisma.bin.findMany({
    where:   { candidateId: { in: candidateIds } },
    include: { candidate: true, _count: { select: { items: true } } },
    orderBy: { dateCreated: 'desc' },
  })
  return NextResponse.json(bins)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  const userId  = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { candidateId, name, articleIds } = await req.json() as {
    candidateId: string
    name: string
    articleIds: string[]
  }

  // Verify the candidate belongs to this user
  const candidate = await prisma.candidate.findFirst({
    where: { id: candidateId, userId },
  })
  if (!candidate) return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })

  const bin = await prisma.bin.create({
    data: {
      candidateId,
      name,
      items: { create: articleIds.map((id, i) => ({ articleId: id, sortOrder: i })) },
    },
    include: { items: { include: { article: true } } },
  })

  const summaries = bin.items
    .map((i) => i.article.summary)
    .filter((s): s is string => Boolean(s))

  if (summaries.length > 0) {
    const digest = await generateBinDigest(summaries, name)
    await prisma.bin.update({ where: { id: bin.id }, data: { digest } })
    return NextResponse.json({ ...bin, digest }, { status: 201 })
  }

  return NextResponse.json(bin, { status: 201 })
}
