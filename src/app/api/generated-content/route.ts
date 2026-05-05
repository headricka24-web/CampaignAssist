import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'

export async function GET(req: NextRequest) {
  const session = await auth()
  const userId  = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const type = req.nextUrl.searchParams.get('type')
  if (!type) return NextResponse.json({ error: 'type required' }, { status: 400 })

  const record = await prisma.generatedContent.findUnique({
    where: { userId_type: { userId, type } },
  })
  if (!record) return NextResponse.json(null, { status: 404 })
  return NextResponse.json(record)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  const userId  = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { type, content } = await req.json() as { type: string; content: string }
  if (!type || content === undefined) return NextResponse.json({ error: 'type and content required' }, { status: 400 })

  const record = await prisma.generatedContent.upsert({
    where:  { userId_type: { userId, type } },
    update: { content },
    create: { userId, type, content },
  })
  return NextResponse.json(record)
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  const userId  = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const type = req.nextUrl.searchParams.get('type')
  if (!type) return NextResponse.json({ error: 'type required' }, { status: 400 })

  await prisma.generatedContent.deleteMany({ where: { userId, type } })
  return NextResponse.json({ ok: true })
}
