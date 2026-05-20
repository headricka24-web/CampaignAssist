import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'

export async function POST(req: NextRequest) {
  const session = await auth()
  const userId  = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const cid = await prisma.candidate.findFirst({ where: { userId }, select: { id: true } })
  if (!cid) return NextResponse.json({ error: 'no candidate' }, { status: 400 })

  const { name, segment, search, parties, supportLevels, hasPhone } =
    await req.json() as {
      name: string
      segment?: string
      search?: string
      parties?: string[]
      supportLevels?: string[]
      hasPhone?: boolean
    }

  if (!name?.trim()) return NextResponse.json({ error: 'name required' }, { status: 400 })

  // Build the same filter the voters table uses
  const where: Record<string, unknown> = { candidateId: cid.id }

  if (segment && segment !== 'All Contacts') {
    const SEGMENT_MAP: Record<string, Record<string, unknown>> = {
      'GOTV Targets':    { turnoutScore: { gte: 70 } },
      'Persuadables':    { supportLevel: 'Persuadable' },
      'Strong Support':  { supportLevel: 'Strong Support' },
      'Lean Support':    { supportLevel: 'Lean Support' },
      'Not Contacted':   { contactStatus: 'Not Contacted' },
      'Needs Follow-Up': { contactStatus: 'Needs Follow-Up' },
    }
    Object.assign(where, SEGMENT_MAP[segment] ?? {})
  }

  if (search?.trim()) {
    const s = search.trim()
    where.OR = [
      { firstName: { contains: s, mode: 'insensitive' } },
      { lastName:  { contains: s, mode: 'insensitive' } },
      { phone:     { contains: s } },
    ]
  }

  if (parties?.length)       where.party        = { in: parties }
  if (supportLevels?.length) where.supportLevel = { in: supportLevels }
  if (hasPhone)              where.phone        = { not: null }

  const voters = await prisma.voter.findMany({
    where,
    select: {
      firstName: true, lastName: true, phone: true, email: true,
      address: true, city: true, zip: true, party: true,
      supportLevel: true, notes: true,
    },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    take: 5000, // hard cap to prevent runaway list creation
  })

  if (voters.length === 0) return NextResponse.json({ error: 'no_voters' }, { status: 400 })

  // Create the list + contacts in one transaction
  const list = await prisma.contactList.create({
    data: {
      candidateId: cid.id,
      name:        name.trim(),
      description: segment && segment !== 'All Contacts' ? `Imported from Voters — ${segment}` : 'Imported from Voter File',
      totalCount:  voters.length,
      contacts: {
        createMany: {
          data: voters.map((v, i) => ({
            firstName:    v.firstName,
            lastName:     v.lastName ?? null,
            phone:        v.phone ?? null,
            email:        v.email ?? null,
            address:      v.address ?? null,
            city:         v.city ?? null,
            zip:          v.zip ?? null,
            party:        v.party ?? null,
            supportLevel: v.supportLevel ?? null,
            notes:        v.notes ?? null,
            sortOrder:    i,
          })),
        },
      },
    },
  })

  return NextResponse.json({ listId: list.id, count: voters.length })
}
