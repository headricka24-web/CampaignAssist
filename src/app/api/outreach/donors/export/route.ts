import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'

// FEC Schedule A itemized receipts — CSV for FECFile import
export async function GET(req: NextRequest) {
  const session = await auth()
  const userId  = session?.user?.id
  if (!userId) return new NextResponse('Unauthorized', { status: 401 })

  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('mode') ?? 'all' // 'all' | 'fec' (only $200+ itemized)

  const candidate = await prisma.candidate.findFirst({
    where:  { userId },
    select: { id: true, name: true },
  })

  const donors = await prisma.donor.findMany({
    where: {
      candidateId: candidate?.id ?? undefined,
      ...(mode === 'fec' ? { amount: { gte: 200 } } : {}),
    },
    orderBy: { donatedAt: 'desc' },
  })

  const esc = (v: string | null | undefined) => `"${(v ?? '').replace(/"/g, '""')}"`

  if (mode === 'fec') {
    // FEC-style Schedule A format
    const headers = [
      'Transaction ID', 'Entity Type', 'First Name', 'Last Name',
      'Employer', 'Occupation', 'Amount', 'Date', 'Payment Method',
      'Email', 'Phone', 'Notes',
    ]
    const rows = donors.map((d, i) => {
      const nameParts = d.name.trim().split(/\s+/)
      const lastName  = nameParts.length > 1 ? nameParts[nameParts.length - 1] : d.name
      const firstName = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : ''
      return [
        esc(`IND-${i + 1}`),
        esc('IND'),
        esc(firstName),
        esc(lastName),
        esc(d.employer),
        esc(d.occupation),
        esc(d.amount.toFixed(2)),
        esc(new Date(d.donatedAt).toLocaleDateString('en-US')),
        esc(d.method),
        esc(d.email),
        esc(d.phone),
        esc(d.notes),
      ].join(',')
    })

    const csv = [headers.map(esc).join(','), ...rows].join('\n')
    return new NextResponse(csv, {
      headers: {
        'Content-Type':        'text/csv',
        'Content-Disposition': 'attachment; filename="fec-schedule-a.csv"',
      },
    })
  }

  // Standard full donor list
  const headers = [
    'Name', 'Email', 'Phone', 'Amount', 'Date', 'Method', 'Employer', 'Occupation',
    'Follow-up Due', 'Status', 'Notes',
  ]
  const rows = donors.map(d => [
    esc(d.name),
    esc(d.email),
    esc(d.phone),
    esc(d.amount.toFixed(2)),
    esc(new Date(d.donatedAt).toLocaleDateString('en-US')),
    esc(d.method),
    esc(d.employer),
    esc(d.occupation),
    esc(d.followUpDue ? new Date(d.followUpDue).toLocaleDateString('en-US') : null),
    esc(d.status),
    esc(d.notes),
  ].join(','))

  const csv = [headers.map(esc).join(','), ...rows].join('\n')
  return new NextResponse(csv, {
    headers: {
      'Content-Type':        'text/csv',
      'Content-Disposition': 'attachment; filename="donors.csv"',
    },
  })
}
