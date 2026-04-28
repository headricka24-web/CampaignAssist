import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const outlets = await prisma.outlet.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json(outlets)
}

export async function POST(req: NextRequest) {
  const { name, type, reach, leaning } = await req.json()
  const outlet = await prisma.outlet.create({ data: { name, type, reach, leaning } })
  return NextResponse.json(outlet, { status: 201 })
}
