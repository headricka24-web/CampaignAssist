import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const userId  = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { id } = await params
  const cid = await prisma.candidate.findFirst({ where: { userId }, select: { id: true } })
  if (!cid) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const list = await prisma.contactList.findFirst({ where: { id }, select: { candidateId: true } })
  if (!list || list.candidateId !== cid.id) return NextResponse.json({ error: 'not found' }, { status: 404 })

  await prisma.contactList.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
