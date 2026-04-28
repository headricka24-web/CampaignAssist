import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateBinDigest } from '@/layers/summarization'

export async function GET() {
  const bins = await prisma.bin.findMany({
    include: { candidate: true, _count: { select: { items: true } } },
    orderBy: { dateCreated: 'desc' },
  })
  return NextResponse.json(bins)
}

export async function POST(req: NextRequest) {
  const { candidateId, name, articleIds } = await req.json() as {
    candidateId: string
    name: string
    articleIds: string[]
  }

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
