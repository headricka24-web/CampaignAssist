import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { auth } from '@/auth'

const CONTACT_STATUSES = ['Not Contacted', 'Reached', 'Left Message', 'Wrong Number', 'Do Not Contact', 'Needs Follow-Up']

export async function GET(req: NextRequest) {
  const session = await auth()
  const userId  = session?.user?.id ?? null

  // Scope to this user's candidates only
  const userCandidates = await prisma.candidate.findMany({
    where:  userId ? { userId } : { userId: null },
    select: { id: true },
  })
  const candidateIds = userCandidates.map(c => c.id)

  const { searchParams } = new URL(req.url)
  const segment     = searchParams.get('segment') ?? ''
  const party       = searchParams.get('party') ?? ''
  const status      = searchParams.get('status') ?? ''
  const search      = searchParams.get('search') ?? ''
  const page        = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit       = Math.min(100, parseInt(searchParams.get('limit') ?? '50'))
  const skip        = (page - 1) * limit

  const where: Prisma.VoterWhereInput = {
    candidateId: { in: candidateIds },
  }

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
  if (CONTACT_STATUSES.includes(segment)) {
    where.contactStatus = segment
  } else if (segment && segment !== 'All Contacts') {
    where.tags = { contains: segment }
  }

  const [voters, total] = await Promise.all([
    prisma.voter.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.voter.count({ where }),
  ])

  // Segment counts for sidebar (scoped to same user)
  const allVoters = await prisma.voter.findMany({
    where:  { candidateId: { in: candidateIds } },
    select: { tags: true, contactStatus: true },
  })
  const segmentCounts: Record<string, number> = { 'All Contacts': allVoters.length }
  for (const s of CONTACT_STATUSES) {
    segmentCounts[s] = allVoters.filter(v => v.contactStatus === s).length
  }

  // Dynamic tag counts from actual data
  const tagCounts: Record<string, number> = {}
  for (const v of allVoters) {
    try {
      const tags = JSON.parse(v.tags) as string[]
      for (const t of tags) { tagCounts[t] = (tagCounts[t] ?? 0) + 1 }
    } catch {}
  }

  const parsed = voters.map(v => ({
    ...v,
    tags: (() => { try { return JSON.parse(v.tags) } catch { return [] } })(),
  }))

  return NextResponse.json({ voters: parsed, total, page, limit, segmentCounts, tagCounts })
}
