import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const session = await auth()
  const userId  = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  // Verify the voter belongs to the current user via candidateId
  const existing = await prisma.voter.findUnique({ where: { id }, select: { candidateId: true } })
  if (!existing) return NextResponse.json({ error: 'not found' }, { status: 404 })
  if (existing.candidateId) {
    const cand = await prisma.candidate.findUnique({ where: { id: existing.candidateId }, select: { userId: true } })
    if (!cand || cand.userId !== userId) return NextResponse.json({ error: 'not found' }, { status: 404 })
  } else {
    // Voter has no candidateId — deny by default to prevent anonymous data access
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }

  const body = await req.json() as {
    contactStatus?: string
    tags?: string[]
    notes?: string
    lastContactedAt?: string
  }

  const data: Record<string, unknown> = {}
  if (body.contactStatus !== undefined) data.contactStatus = body.contactStatus
  if (body.tags          !== undefined) data.tags = JSON.stringify(body.tags)
  if (body.notes         !== undefined) data.notes = body.notes
  if (body.lastContactedAt !== undefined) data.lastContactedAt = body.lastContactedAt ? new Date(body.lastContactedAt) : null
  if (body.contactStatus && body.contactStatus !== 'Not Contacted') {
    data.lastContactedAt = new Date()
  }

  const voter = await prisma.voter.update({
    where: { id },
    data,
  })

  return NextResponse.json({ ...voter, tags: (() => { try { return JSON.parse(voter.tags) } catch { return [] } })() })
}
