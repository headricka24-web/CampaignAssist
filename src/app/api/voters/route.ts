import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'

const PRESET_SEGMENTS = [
  'Strong Republican',
  'Lean Support',
  'Persuadable',
  'GOTV Target',
  'Door Knock Priority',
  'economy',
  'schools',
  'public safety',
  'taxes',
  'immigration',
  'energy',
]

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const segment     = searchParams.get('segment') ?? ''
  const party       = searchParams.get('party') ?? ''
  const status      = searchParams.get('status') ?? ''
  const search      = searchParams.get('search') ?? ''
  const page        = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit       = Math.min(100, parseInt(searchParams.get('limit') ?? '50'))
  const skip        = (page - 1) * limit

  const where: Prisma.VoterWhereInput = {}

  if (party)  where.party = party
  if (status) where.contactStatus = status
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName:  { contains: search, mode: 'insensitive' } },
      { phone:     { contains: search } },
      { email:     { contains: search, mode: 'insensitive' } },
      { precinct:  { contains: search, mode: 'insensitive' } },
    ]
  }
  if (segment === 'Needs Follow-Up') {
    where.contactStatus = 'Needs Follow-Up'
  } else if (segment === 'Not Contacted') {
    where.contactStatus = 'Not Contacted'
  } else if (segment) {
    where.tags = { contains: segment }
  }

  const [voters, total] = await Promise.all([
    prisma.voter.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.voter.count({ where }),
  ])

  // Segment counts for sidebar
  const allVoters = await prisma.voter.findMany({ select: { tags: true, contactStatus: true } })
  const segmentCounts: Record<string, number> = {
    'All Voters':     allVoters.length,
    'Needs Follow-Up': allVoters.filter(v => v.contactStatus === 'Needs Follow-Up').length,
    'Not Contacted':  allVoters.filter(v => v.contactStatus === 'Not Contacted').length,
  }
  for (const seg of PRESET_SEGMENTS) {
    segmentCounts[seg] = allVoters.filter(v => {
      try { return (JSON.parse(v.tags) as string[]).includes(seg) } catch { return false }
    }).length
  }

  const parsed = voters.map(v => ({
    ...v,
    tags: (() => { try { return JSON.parse(v.tags) } catch { return [] } })(),
  }))

  return NextResponse.json({ voters: parsed, total, page, limit, segmentCounts })
}
