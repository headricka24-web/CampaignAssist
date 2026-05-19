import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ask } from '@/lib/claude'
import { auth } from '@/auth'
import { buildRaceContext } from '@/lib/raceContext'

export const maxDuration = 60

export async function POST() {
  const session = await auth()
  const userId  = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const candidate = await prisma.candidate.findFirst({
    where:  { userId },
    select: { id: true, name: true, race: true, state: true, party: true, incumbent: true, raceLevel: true, district: true, county: true, city: true, bio: true, topIssues: true, electionDate: true, fundraisingGoal: true },
  })
  const cid = candidate?.id ?? null

  // Load entries + war room threats in parallel
  const [entries, threats] = await Promise.all([
    prisma.oppResearchEntry.findMany({
      where:   { candidateId: cid },
      orderBy: [{ type: 'asc' }, { date: 'desc' }],
    }),
    prisma.threatRecord.findMany({
      where:   { candidateId: cid, dismissed: false },
      orderBy: { severity: 'asc' },
      take:    10,
    }),
  ])

  if (entries.length === 0 && threats.length === 0) {
    return NextResponse.json({ error: 'no_data' }, { status: 400 })
  }

  const raceCtx = candidate
    ? buildRaceContext({ ...candidate, incumbent: candidate.incumbent ?? false })
    : ''

  const opponentName = await prisma.candidate.findFirst({
    where:  { userId },
    select: { opponentName: true },
  }).then(c => c?.opponentName ?? 'the opponent')

  // Format entries by type
  const byType: Record<string, typeof entries> = {}
  for (const e of entries) {
    if (!byType[e.type]) byType[e.type] = []
    byType[e.type].push(e)
  }

  const entriesBlock = Object.entries(byType).map(([type, items]) => {
    const header = type.toUpperCase() + 'S'
    const lines  = items.map(e => {
      const date = e.date ? ` (${new Date(e.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })})` : ''
      return `  - ${e.title}${date}: ${e.detail.slice(0, 300)}${e.detail.length > 300 ? '…' : ''}`
    })
    return `${header}:\n${lines.join('\n')}`
  }).join('\n\n')

  const threatsBlock = threats.length > 0
    ? 'WAR ROOM THREATS (known attack vectors):\n' + threats.map(t =>
        `  - [${t.severity}] ${t.threat}: ${t.angle}`
      ).join('\n')
    : ''

  const brief = await ask(
    `You are a senior opposition research director and political strategist. You write opposition research briefs that campaigns actually use — punchy, organized, actionable. Every line should be deployable in an ad, a debate, or a press release. Write like you're briefing a candidate 48 hours before a debate.`,
    `${raceCtx}

OPPONENT: ${opponentName}

RESEARCH DOSSIER:
${entriesBlock}

${threatsBlock}

Write a complete Opposition Research Attack Brief. Structure it exactly as follows:

## EXECUTIVE SUMMARY
2-3 sentences: The 3 most damaging facts about ${opponentName} and the overall narrative the campaign should drive home.

## TOP ATTACK LINES
The 5 sharpest, most deployable attacks — in order of effectiveness. For each:
**ATTACK:** [One punchy sentence, quote-ready]
**EVIDENCE:** [The specific vote, quote, donor, or record that backs it up]
**BEST USE:** [Where to deploy — debate, ad, mailer, earned media]

## NARRATIVE FRAMES
3 overarching narratives that tie the attacks together into a coherent story about who ${opponentName} is:
1. [Frame name]: [2 sentences on how to consistently frame this opponent]
2. [Frame name]: [...]
3. [Frame name]: [...]

## VULNERABILITIES BY TYPE
Brief bullets organized by category — only include categories with real data:
**Votes:** [Key votes that hurt with base or swing voters]
**Quotes:** [Most damaging self-inflicted quotes]
**Donors/Affiliations:** [Who funds them and what it says about their priorities]
**Ads/Past Campaigns:** [Any deceptive or problematic past campaign material]

## WHAT TO WATCH
2-3 lines on the opposition's likely counter-attacks and how to pre-empt them.

## RAPID RESPONSE PREP
The 3 questions ${opponentName} will be asked that they can't answer cleanly — and what ${candidate?.name ?? 'our candidate'} should say when asked the same.`,
    1400,
  )

  return NextResponse.json({ brief, entryCount: entries.length, threatCount: threats.length })
}
