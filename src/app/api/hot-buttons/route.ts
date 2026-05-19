import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import { ask } from '@/lib/claude'
import { buildRaceContext, geoScope, buildCandidateStanceContext } from '@/lib/raceContext'

export const maxDuration = 60

async function fetchRSS(query: string): Promise<string[]> {
  const encoded = encodeURIComponent(query)
  const url = `https://news.google.com/rss/search?q=${encoded}&hl=en-US&gl=US&ceid=US:en`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CampaignAssist/1.0)' },
    next: { revalidate: 0 },
  })
  if (!res.ok) return []
  const xml = await res.text()
  const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? []
  return items.slice(0, 12).map(item => {
    const t = item.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? ''
    return t.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/<!\[CDATA\[|\]\]>/g, '').trim()
  }).filter(Boolean)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  const userId  = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { type, issues } = await req.json() as { type: 'briefing' | 'demographics'; issues?: string[] }

  const candidate = await prisma.candidate.findFirst({
    where: { userId },
    select: { name: true, race: true, state: true, party: true, incumbent: true, raceLevel: true, district: true, county: true, city: true, bio: true, topIssues: true, electionDate: true, fundraisingGoal: true },
  })
  const name      = candidate?.name      ?? 'the candidate'
  const state     = candidate?.state     ?? 'the state'
  const race      = candidate?.race      ?? 'this race'
  const incumbent = candidate?.incumbent ? 'incumbent' : 'challenger'
  const raceCtx   = candidate ? buildRaceContext({ ...candidate, name, race, state, incumbent: candidate.incumbent ?? false }) : `CANDIDATE: ${name}, running for ${race} in ${state}.`
  const geo       = candidate ? geoScope(candidate) : state
  // stanceCtx is only injected into the demographics section (copy-generating prompt)
  const stanceCtx = type === 'demographics' ? await buildCandidateStanceContext(userId, prisma) : ''

  // ── BRIEFING ──────────────────────────────────────────────────────────────
  if (type === 'briefing') {
    const [geoHeadlines, raceHeadlines] = await Promise.all([
      fetchRSS(`${geo} political issues legislation 2026`),
      fetchRSS(`${race} ${geo} election issues voters 2026`),
    ])

    const allHeadlines = [...new Set([...geoHeadlines, ...raceHeadlines])].slice(0, 18)

    if (allHeadlines.length === 0) {
      return NextResponse.json({ error: 'no_news' }, { status: 400 })
    }

    const headlines = allHeadlines.map((h, i) => `${i + 1}. ${h}`).join('\n')

    const briefing = await ask(
      `You are a sharp political analyst briefing a campaign team. Analyze issues through the lens of the candidate's party and positions — identify where this candidate can win and where opponents are vulnerable. Write in punchy bullet points. Be specific and direct. No fluff.`,
      `${raceCtx}

Here are today's news headlines from ${geo}:
${headlines}

Write a Hot Button Issues Briefing calibrated to this race level (community/local issues for municipal/county; state policy for state; national agenda for federal). Include two sections:

**TOP ISSUES RIGHT NOW**
List the 5-7 most politically charged issues dominating the conversation in ${geo}. For each: name the issue, one sentence on why it matters at this race level, and how this candidate can use it to their advantage based on their party and positions.

**WATCH LIST**
2-3 emerging issues the campaign should monitor — including any issues the opposition may try to weaponize.

End with a one-line "Bottom Line" summary sentence focused on this candidate's path to victory.`,
      1200,
    )

    const issueNames = allHeadlines.slice(0, 6).map(h => h.split(' ').slice(0, 5).join(' '))
    return NextResponse.json({ briefing, issues: issueNames, state, race })
  }

  // ── DEMOGRAPHICS ──────────────────────────────────────────────────────────
  if (type === 'demographics') {
    const safeIssues = Array.isArray(issues) ? issues : []
    const issueList = safeIssues.slice(0, 5).map((iss, i) => `${i + 1}. ${iss}`).join('\n')

    const demographics = await ask(
      `You are an expert political strategist and communications director. Focus on winning the candidate's base voters, persuading independents, and identifying the opponent's weaknesses with each group. Be specific, tactical, and actionable.`,
      `${raceCtx}${stanceCtx}

Current hot button issues:
${issueList}

Generate a Voter Demographics & Rhetorical Strategy guide for this ${candidate?.party ?? 'Independent'} campaign in ${geo}. Scale voter group descriptions to match the race level (neighborhood-level for municipal, district/county for local, statewide for state, congressional district for federal). Cover these 5 voter groups:
1. Rural & Small-Town Voters
2. Suburban Families
3. Independent / Swing Voters
4. Seniors (65+)
5. Veterans & Active Military Families

For each group write:
- **WHO THEY ARE**: 2 sentences on this group in ${geo} — size, political leanings, and what motivates them
- **CANDIDATE MESSAGING**: How ${name} should speak to them — values to emphasize, language that resonates, drawing from CANDIDATE STANCE CONTEXT above
- **ON THE ISSUES**: For each hot button issue above, one tactical sentence on how to frame it for this group given this candidate's positions

Separate each voter group with ---`,
      1800,
    )

    return NextResponse.json({ demographics })
  }

  return NextResponse.json({ error: 'invalid_type' }, { status: 400 })
}
