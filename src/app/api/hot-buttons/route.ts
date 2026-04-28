import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ask } from '@/lib/claude'

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
  const { type, issues } = await req.json() as { type: 'briefing' | 'demographics'; issues?: string[] }

  const candidate = await prisma.candidate.findFirst()
  const name  = candidate?.name  ?? 'the candidate'
  const state = candidate?.state ?? 'the state'
  const race  = candidate?.race  ?? 'this race'

  // ── BRIEFING: scrape + summarize hot issues ──────────────────────────────
  if (type === 'briefing') {
    const [stateHeadlines, nationalHeadlines] = await Promise.all([
      fetchRSS(`${state} political issues legislation 2026`),
      fetchRSS(`${race} ${state} election issues voters 2026`),
    ])

    const allHeadlines = [...new Set([...stateHeadlines, ...nationalHeadlines])].slice(0, 18)

    if (allHeadlines.length === 0) {
      return NextResponse.json({ error: 'no_news' }, { status: 400 })
    }

    const headlines = allHeadlines.map((h, i) => `${i + 1}. ${h}`).join('\n')

    const briefing = await ask(
      `You are a sharp political analyst briefing a campaign team. Write in punchy bullet points. Be specific and direct. No fluff.`,
      `Candidate: ${name}, running for ${race} in ${state}.

Here are today's news headlines from ${state}:
${headlines}

Write a Hot Button Issues Briefing with two sections:

**TOP ISSUES RIGHT NOW**
List the 5-7 most politically charged issues dominating the conversation. For each: name the issue, one sentence on why it matters, and the political stakes.

**WATCH LIST**
2-3 emerging issues the campaign should monitor.

End with a one-line "Bottom Line" summary sentence.`,
      1200,
    )

    // Extract issue names for use in demographics step
    const issueNames = allHeadlines.slice(0, 6).map(h => h.split(' ').slice(0, 5).join(' '))

    return NextResponse.json({ briefing, issues: issueNames, state, race })
  }

  // ── DEMOGRAPHICS: voter groups + rhetorical strategy ─────────────────────
  if (type === 'demographics') {
    const issueList = (issues ?? []).slice(0, 5).map((iss, i) => `${i + 1}. ${iss}`).join('\n')

    const demographics = await ask(
      `You are an expert political strategist and communications director with deep knowledge of voter demographics. Be specific, tactical, and actionable.`,
      `Candidate: ${name}, running for ${race} in ${state}.

Current hot button issues:
${issueList}

Generate a Voter Demographics & Rhetorical Strategy guide. Cover these 5 voter groups for ${state}:
1. Rural & Small-Town Voters
2. Suburban Families
3. Urban Professionals
4. Seniors (65+)
5. Young Voters (18-34)

For each group write:
- **WHO THEY ARE**: 2 sentences on this group in ${state} — size, values, what moves them
- **RHETORICAL APPROACH**: How ${name} should speak to them — tone, framing, language to use and avoid
- **ON THE ISSUES**: For each hot button issue above, one tactical sentence on how to frame it for this group

Separate each voter group with ---`,
      1800,
    )

    return NextResponse.json({ demographics })
  }

  return NextResponse.json({ error: 'invalid_type' }, { status: 400 })
}
