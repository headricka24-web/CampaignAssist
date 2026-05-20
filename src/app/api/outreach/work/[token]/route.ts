import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Public endpoints — no auth required, token acts as the key

// Map phone-bank disposition → voter contactStatus
const DISPOSITION_TO_STATUS: Record<string, string> = {
  Committed:    'Reached',
  Called:       'Reached',
  LeftVM:       'Left Message',
  NoAnswer:     'Needs Follow-Up',
  NotInterested:'Reached',
  DoNotContact: 'Do Not Contact',
}

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
    select: { id: true, disposition: true, voterId: true, phone: true },
  })
  if (!contact) return NextResponse.json({ error: 'contact not found' }, { status: 404 })

  const wasWorked = Boolean(contact.disposition)
  const isWorked  = disposition !== 'Skipped'

  // Update the ListContact
  await prisma.listContact.update({
    where: { id: contactId },
    data:  {
      disposition,
      dispositionNote: dispositionNote?.trim() || null,
      dispositionAt:   new Date(),
    },
  })

  // Sync back to Voter record — by voterId if linked, else try to match by phone
  const voterStatus = DISPOSITION_TO_STATUS[disposition]
  if (voterStatus) {
    if (contact.voterId) {
      // Direct link — always reliable
      await prisma.voter.update({
        where: { id: contact.voterId },
        data:  { contactStatus: voterStatus, lastContactedAt: new Date() },
      }).catch(() => { /* voter may have been deleted */ })
    } else if (contact.phone) {
      // Fallback: match by phone within the same candidate's voter file
      const listContact = await prisma.listContact.findUnique({
        where:  { id: contactId },
        select: { list: { select: { candidateId: true } } },
      })
      const candidateId = listContact?.list?.candidateId
      if (candidateId) {
        await prisma.voter.updateMany({
          where: { candidateId, phone: contact.phone },
          data:  { contactStatus: voterStatus, lastContactedAt: new Date() },
        }).catch(() => {})
      }
    }
  }

  // Update segment workedCount
  if (!wasWorked && isWorked) {
    await prisma.segment.update({ where: { id: segment.id }, data: { workedCount: { increment: 1 } } })
  } else if (wasWorked && !isWorked) {
    await prisma.segment.update({ where: { id: segment.id }, data: { workedCount: { decrement: 1 } } })
  }

  return NextResponse.json({ ok: true })
}
