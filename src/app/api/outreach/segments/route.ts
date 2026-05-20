import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'

export async function GET() {
  const session = await auth()
  const userId  = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const cid = await prisma.candidate.findFirst({ where: { userId }, select: { id: true } })
  if (!cid) return NextResponse.json([])

  const segments = await prisma.segment.findMany({
    where:   { candidateId: cid.id },
    orderBy: { createdAt: 'desc' },
    include: { list: { select: { name: true } } },
  })

  return NextResponse.json(segments)
}
