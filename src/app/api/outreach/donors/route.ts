import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  const { name, email, phone, amount, donatedAt, method, followUpDue, notes, status } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'name required' }, { status: 400 })
  if (!amount || isNaN(Number(amount))) return NextResponse.json({ error: 'valid amount required' }, { status: 400 })

  const candidate = await prisma.candidate.findFirst()

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
    },
  })
  return NextResponse.json(donor)
}
