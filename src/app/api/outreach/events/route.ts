import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  const { title, type, eventDate, location, description } = await req.json()
  if (!title?.trim()) return NextResponse.json({ error: 'title required' }, { status: 400 })
  if (!eventDate)     return NextResponse.json({ error: 'eventDate required' }, { status: 400 })

  const candidate = await prisma.candidate.findFirst()

  const event = await prisma.campaignEvent.create({
    data: {
      candidateId: candidate?.id ?? null,
      title:       title.trim(),
      type:        type ?? 'event',
      eventDate:   new Date(eventDate),
      location:    location?.trim() || null,
      description: description?.trim() || null,
      status:      'upcoming',
    },
  })
  return NextResponse.json(event)
}
