import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const userId  = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { id } = await params
  const cid = await prisma.candidate.findFirst({ where: { userId }, select: { id: true } })
  if (!cid) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const list = await prisma.contactList.findFirst({ where: { id }, select: { candidateId: true } })
  if (!list || list.candidateId !== cid.id) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const { segmentCount, names } = await req.json() as { segmentCount: number; names?: string[] }
  if (!segmentCount || segmentCount < 1 || segmentCount > 100) {
    return NextResponse.json({ error: 'segmentCount must be 1–100' }, { status: 400 })
  }

  // Load contacts that aren't already in a segment
  const contacts = await prisma.listContact.findMany({
    where:   { listId: id, segmentId: null },
    orderBy: { sortOrder: 'asc' },
    select:  { id: true },
  })

  if (contacts.length === 0) return NextResponse.json({ error: 'no_unassigned' }, { status: 400 })

  const actualCount = Math.min(segmentCount, contacts.length)
  const chunkSize   = Math.ceil(contacts.length / actualCount)

  const created = []
  for (let i = 0; i < actualCount; i++) {
    const chunk = contacts.slice(i * chunkSize, (i + 1) * chunkSize)
    const label = names?.[i]?.trim() || `List ${i + 1}`

    const seg = await prisma.segment.create({
      data: {
        candidateId: cid.id,
        listId:      id,
        name:        label,
        totalCount:  chunk.length,
      },
    })

    await prisma.listContact.updateMany({
      where: { id: { in: chunk.map(c => c.id) } },
      data:  { segmentId: seg.id },
    })

    created.push({ id: seg.id, name: seg.name, shareToken: seg.shareToken, count: chunk.length })
  }

  return NextResponse.json({ segments: created })
}
