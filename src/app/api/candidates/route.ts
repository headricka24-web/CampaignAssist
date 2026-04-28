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

export async function DELETE(req: NextRequest) {
  const { id } = await req.json() as { id: string }
  if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 })

  // Cascade: bins → binItems, briefs, exports → candidate
  const bins = await prisma.bin.findMany({ where: { candidateId: id }, select: { id: true } })
  const binIds = bins.map(b => b.id)

  await prisma.binItem.deleteMany({ where: { binId: { in: binIds } } })
  await prisma.brief.deleteMany({ where: { binId: { in: binIds } } })
  await prisma.export.deleteMany({ where: { binId: { in: binIds } } })
  await prisma.bin.deleteMany({ where: { candidateId: id } })
  await prisma.candidate.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
