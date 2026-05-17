import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'

export async function POST(req: NextRequest) {
  const session = await auth()
  const userId  = session?.user?.id ?? null
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { title, type, content, platform, notes } = await req.json()
  if (!title?.trim())   return NextResponse.json({ error: 'title required' }, { status: 400 })
  if (!content?.trim()) return NextResponse.json({ error: 'content required' }, { status: 400 })

  const candidate = await prisma.candidate.findFirst({ where: { userId } })

  const draft = await prisma.contentDraft.create({
    data: {
      candidateId: candidate?.id ?? null,
      title:       title.trim(),
      type:        type ?? 'social',
      content:     content.trim(),
      platform:    platform?.trim() || null,
      notes:       notes?.trim() || null,
      status:      'pending',
    },
  })
  return NextResponse.json(draft)
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  const userId  = session?.user?.id ?? null
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { id, status } = await req.json()
  if (!id || !['approved', 'rejected', 'pending'].includes(status)) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 })
  }

  // Ownership check
  const candidate = await prisma.candidate.findFirst({ where: { userId }, select: { id: true } })
  const existing  = await prisma.contentDraft.findUnique({ where: { id }, select: { candidateId: true } })
  if (!existing || existing.candidateId !== (candidate?.id ?? null)) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }

  const draft = await prisma.contentDraft.update({ where: { id }, data: { status } })
  return NextResponse.json(draft)
}
