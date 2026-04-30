import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  const { name, email, phone, role, shiftDate, shiftStart, shiftEnd, status, notes } = await req.json()
  if (!name?.trim())  return NextResponse.json({ error: 'name required' }, { status: 400 })
  if (!shiftDate)     return NextResponse.json({ error: 'shiftDate required' }, { status: 400 })

  const candidate = await prisma.candidate.findFirst()

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
