import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ask } from '@/lib/claude'

export const maxDuration = 60

async function fetchHeadlines(query: string): Promise<string[]> {
  const encoded = encodeURIComponent(query)
  const url = `https://news.google.com/rss/search?q=${encoded}&hl=en-US&gl=US&ceid=US:en`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CampaignAssist/1.0)' },
    next: { revalidate: 0 },
  })
  if (!res.ok) return []
  const xml = await res.text()
  const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? []
  return items.slice(0, 10).map(item => {
    const t = item.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? ''
    return t.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/<!\[CDATA\[|\]\]>/g, '').trim()
  }).filter(Boolean)
}

export async function POST(req: NextRequest) {
  const { type, threatIndex } = await req.json() as {
    type: 'scan' | 'respond'
    threatIndex?: number
    threats?: string[]
  }

  const candidate = await prisma.candidate.findFirst()
  const name     = candidate?.name  ?? 'the candidate'
  const state    = candidate?.state ?? 'the state'
  const race     = candidate?.race  ?? 'this race'

  // ── SCAN: find threats ────────────────────────────────────────────────────
  if (type === 'scan') {
    const [oppAttacks, candVulns, partyAttacks] = await Promise.all([
      fetchHeadlines(`${name} criticism OR attack OR controversy ${state} 2026`),
      fetchHeadlines(`${race} ${state} Republican weakness OR scandal OR failure 2026`),
      fetchHeadlines(`${state} Democrat OR liberal attack Republican 2026`),
    ])

    const allHeadlines = [...new Set([...oppAttacks, ...candVulns, ...partyAttacks])].slice(0, 20)

    if (allHeadlines.length === 0) {
      return NextResponse.json({ error: 'no_news' }, { status: 400 })
    }

    const headlines = allHeadlines.map((h, i) => `${i + 1}. ${h}`).join('\n')

    const threats = await ask(
      `You are an expert Republican opposition research director and crisis communications strategist. Your job is to find every possible attack vector the opposition could use against the GOP candidate. Be blunt, specific, and thorough. Think like the enemy.`,
      `Candidate: ${name} (Republican), running for ${race} in ${state}.

Today's news headlines to analyze:
${headlines}

Identify 4-6 SPECIFIC THREATS from these headlines — moments where Democrats or media could attack ${name} or the Republican position. For each threat write exactly this format:

THREAT: [one-line description of the attack]
SEVERITY: [HIGH / MEDIUM / LOW]
ANGLE: [how the opposition would frame this attack in one sentence]
WHY IT MATTERS: [one sentence on why this hurts the campaign if left unanswered]

Separate each threat with ---`,
      1200,
    )

    return NextResponse.json({ threats, headlines: allHeadlines })
  }

  // ── RESPOND: generate counter-response ───────────────────────────────────
  if (type === 'respond') {
    const body = await req.json().catch(() => ({})) as { threat?: string }
    const threat = body.threat ?? 'this attack'

    const response = await ask(
      `You are a Republican rapid-response communications director. Write sharp, confident, on-offense counter-messaging. Never be defensive — always pivot to Republican strengths.`,
      `Candidate: ${name} (Republican), running for ${race} in ${state}.

THREAT TO RESPOND TO:
${threat}

Write a rapid response package:

RAPID RESPONSE STATEMENT: (2-3 sentences, quote-ready for media)
PIVOT MESSAGE: (one sentence that turns this attack into a Republican win)
SOCIAL MEDIA COUNTER: (under 280 chars, punchy and shareable)
TALKING POINTS FOR SURROGATES: (3 bullet points volunteers/surrogates can use)`,
      600,
    )

    return NextResponse.json({ response })
  }

  return NextResponse.json({ error: 'invalid_type' }, { status: 400 })
}
