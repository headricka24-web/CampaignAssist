import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'

export async function DELETE() {
  const session = await auth()
  const userId  = session?.user?.id ?? null

  await prisma.binItem.deleteMany({
    where: { bin: { candidate: { userId: userId ?? undefined } } },
  })
  await prisma.article.deleteMany({ where: { userId: userId ?? null } })
  return NextResponse.json({ ok: true })
}

export async function GET(req: NextRequest) {
  const session = await auth()
  const userId  = session?.user?.id ?? null

  const { searchParams } = new URL(req.url)
  const bucket    = searchParams.get('bucket')
  const sentiment = searchParams.get('sentiment')
  const limit     = Math.min(parseInt(searchParams.get('limit') ?? '50') || 50, 200)

  const articles = await prisma.article.findMany({
    where: {
      userId: userId ?? null,
      ...(bucket    ? { bucket }    : {}),
      ...(sentiment ? { sentiment } : {}),
    },
    include: { outlet: true },
    orderBy: { datePublished: 'desc' },
    take: limit,
  })

  const serialized = articles.map(a => ({
    ...a,
    datePublished: a.datePublished.toISOString(),
    createdAt:     a.createdAt.toISOString(),
  }))

  return NextResponse.json(serialized)
}
