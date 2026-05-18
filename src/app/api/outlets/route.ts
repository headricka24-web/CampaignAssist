import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const outlets = await prisma.outlet.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json(outlets)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { name, type, reach, leaning } = await req.json()
  const outlet = await prisma.outlet.create({ data: { name, type, reach, leaning } })
  return NextResponse.json(outlet, { status: 201 })
}
