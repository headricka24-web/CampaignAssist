import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import { ask } from '@/lib/claude'
import { buildRaceContext } from '@/lib/raceContext'

export const maxDuration = 60

export async function POST() {
  const session = await auth()
  const userId  = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const candidate = await prisma.candidate.findFirst({
    where:  { userId },
    select: {
      id: true, name: true, race: true, state: true, party: true,
      incumbent: true, raceLevel: true, district: true, county: true,
      city: true, bio: true, topIssues: true, electionDate: true,
      fundraisingGoal: true,
    },
  })
  if (!candidate) return NextResponse.json({ error: 'no candidate' }, { status: 400 })

  const candidateId = candidate.id

  // ── Gather field ops snapshot ────────────────────────────────────────────────

  const [
    voterStats,
    allVoters,
    contactLists,
    segments,
    recentContacts,
  ] = await Promise.all([
    // Aggregate counts by status + support level
    prisma.voter.groupBy({
      by:      ['contactStatus'],
      where:   { candidateId },
      _count:  { _all: true },
    }),
    // For tag + party + support breakdowns
    prisma.voter.findMany({
      where:  { candidateId },
      select: { party: true, supportLevel: true, phone: true, tags: true },
    }),
    // Contact lists
    prisma.contactList.findMany({
      where:   { candidateId },
      select:  { id: true, name: true, totalCount: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    }),
    // All segments
    prisma.segment.findMany({
      where:  { candidateId },
      select: {
        id: true, name: true, totalCount: true, workedCount: true,
        callScript: true, assignedTo: true,
      },
    }),
    // Contacts logged in the last 14 days
    prisma.contact.count({
      where: {
        candidateId,
        contactedAt: { gte: new Date(Date.now() - 14 * 86_400_000) },
      },
    }),
  ])

  // Derived metrics
  const totalVoters     = allVoters.length
  const withPhone       = allVoters.filter(v => v.phone).length
  const noPhone         = totalVoters - withPhone
  const phoneRate       = totalVoters > 0 ? Math.round((withPhone / totalVoters) * 100) : 0

  const statusCounts: Record<string, number> = {}
  for (const row of voterStats) statusCounts[row.contactStatus] = row._count._all

  const supportCounts: Record<string, number> = {}
  const partyCounts:   Record<string, number> = {}
  for (const v of allVoters) {
    if (v.supportLevel) supportCounts[v.supportLevel] = (supportCounts[v.supportLevel] ?? 0) + 1
    if (v.party)        partyCounts[v.party]           = (partyCounts[v.party]           ?? 0) + 1
  }

  // Phone-bank tag counts
  const pbTagCounts: Record<string, number> = {}
  for (const v of allVoters) {
    try {
      const tags = JSON.parse(v.tags) as string[]
      for (const t of tags) {
        if (t.startsWith('phone-bank:')) pbTagCounts[t] = (pbTagCounts[t] ?? 0) + 1
      }
    } catch {}
  }

  const totalSegmentContacts  = segments.reduce((s: number, x: { totalCount: number }) => s + x.totalCount,  0)
  const totalSegmentWorked    = segments.reduce((s: number, x: { workedCount: number }) => s + x.workedCount, 0)
  const segmentsNoScript      = segments.filter((s: { callScript: string | null }) => !s.callScript).length
  const segmentsUnassigned    = segments.filter((s: { assignedTo: string | null }) => !s.assignedTo).length
  const overallPhoneBankPct   = totalSegmentContacts > 0
    ? Math.round((totalSegmentWorked / totalSegmentContacts) * 100)
    : 0

  // Contacts in lists but not yet segmented
  const totalListContacts = contactLists.reduce((s: number, l: { totalCount: number }) => s + l.totalCount, 0)
  const unsegmentedContacts = Math.max(0, totalListContacts - totalSegmentContacts)

  // Days until election
  const daysToElection = candidate.electionDate
    ? Math.ceil((new Date(candidate.electionDate).getTime() - Date.now()) / 86_400_000)
    : null

  // Contacted rate
  const contacted      = totalVoters - (statusCounts['Not Contacted'] ?? 0)
  const contactedPct   = totalVoters > 0 ? Math.round((contacted / totalVoters) * 100) : 0
  const followUpBacklog = (statusCounts['Needs Follow-Up'] ?? 0) + (statusCounts['Left Message'] ?? 0)

  const raceCtx = buildRaceContext({ ...candidate, incumbent: candidate.incumbent ?? false })

  const dataBlock = `
CAMPAIGN: ${raceCtx}
${daysToElection !== null ? `DAYS TO ELECTION: ${daysToElection}` : 'ELECTION DATE: Not set'}

VOTER UNIVERSE (${totalVoters.toLocaleString()} total)
- Contacted: ${contacted.toLocaleString()} (${contactedPct}%)
- Not Contacted: ${(statusCounts['Not Contacted'] ?? 0).toLocaleString()}
- Reached: ${(statusCounts['Reached'] ?? 0).toLocaleString()}
- Left Message: ${(statusCounts['Left Message'] ?? 0).toLocaleString()}
- Needs Follow-Up: ${(statusCounts['Needs Follow-Up'] ?? 0).toLocaleString()}
- Do Not Contact: ${(statusCounts['Do Not Contact'] ?? 0).toLocaleString()}
- Wrong Number: ${(statusCounts['Wrong Number'] ?? 0).toLocaleString()}
- Follow-Up Backlog (Left Msg + NFU): ${followUpBacklog.toLocaleString()}
- Has Phone: ${withPhone.toLocaleString()} (${phoneRate}%) | No Phone: ${noPhone.toLocaleString()}

SUPPORT BREAKDOWN
${Object.entries(supportCounts).map(([k, v]) => `- ${k}: ${v.toLocaleString()}`).join('\n') || '- No data'}

PARTY BREAKDOWN
${Object.entries(partyCounts).map(([k, v]) => `- ${k}: ${v.toLocaleString()}`).join('\n') || '- No data'}

PHONE BANKING
- Contact Lists: ${contactLists.length}
- Total list contacts: ${totalListContacts.toLocaleString()}
- Segments created: ${segments.length}
- Total segment contacts: ${totalSegmentContacts.toLocaleString()}
- Contacts in lists but not yet segmented: ${unsegmentedContacts.toLocaleString()}
- Segments without a call script: ${segmentsNoScript} of ${segments.length}
- Segments with no volunteer assigned: ${segmentsUnassigned} of ${segments.length}
- Overall phone bank completion: ${overallPhoneBankPct}% (${totalSegmentWorked.toLocaleString()} of ${totalSegmentContacts.toLocaleString()})
- Outreach contacts logged (last 14 days): ${recentContacts.toLocaleString()}

PHONE BANK RESULTS (from volunteer dispositions)
${Object.keys(pbTagCounts).length > 0 ? Object.entries(pbTagCounts).map(([k, v]) => `- ${k}: ${v}`).join('\n') : '- No calls logged yet'}
`.trim()

  const audit = await ask(
    `You are Alex Rivera, a veteran political field director and campaign manager with 18 years of experience running campaigns from school board to U.S. Senate. You are known for being direct, opinionated, and right. You've seen every mistake in the book. You're doing a rapid field operations audit for a campaign that has hired you as a consultant.

Your job is to look at their numbers and tell them exactly what's wrong, what's working, and what they need to do right now. You are reviewing their data through the lens of a real campaign that needs to win. Don't soften findings. Don't hedge. Be specific.

Respond ONLY with a valid JSON object — no markdown fences, no preamble. The format must be exactly:
{
  "grade": "letter grade A through F with +/- (e.g. B+, C-, A)",
  "headline": "One sharp sentence that captures the biggest risk or opportunity",
  "critical": [
    { "title": "short title", "detail": "specific explanation of the problem and why it matters" }
  ],
  "warnings": [
    { "title": "short title", "detail": "specific explanation" }
  ],
  "strengths": [
    { "title": "short title", "detail": "what they're doing well and why it matters" }
  ],
  "actions": [
    { "priority": 1, "action": "specific action to take", "why": "why this is the top priority right now" }
  ]
}

Rules:
- critical: things that will cost them the race if not fixed NOW (0–4 items)
- warnings: real problems that need attention soon (0–5 items)
- strengths: genuine positives, not filler (0–3 items)
- actions: top 3–5 concrete next steps, ranked by urgency
- Be specific to their actual numbers — reference the real counts you see
- If a metric is missing or zero, call it out directly`,
    `${dataBlock}

Audit this campaign's field operations. Reference specific numbers from the data. Be the campaign manager they need, not the one they want.`,
    1200,
  )

  // Parse the JSON from Claude's response
  let parsed: object
  try {
    const clean = audit.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()
    parsed = JSON.parse(clean)
  } catch {
    return NextResponse.json({ error: 'parse_error', raw: audit }, { status: 500 })
  }

  return NextResponse.json({ audit: parsed, dataBlock, generatedAt: new Date().toISOString() })
}
