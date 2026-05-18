import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'

export async function GET() {
  const session = await auth()
  const userId  = session?.user?.id ?? null
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const candidate = await prisma.candidate.findFirst({ where: { userId } })
  const contacts = await prisma.contact.findMany({
    where: { candidateId: candidate?.id ?? undefined },
    orderBy: { contactedAt: 'desc' },
  })
  return NextResponse.json(contacts)
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  const userId  = session?.user?.id ?? null
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { id, name, phone, email, method, status, notes } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const candidate = await prisma.candidate.findFirst({ where: { userId } })
  const existing = await prisma.contact.findFirst({ where: { id } })
  if (!existing || existing.candidateId !== candidate?.id) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }

  const contact = await prisma.contact.update({
    where: { id },
    data: {
      ...(name   !== undefined && { name:   name.trim() }),
      ...(phone  !== undefined && { phone:  phone?.trim() || null }),
      ...(email  !== undefined && { email:  email?.trim() || null }),
      ...(method !== undefined && { method }),
      ...(status !== undefined && { status }),
      ...(notes  !== undefined && { notes:  notes?.trim() || null }),
    },
  })
  return NextResponse.json(contact)
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  const userId  = session?.user?.id ?? null
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const candidate = await prisma.candidate.findFirst({ where: { userId } })
  const existing = await prisma.contact.findFirst({ where: { id } })
  if (!existing || existing.candidateId !== candidate?.id) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }

  await prisma.contact.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  const userId  = session?.user?.id ?? null
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { name, phone, email, address, method, status, notes, contactedAt } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'name required' }, { status: 400 })

  const candidate = await prisma.candidate.findFirst({ where: { userId } })

  const contact = await prisma.contact.create({
    data: {
      candidateId: candidate?.id ?? null,
      name:        name.trim(),
      phone:       phone?.trim() || null,
      email:       email?.trim() || null,
      address:     address?.trim() || null,
      method:      method ?? 'phone',
      status:      status ?? 'completed',
      notes:       notes?.trim() || null,
      contactedAt: contactedAt ? new Date(contactedAt) : new Date(),
    },
  })
  return NextResponse.json(contact)
}
