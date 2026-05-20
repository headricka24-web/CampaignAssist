import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'

export async function GET() {
  const session = await auth()
  const userId  = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const cid = await prisma.candidate.findFirst({ where: { userId }, select: { id: true } })
  if (!cid) return NextResponse.json([])

  const lists = await prisma.contactList.findMany({
    where:   { candidateId: cid.id },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { contacts: true, segments: true } },
    },
  })

  return NextResponse.json(lists)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  const userId  = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const cid = await prisma.candidate.findFirst({ where: { userId }, select: { id: true } })
  if (!cid) return NextResponse.json({ error: 'no candidate' }, { status: 400 })

  const { name, description } = await req.json() as { name: string; description?: string }
  if (!name?.trim()) return NextResponse.json({ error: 'name required' }, { status: 400 })

  const list = await prisma.contactList.create({
    data: { candidateId: cid.id, name: name.trim(), description: description?.trim() || null },
  })

  return NextResponse.json(list, { status: 201 })
}
