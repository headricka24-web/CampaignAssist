import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'

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
