import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const candidates = await prisma.candidate.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json(candidates)
}

export async function POST(req: NextRequest) {
  const { name, race, state, party, incumbent, raceLevel, district, county, city, zip, opponentName } = await req.json()
  const candidate = await prisma.candidate.create({
    data: {
      name, race, state, party,
      incumbent:    incumbent    ?? false,
      raceLevel:    raceLevel    ?? null,
      district:     district     ?? null,
      county:       county       ?? null,
      city:         city         ?? null,
      zip:          zip          ?? null,
      opponentName: opponentName ?? null,
    },
  })
  return NextResponse.json(candidate, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const { id, name, race, state, party, incumbent, raceLevel, district, county, city, zip, opponentName } = await req.json()
  if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 })
  const candidate = await prisma.candidate.update({
    where: { id },
    data: {
      ...(name         !== undefined && { name }),
      ...(race         !== undefined && { race }),
      ...(state        !== undefined && { state }),
      ...(party        !== undefined && { party }),
      ...(incumbent    !== undefined && { incumbent }),
      ...(raceLevel    !== undefined && { raceLevel }),
      ...(district     !== undefined && { district:     district     || null }),
      ...(county       !== undefined && { county:       county       || null }),
      ...(city         !== undefined && { city:         city         || null }),
      ...(zip          !== undefined && { zip:          zip          || null }),
      ...(opponentName !== undefined && { opponentName: opponentName || null }),
    },
  })
  return NextResponse.json(candidate)
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
