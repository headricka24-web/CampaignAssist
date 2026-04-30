import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
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
