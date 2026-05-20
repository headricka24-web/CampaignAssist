import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ask } from '@/lib/claude'
import { buildRaceContext } from '@/lib/raceContext'

export const maxDuration = 45

// Public — token is the auth

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const segment = await prisma.segment.findFirst({
    where:  { shareToken: token },
    select: { id: true, name: true, candidateId: true },
  })
  if (!segment) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const { tone, purpose } = await req.json() as { tone: string; purpose: string }
  if (!tone || !purpose) return NextResponse.json({ error: 'tone and purpose required' }, { status: 400 })

  const candidate = await prisma.candidate.findFirst({
    where:  { id: segment.candidateId },
    select: { name: true, race: true, state: true, party: true, incumbent: true, raceLevel: true, district: true, county: true, city: true, bio: true, topIssues: true, electionDate: true, fundraisingGoal: true },
  })

  const raceCtx = candidate
    ? buildRaceContext({ ...candidate, incumbent: candidate.incumbent ?? false })
    : ''

  const toneGuide: Record<string, string> = {
    friendly:       'Warm, conversational, neighborly. Sound like you\'re calling a friend, not reading a script.',
    professional:   'Polished, respectful, confident. Clear and direct without being cold.',
    conversational: 'Natural and relaxed. Use contractions, speak like a real person. No jargon.',
    urgent:         'Energetic and time-sensitive. Convey that this call matters and election day is near.',
  }

  const purposeGuide: Record<string, string> = {
    gotv:           'Get Out The Vote — the sole goal is confirming they plan to vote and removing any obstacles (don\'t have a ride, don\'t know polling location, etc.).',
    voter_id:       'Voter ID — identify their support level for the candidate. Listen more than you talk. End with a soft ask.',
    persuasion:     'Persuasion — the voter is undecided or soft. Make the case for the candidate without being pushy. Lead with the top 1-2 issues.',
    fundraising:    'Fundraising — ask for a specific dollar amount. Have a story. Make it easy to say yes.',
    volunteer:      'Volunteer Recruitment — ask them to give time, not money. Make it sound fun and meaningful.',
  }

  const script = await ask(
    `You are a veteran political field director who has run hundreds of phone banks. You write call scripts that volunteers actually use — natural, scannable, and effective. Scripts should feel like a real conversation, not a corporate phone tree.`,
    `${raceCtx}

SEGMENT NAME: ${segment.name}
CALL PURPOSE: ${purposeGuide[purpose] ?? purpose}
TONE: ${toneGuide[tone] ?? tone}

Write a complete phone banking call script for this campaign. Structure it with clearly labeled sections so volunteers can scan quickly during a live call:

## OPENING
The exact words to open the call — introduce yourself, the campaign, and why you're calling. Keep it under 3 sentences. Include a natural pause point to confirm you have the right person.

## MAIN MESSAGE
2-3 sentences making the core case or ask, tuned to the purpose above. Should feel natural when spoken aloud.

## TALKING POINTS
3 brief bullet points — specific, memorable facts or arguments the volunteer can pull from if the conversation goes deeper. Tied to the candidate's actual issues.

## THE ASK
One clear, specific request. Phrased as a question, not a demand.

## COMMON OBJECTIONS
Handle 3 likely pushbacks. Format each as:
**"[Objection]"** → [Short, non-defensive response]

## CLOSE
Graceful exit whether they said yes, maybe, or no. Leave the door open. 5 sentences max.

---
Keep the whole script readable at a glance. Use plain language — no political jargon. Write the dialogue exactly as it should be spoken.`,
    900,
  )

  // Persist to segment
  await prisma.segment.update({ where: { id: segment.id }, data: { callScript: script } })

  return NextResponse.json({ script })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const segment = await prisma.segment.findFirst({
    where:  { shareToken: token },
    select: { id: true },
  })
  if (!segment) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const { script } = await req.json() as { script: string }
  if (script === undefined) return NextResponse.json({ error: 'script required' }, { status: 400 })

  await prisma.segment.update({ where: { id: segment.id }, data: { callScript: script || null } })
  return NextResponse.json({ ok: true })
}
