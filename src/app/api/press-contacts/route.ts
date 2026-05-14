import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'

// ── GET — list contacts + outreach logs ─────────────────────────────────────
export async function GET() {
  const session = await auth()
  const userId  = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const candidate = await prisma.candidate.findFirst({
    where:  { userId },
    select: { id: true },
  })
  const cid = candidate?.id ?? ''

  const contacts = await prisma.mediaContact.findMany({
    where:   { candidateId: cid },
    orderBy: { createdAt: 'desc' },
    include: { outreach: { orderBy: { sentAt: 'desc' } } },
  })

  return NextResponse.json({ contacts })
}

// ── POST — create contact OR log outreach (type field discriminates) ─────────
export async function POST(req: NextRequest) {
  const session = await auth()
  const userId  = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const candidate = await prisma.candidate.findFirst({
    where:  { userId },
    select: { id: true },
  })
  const cid = candidate?.id ?? ''

  const body = await req.json() as Record<string, unknown>

  // ── log outreach entry ──────────────────────────────────────────────────
  if (body.action === 'log-outreach') {
    const { mediaContactId, type, subject, notes, status } = body as {
      mediaContactId: string
      type:    string
      subject?: string
      notes?:  string
      status?: string
    }

    // bump lastContactedAt on the contact
    await prisma.mediaContact.update({
      where: { id: mediaContactId },
      data:  { lastContactedAt: new Date() },
    })

    const entry = await prisma.pressOutreach.create({
      data: {
        candidateId:    cid || null,
        mediaContactId,
        type,
        subject:  subject ?? null,
        notes:    notes   ?? null,
        status:   status  ?? 'sent',
        sentAt:   new Date(),
      },
    })
    return NextResponse.json(entry, { status: 201 })
  }

  // ── update outreach status ──────────────────────────────────────────────
  if (body.action === 'update-outreach') {
    const { id, status } = body as { id: string; status: string }
    const entry = await prisma.pressOutreach.update({
      where: { id },
      data:  { status },
    })
    return NextResponse.json(entry)
  }

  // ── update contact relationship ─────────────────────────────────────────
  if (body.action === 'update-relationship') {
    const { id, relationship } = body as { id: string; relationship: string }
    const contact = await prisma.mediaContact.update({
      where:   { id },
      data:    { relationship },
      include: { outreach: { orderBy: { sentAt: 'desc' } } },
    })
    return NextResponse.json(contact)
  }

  // ── create new contact ──────────────────────────────────────────────────
  const {
    name, outlet, role, beat, email, phone, twitter, notes, relationship,
  } = body as {
    name: string; outlet: string; role?: string; beat?: string
    email?: string; phone?: string; twitter?: string
    notes?: string; relationship?: string
  }

  const contact = await prisma.mediaContact.create({
    data: {
      candidateId:  cid || null,
      name,
      outlet,
      role:         role         ?? null,
      beat:         beat         ?? null,
      email:        email        ?? null,
      phone:        phone        ?? null,
      twitter:      twitter      ?? null,
      notes:        notes        ?? null,
      relationship: relationship ?? 'cold',
    },
    include: { outreach: true },
  })

  return NextResponse.json(contact, { status: 201 })
}

// ── DELETE — remove a contact (cascades outreach entries) ───────────────────
export async function DELETE(req: NextRequest) {
  const session = await auth()
  const userId  = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { id } = await req.json() as { id: string }

  const candidate = await prisma.candidate.findFirst({
    where:  { userId },
    select: { id: true },
  })
  const cid = candidate?.id ?? ''

  const contact = await prisma.mediaContact.findUnique({ where: { id } })
  if (!contact || contact.candidateId !== cid) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }

  await prisma.mediaContact.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
