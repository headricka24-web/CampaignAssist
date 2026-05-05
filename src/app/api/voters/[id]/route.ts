import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Verify the voter belongs to the current user via candidateId
  const session   = await auth()
  const userId    = session?.user?.id ?? null
  const existing  = await prisma.voter.findUnique({ where: { id }, select: { candidateId: true } })
  if (existing?.candidateId) {
    const cand = await prisma.candidate.findUnique({ where: { id: existing.candidateId }, select: { userId: true } })
    if (cand && cand.userId !== userId) return NextResponse.json({ error: 'not found' }, { status: 404 })
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
