import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'

export async function GET() {
  const session = await auth()
  const userId  = session?.user?.id ?? null
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const candidate = await prisma.candidate.findFirst({ where: { userId } })
  const volunteers = await prisma.volunteer.findMany({
    where: { candidateId: candidate?.id ?? undefined },
    orderBy: { shiftDate: 'asc' },
  })
  return NextResponse.json(volunteers)
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  const userId  = session?.user?.id ?? null
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { id, name, email, phone, role, shiftDate, shiftStart, shiftEnd, status, notes } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const candidate = await prisma.candidate.findFirst({ where: { userId } })
  const existing = await prisma.volunteer.findFirst({ where: { id } })
  if (!existing || existing.candidateId !== candidate?.id) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }

  const volunteer = await prisma.volunteer.update({
    where: { id },
    data: {
      ...(name       !== undefined && { name:       name.trim() }),
      ...(email      !== undefined && { email:      email?.trim() || null }),
      ...(phone      !== undefined && { phone:      phone?.trim() || null }),
      ...(role       !== undefined && { role:       role?.trim() || null }),
      ...(shiftDate  !== undefined && { shiftDate:  new Date(shiftDate) }),
      ...(shiftStart !== undefined && { shiftStart: shiftStart?.trim() || null }),
      ...(shiftEnd   !== undefined && { shiftEnd:   shiftEnd?.trim() || null }),
      ...(status     !== undefined && { status }),
      ...(notes      !== undefined && { notes:      notes?.trim() || null }),
    },
  })
  return NextResponse.json(volunteer)
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  const userId  = session?.user?.id ?? null
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const candidate = await prisma.candidate.findFirst({ where: { userId } })
  const existing = await prisma.volunteer.findFirst({ where: { id } })
  if (!existing || existing.candidateId !== candidate?.id) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }

  await prisma.volunteer.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  const userId  = session?.user?.id ?? null
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { name, email, phone, role, shiftDate, shiftStart, shiftEnd, status, notes } = await req.json()
  if (!name?.trim())  return NextResponse.json({ error: 'name required' }, { status: 400 })
  if (!shiftDate)     return NextResponse.json({ error: 'shiftDate required' }, { status: 400 })

  const candidate = await prisma.candidate.findFirst({ where: { userId } })

  const volunteer = await prisma.volunteer.create({
    data: {
      candidateId: candidate?.id ?? null,
      name:        name.trim(),
      email:       email?.trim() || null,
      phone:       phone?.trim() || null,
      role:        role?.trim() || null,
      shiftDate:   new Date(shiftDate),
      shiftStart:  shiftStart?.trim() || null,
      shiftEnd:    shiftEnd?.trim() || null,
      status:      status ?? 'scheduled',
      notes:       notes?.trim() || null,
    },
  })
  return NextResponse.json(volunteer)
}
