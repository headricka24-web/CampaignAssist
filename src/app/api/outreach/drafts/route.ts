import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'

export async function POST(req: NextRequest) {
  const { title, type, content, platform, notes } = await req.json()
  if (!title?.trim())   return NextResponse.json({ error: 'title required' }, { status: 400 })
  if (!content?.trim()) return NextResponse.json({ error: 'content required' }, { status: 400 })

  const session   = await auth()
  const userId    = session?.user?.id ?? null
  const candidate = await prisma.candidate.findFirst({
    where: userId ? { userId } : { userId: null },
  })

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
  const { id, status } = await req.json()
  if (!id || !['approved', 'rejected', 'pending'].includes(status)) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 })
  }
  const draft = await prisma.contentDraft.update({ where: { id }, data: { status } })
  return NextResponse.json(draft)
}
