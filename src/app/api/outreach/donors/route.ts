import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'

export async function GET() {
  const session = await auth()
  const userId  = session?.user?.id ?? null
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const candidate = await prisma.candidate.findFirst({ where: { userId } })
  const donors = await prisma.donor.findMany({
    where: { candidateId: candidate?.id ?? undefined },
    orderBy: { donatedAt: 'desc' },
  })
  return NextResponse.json(donors)
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  const userId  = session?.user?.id ?? null
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { id, name, email, phone, amount, donatedAt, method, followUpDue, notes, status, employer, occupation } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const candidate = await prisma.candidate.findFirst({ where: { userId } })
  const existing = await prisma.donor.findFirst({ where: { id } })
  if (!existing || existing.candidateId !== candidate?.id) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }

  const donor = await prisma.donor.update({
    where: { id },
    data: {
      ...(name       !== undefined && { name:       name.trim() }),
      ...(email      !== undefined && { email:      email?.trim() || null }),
      ...(phone      !== undefined && { phone:      phone?.trim() || null }),
      ...(amount     !== undefined && { amount:     Number(amount) }),
      ...(donatedAt  !== undefined && { donatedAt:  new Date(donatedAt) }),
      ...(method     !== undefined && { method:     method?.trim() || null }),
      ...(followUpDue !== undefined && { followUpDue: followUpDue ? new Date(followUpDue) : null }),
      ...(notes      !== undefined && { notes:      notes?.trim() || null }),
      ...(status     !== undefined && { status }),
      ...(employer   !== undefined && { employer:   employer?.trim()   || null }),
      ...(occupation !== undefined && { occupation: occupation?.trim() || null }),
    },
  })
  return NextResponse.json(donor)
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  const userId  = session?.user?.id ?? null
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const candidate = await prisma.candidate.findFirst({ where: { userId } })
  const existing = await prisma.donor.findFirst({ where: { id } })
  if (!existing || existing.candidateId !== candidate?.id) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }

  await prisma.donor.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  const userId  = session?.user?.id ?? null
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { name, email, phone, amount, donatedAt, method, followUpDue, notes, status, employer, occupation } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'name required' }, { status: 400 })
  if (!amount || isNaN(Number(amount))) return NextResponse.json({ error: 'valid amount required' }, { status: 400 })

  const candidate = await prisma.candidate.findFirst({ where: { userId } })

  const donor = await prisma.donor.create({
    data: {
      candidateId: candidate?.id ?? null,
      name:        name.trim(),
      email:       email?.trim() || null,
      phone:       phone?.trim() || null,
      amount:      Number(amount),
      donatedAt:   donatedAt ? new Date(donatedAt) : new Date(),
      method:      method?.trim() || null,
      followUpDue: followUpDue ? new Date(followUpDue) : null,
      notes:       notes?.trim() || null,
      status:      status ?? 'received',
      employer:    employer?.trim() || null,
      occupation:  occupation?.trim() || null,
    },
  })
  return NextResponse.json(donor)
}
