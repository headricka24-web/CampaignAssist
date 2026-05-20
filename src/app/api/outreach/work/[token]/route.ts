import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Public endpoints — no auth required, token acts as the key

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const segment = await prisma.segment.findFirst({
    where:   { shareToken: token },
    include: {
      list: { select: { name: true } },
      contacts: {
        orderBy: [{ disposition: 'asc' }, { sortOrder: 'asc' }],
        select: {
          id: true, firstName: true, lastName: true, phone: true, email: true,
          address: true, city: true, state: true, zip: true, party: true,
          supportLevel: true, notes: true, disposition: true, dispositionNote: true,
          dispositionAt: true,
        },
      },
    },
  })

  if (!segment) return NextResponse.json({ error: 'not found' }, { status: 404 })

  return NextResponse.json({
    id:          segment.id,
    name:        segment.name,
    listName:    segment.list.name,
    assignedTo:  segment.assignedTo,
    totalCount:  segment.totalCount,
    workedCount: segment.workedCount,
    callScript:  segment.callScript ?? null,
    contacts:    segment.contacts,
  })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const segment = await prisma.segment.findFirst({
    where:  { shareToken: token },
    select: { id: true, workedCount: true },
  })
  if (!segment) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const { contactId, disposition, dispositionNote } = await req.json() as {
    contactId: string; disposition: string; dispositionNote?: string
  }
  if (!contactId || !disposition) return NextResponse.json({ error: 'contactId and disposition required' }, { status: 400 })

  const contact = await prisma.listContact.findFirst({
    where:  { id: contactId, segmentId: segment.id },
    select: { id: true, disposition: true },
  })
  if (!contact) return NextResponse.json({ error: 'contact not found' }, { status: 404 })

  const wasWorked = Boolean(contact.disposition)
  const isWorked  = disposition !== 'Skipped'

  await prisma.listContact.update({
    where: { id: contactId },
    data:  {
      disposition,
      dispositionNote: dispositionNote?.trim() || null,
      dispositionAt:   new Date(),
    },
  })

  // Update workedCount if worked-status changed
  if (!wasWorked && isWorked) {
    await prisma.segment.update({ where: { id: segment.id }, data: { workedCount: { increment: 1 } } })
  } else if (wasWorked && !isWorked) {
    await prisma.segment.update({ where: { id: segment.id }, data: { workedCount: { decrement: 1 } } })
  }

  return NextResponse.json({ ok: true })
}
