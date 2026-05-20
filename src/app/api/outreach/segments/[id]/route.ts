import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const userId  = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { id } = await params
  const cid = await prisma.candidate.findFirst({ where: { userId }, select: { id: true } })
  if (!cid) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const seg = await prisma.segment.findFirst({ where: { id }, select: { candidateId: true } })
  if (!seg || seg.candidateId !== cid.id) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const { name, assignedTo } = await req.json() as { name?: string; assignedTo?: string }
  const updated = await prisma.segment.update({
    where: { id },
    data: {
      ...(name       !== undefined && { name:       name.trim()       }),
      ...(assignedTo !== undefined && { assignedTo: assignedTo.trim() || null }),
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const userId  = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { id } = await params
  const cid = await prisma.candidate.findFirst({ where: { userId }, select: { id: true } })
  if (!cid) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const seg = await prisma.segment.findFirst({ where: { id }, select: { candidateId: true } })
  if (!seg || seg.candidateId !== cid.id) return NextResponse.json({ error: 'not found' }, { status: 404 })

  // Unassign contacts before deleting segment
  await prisma.listContact.updateMany({ where: { segmentId: id }, data: { segmentId: null } })
  await prisma.segment.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
