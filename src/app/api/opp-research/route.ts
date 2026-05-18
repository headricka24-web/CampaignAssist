import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'

const VALID_TYPES = ['vote', 'quote', 'donor', 'affiliation', 'ad', 'other']

async function getCandidateId(userId: string): Promise<string | null> {
  const c = await prisma.candidate.findFirst({ where: { userId }, select: { id: true } })
  return c?.id ?? null
}

// ── GET — list all O.R. entries ───────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const session = await auth()
  const userId  = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const cid = await getCandidateId(userId)
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')

  const entries = await prisma.oppResearchEntry.findMany({
    where: {
      candidateId: cid ?? undefined,
      ...(type && VALID_TYPES.includes(type) ? { type } : {}),
    },
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
  })

  return NextResponse.json(entries)
}

// ── POST — create a new entry ─────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await auth()
  const userId  = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const cid = await getCandidateId(userId)
  const { type, title, detail, date, source, citation, tags } = await req.json() as {
    type: string; title: string; detail: string
    date?: string; source?: string; citation?: string; tags?: string[]
  }

  if (!VALID_TYPES.includes(type)) return NextResponse.json({ error: 'invalid_type' }, { status: 400 })
  if (!title?.trim())  return NextResponse.json({ error: 'title required' }, { status: 400 })
  if (!detail?.trim()) return NextResponse.json({ error: 'detail required' }, { status: 400 })

  const entry = await prisma.oppResearchEntry.create({
    data: {
      candidateId: cid,
      type,
      title:    title.trim(),
      detail:   detail.trim(),
      date:     date ? new Date(date) : null,
      source:   source?.trim() || null,
      citation: citation?.trim() || null,
      tags:     JSON.stringify(Array.isArray(tags) ? tags : []),
    },
  })

  return NextResponse.json(entry, { status: 201 })
}

// ── PATCH — update an entry ───────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const session = await auth()
  const userId  = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const cid = await getCandidateId(userId)
  const { id, type, title, detail, date, source, citation, tags } = await req.json() as {
    id: string; type?: string; title?: string; detail?: string
    date?: string | null; source?: string; citation?: string; tags?: string[]
  }
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const existing = await prisma.oppResearchEntry.findUnique({ where: { id } })
  if (!existing || existing.candidateId !== cid) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }

  const entry = await prisma.oppResearchEntry.update({
    where: { id },
    data: {
      ...(type     !== undefined && VALID_TYPES.includes(type) && { type }),
      ...(title    !== undefined && { title:  title.trim() }),
      ...(detail   !== undefined && { detail: detail.trim() }),
      ...(date     !== undefined && { date: date ? new Date(date) : null }),
      ...(source   !== undefined && { source:   source?.trim() || null }),
      ...(citation !== undefined && { citation: citation?.trim() || null }),
      ...(tags     !== undefined && { tags: JSON.stringify(tags) }),
    },
  })

  return NextResponse.json(entry)
}

// ── DELETE ────────────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const session = await auth()
  const userId  = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const cid = await getCandidateId(userId)
  const { id } = await req.json() as { id: string }
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const existing = await prisma.oppResearchEntry.findUnique({ where: { id } })
  if (!existing || existing.candidateId !== cid) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }

  await prisma.oppResearchEntry.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
