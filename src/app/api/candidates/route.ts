import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const candidates = await prisma.candidate.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json(candidates)
}

export async function POST(req: NextRequest) {
  const { name, race, state, party, incumbent } = await req.json()
  const candidate = await prisma.candidate.create({
    data: { name, race, state, party, incumbent: incumbent ?? false },
  })
  return NextResponse.json(candidate, { status: 201 })
}
