import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function DELETE() {
  await prisma.binItem.deleteMany()
  await prisma.article.deleteMany()
  return NextResponse.json({ ok: true })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const bucket = searchParams.get('bucket')
  const sentiment = searchParams.get('sentiment')
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50') || 50, 200)

  const articles = await prisma.article.findMany({
    where: {
      ...(bucket ? { bucket } : {}),
      ...(sentiment ? { sentiment } : {}),
    },
    include: { outlet: true },
    orderBy: { datePublished: 'desc' },
    take: limit,
  })

  // Serialize dates for JSON
  const serialized = articles.map(a => ({
    ...a,
    datePublished: a.datePublished.toISOString(),
    createdAt: a.createdAt.toISOString(),
  }))

  return NextResponse.json(serialized)
}
