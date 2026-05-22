import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Public endpoints — no auth required, token acts as the key

// All phone-bank tags share this prefix so we can cleanly replace them
const PB_TAG_PREFIX = 'phone-bank:'

type VoterSync = {
  contactStatus: string
  supportLevel?: string
  tag: string
}

const DISPOSITION_SYNC: Record<string, VoterSync> = {
  Committed:    { contactStatus: 'Reached',         supportLevel: 'Strong Support', tag: 'phone-bank:committed'     },
  Called:       { contactStatus: 'Reached',                                          tag: 'phone-bank:called'        },
  LeftVM:       { contactStatus: 'Left Message',                                     tag: 'phone-bank:left-vm'       },
  NotInterested:{ contactStatus: 'Reached',         supportLevel: 'Opposed',         tag: 'phone-bank:not-interested'},
  DoNotContact: { contactStatus: 'Do Not Contact',                                   tag: 'phone-bank:do-not-contact'},
}

async function syncVoter(voterId: string, sync: VoterSync) {
  const voter = await prisma.voter.findUnique({ where: { id: voterId }, select: { tags: true } })
  if (!voter) return

  // Parse existing tags, strip any previous phone-bank tag, add the new one
  let tags: string[] = []
  try { tags = JSON.parse(voter.tags) } catch {}
  tags = tags.filter(t => !t.startsWith(PB_TAG_PREFIX))
  tags.push(sync.tag)

  await prisma.voter.update({
    where: { id: voterId },
    data:  {
      contactStatus:   sync.contactStatus,
      lastContactedAt: new Date(),
      tags:            JSON.stringify(tags),
      ...(sync.supportLevel ? { supportLevel: sync.supportLevel } : {}),
    },
  })
}

async function syncVoterByPhone(candidateId: string, phone: string, sync: VoterSync) {
  const voters = await prisma.voter.findMany({
    where:  { candidateId, phone },
    select: { id: true, tags: true },
  })
  for (const voter of voters) {
    await syncVoter(voter.id, sync)
  }
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

  // Sync back to Voter — update contactStatus, supportLevel, and phone-bank tag
  const sync = DISPOSITION_SYNC[disposition]
  if (sync) {
    if (contact.voterId) {
      await syncVoter(contact.voterId, sync).catch(() => {})
    } else if (contact.phone) {
      // Fallback: match by phone within the candidate's voter file
      const lc = await prisma.listContact.findUnique({
        where:  { id: contactId },
        select: { list: { select: { candidateId: true } } },
      })
      const candidateId = lc?.list?.candidateId
      if (candidateId) {
        await syncVoterByPhone(candidateId, contact.phone, sync).catch(() => {})
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
