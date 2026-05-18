import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'

export async function DELETE() {
  const session = await auth()
  const userId  = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  await prisma.binItem.deleteMany({
    where: { bin: { candidate: { userId } } },
  })
  await prisma.article.deleteMany({ where: { userId } })
  return NextResponse.json({ ok: true })
}

export async function GET(req: NextRequest) {
  const session = await auth()
  const userId  = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const bucket    = searchParams.get('bucket')
  const sentiment = searchParams.get('sentiment')
  const rawLimit  = parseInt(searchParams.get('limit') ?? '50')
  const limit     = Math.min(Math.max(rawLimit > 0 ? rawLimit : 50, 1), 200)

  const articles = await prisma.article.findMany({
    where: {
      userId,
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
