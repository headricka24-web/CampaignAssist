import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'
import { auth } from '@/auth'

const CONTACT_STATUSES = ['Not Contacted', 'Reached', 'Left Message', 'Wrong Number', 'Do Not Contact', 'Needs Follow-Up']

function csvEscape(val: string | number | null | undefined): string {
  if (val == null) return ''
  const s = String(val)
  if (s.includes('"') || s.includes(',') || s.includes('\n') || s.includes('\r')) {
    return '"' + s.replace(/"/g, '""') + '"'
  }
  return s
}

export async function GET(req: NextRequest) {
  const session = await auth()
  const userId  = session?.user?.id
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const userCandidates = await prisma.candidate.findMany({
    where:  { userId },
    select: { id: true },
  })
  const candidateIds = userCandidates.map(c => c.id)

  const { searchParams } = new URL(req.url)
  const segment      = searchParams.get('segment')      ?? ''
  const search       = searchParams.get('search')       ?? ''

  const partiesParam       = searchParams.get('parties')       ?? ''
  const supportLevelsParam = searchParams.get('supportLevels') ?? ''
  const turnoutMinParam    = searchParams.get('turnoutMin')     ?? ''
  const turnoutMaxParam    = searchParams.get('turnoutMax')     ?? ''
  const hasPhoneParam      = searchParams.get('hasPhone')       === '1'
  const hasEmailParam      = searchParams.get('hasEmail')       === '1'

  const partiesFilter       = partiesParam       ? partiesParam.split(',').filter(Boolean)       : []
  const supportLevelsFilter = supportLevelsParam ? supportLevelsParam.split(',').filter(Boolean) : []

  const where: Prisma.VoterWhereInput = {
    candidateId: { in: candidateIds },
  }

  if (partiesFilter.length) {
    where.party = { in: partiesFilter }
  }
  if (supportLevelsFilter.length) {
    where.supportLevel = { in: supportLevelsFilter }
  }
  if (turnoutMinParam || turnoutMaxParam) {
    const turnoutFilter: Prisma.FloatNullableFilter = {}
    if (turnoutMinParam) turnoutFilter.gte = parseFloat(turnoutMinParam)
    if (turnoutMaxParam) turnoutFilter.lte = parseFloat(turnoutMaxParam)
    where.turnoutScore = turnoutFilter
  }
  if (hasPhoneParam) where.phone = { not: null }
  if (hasEmailParam) where.email = { not: null }

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

  const voters = await prisma.voter.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })

  const headers = [
    'First Name', 'Last Name', 'Address', 'City', 'Zip', 'Phone', 'Email',
    'Party', 'Support Level', 'Turnout Score', 'Contact Status', 'Precinct',
    'Tags', 'Notes', 'Last Contacted',
  ]

  const rows = voters.map(v => {
    let tags: string[] = []
    try { tags = JSON.parse(v.tags) as string[] } catch {}
    return [
      csvEscape(v.firstName),
      csvEscape(v.lastName),
      csvEscape(v.address),
      csvEscape(v.city),
      csvEscape(v.zip),
      csvEscape(v.phone),
      csvEscape(v.email),
      csvEscape(v.party),
      csvEscape(v.supportLevel),
      v.turnoutScore != null ? String(Math.round(v.turnoutScore)) : '',
      csvEscape(v.contactStatus),
      csvEscape(v.precinct),
      csvEscape(tags.join('; ')),
      csvEscape(v.notes),
      v.lastContactedAt
        ? new Date(v.lastContactedAt).toLocaleDateString('en-US')
        : '',
    ].join(',')
  })

  const csv = [headers.join(','), ...rows].join('\r\n')

  return new Response(csv, {
    headers: {
      'Content-Type':        'text/csv',
      'Content-Disposition': `attachment; filename="voters.csv"`,
    },
  })
}
