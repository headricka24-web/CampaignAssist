import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ask } from '@/lib/claude'
import { auth } from '@/auth'
import { buildRaceContext, buildCandidateStanceContext } from '@/lib/raceContext'

export const maxDuration = 30

export async function POST(req: NextRequest) {
  const session = await auth()
  const userId  = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { contactId } = await req.json() as { contactId: string }
  if (!contactId) return NextResponse.json({ error: 'contactId required' }, { status: 400 })

  // Load candidate + contact in parallel
  const [candidate, contact] = await Promise.all([
    prisma.candidate.findFirst({
      where:  { userId },
      select: { name: true, race: true, state: true, party: true, incumbent: true, raceLevel: true, district: true, county: true, city: true, bio: true, topIssues: true, electionDate: true, fundraisingGoal: true },
    }),
    prisma.mediaContact.findFirst({
      where:  { id: contactId },
      select: { id: true, name: true, outlet: true, role: true, beat: true, email: true, notes: true, candidateId: true },
    }),
  ])

  if (!contact) return NextResponse.json({ error: 'contact not found' }, { status: 404 })

  // Verify ownership
  const cid = await prisma.candidate.findFirst({ where: { userId }, select: { id: true } })
  if (contact.candidateId !== cid?.id) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const raceCtx   = candidate ? buildRaceContext({ ...candidate, incumbent: candidate.incumbent ?? false }) : ''
  const stanceCtx = await buildCandidateStanceContext(userId, prisma)

  // Pull recent news headlines for story angle context
  const articles = await prisma.article.findMany({
    where:   { userId },
    orderBy: { datePublished: 'desc' },
    take:    8,
    select:  { title: true, sentiment: true, bucket: true },
  })
  const headlines = articles.length > 0
    ? articles.map(a => `- ${a.title}`).join('\n')
    : 'No recent news articles tracked yet.'

  const contactDesc = [contact.role, contact.beat].filter(Boolean).join(' covering ')
  const notesLine   = contact.notes?.trim() ? `\nKnown notes about this reporter: ${contact.notes}` : ''

  const pitch = await ask(
    `You are an experienced campaign communications director who writes tight, compelling media pitches. You know what makes journalists respond — specificity, news peg, and a clear angle that serves their audience. Write in a direct, confident voice. No fluff.`,
    `${raceCtx}${stanceCtx}

REPORTER: ${contact.name}
OUTLET: ${contact.outlet}
ROLE/BEAT: ${contactDesc || 'General assignment'}${notesLine}

RECENT CAMPAIGN NEWS:
${headlines}

Write a pitch email from the campaign to ${contact.name} at ${contact.outlet}. The pitch should be tailored to their specific beat and outlet type — what angle would a ${contactDesc || 'general assignment reporter'} actually care about?

Structure the output exactly like this:

SUBJECT: [Compelling subject line — specific, newsy, under 10 words]

BODY:
[Opening line — hook with the news angle, no "I hope this email finds you well"]

[Paragraph 1 — the story: what happened or what the candidate is doing, why it matters to ${contact.outlet}'s readers/viewers specifically]

[Paragraph 2 — the ask: interview, comment, story idea, or exclusive — be specific]

[Sign-off — short, professional, leaves door open]

[Signature block placeholder]

Keep the whole email under 200 words. Make the angle specific to this reporter's beat, not a generic press blast.`,
    500,
  )

  return NextResponse.json({ pitch, contact: { name: contact.name, outlet: contact.outlet, email: contact.email } })
}
