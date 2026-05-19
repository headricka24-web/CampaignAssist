import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { ask } from '@/lib/claude'
import { auth } from '@/auth'
import { buildRaceContext, buildCandidateStanceContext } from '@/lib/raceContext'

export const maxDuration = 60

const SECTIONS = ['facebook', 'instagram', 'newsletter', 'taglines', 'strategy', 'talking-points', 'press-release'] as const
type Section = typeof SECTIONS[number]

function toneInstruction(tone: string): string {
  const map: Record<string, string> = {
    'Punchy':           'Write in a punchy, high-energy style — short sentences, bold claims, urgent tone.',
    'Sophisticated':    'Write in a sophisticated, polished style — confident, authoritative, and refined.',
    'Intellectual':     'Write in an intellectual style — data-driven, thoughtful, cite specific facts and policy details.',
    'Policy-Oriented':  'Write in a policy-oriented style — focus on specific policy positions, outcomes, and governance details.',
  }
  return map[tone] ? `\n\nTONE INSTRUCTION: ${map[tone]}` : ''
}

function issueNote(issue: string): string {
  return issue.trim() ? `\n\nFOCUS ISSUE: Lean into "${issue.trim()}" as the primary theme throughout this content.` : ''
}

async function getContext(userId: string) {
  const candidate = await prisma.candidate.findFirst({
    where: { userId },
    select: { name: true, race: true, state: true, party: true, incumbent: true, raceLevel: true, district: true, county: true, city: true, bio: true, topIssues: true, electionDate: true, fundraisingGoal: true },
  })
  const articles  = await prisma.article.findMany({
    where: { userId },
    orderBy: { datePublished: 'desc' },
    take: 10,
  })
  const name      = candidate?.name      ?? 'the candidate'
  const race      = candidate?.race      ?? 'this race'
  const state     = candidate?.state     ?? 'the state'
  const party     = candidate?.party?.trim() || 'Independent'
  const incumbent = candidate?.incumbent ? `incumbent ${party}` : `${party} challenger`
  const headlines  = articles.map(a => `- ${a.title} (${a.sentiment ?? 'Neutral'})`).join('\n')
  const raceCtx    = candidate ? buildRaceContext({ ...candidate, name, race, state, incumbent: candidate.incumbent ?? false }) : `CANDIDATE: ${name}, running for ${race} in ${state}.`
  const stanceCtx  = await buildCandidateStanceContext(userId, prisma)
  return { name, race, state, party, incumbent, headlines, hasArticles: articles.length > 0, raceCtx: raceCtx + stanceCtx }
}

type Ctx = { name: string; race: string; state: string; party: string; incumbent: string; headlines: string; raceCtx: string }

const prompts: Record<Section, (ctx: Ctx, issue: string) => [string, string]> = {
  facebook: (ctx, issue) => [
    `You are an experienced campaign social media director. Write punchy, energetic Facebook posts that fire up the candidate's base and appeal to voters' values. No hashtags. Bold and direct.`,
    `${ctx.raceCtx}

Recent news coverage:
${ctx.headlines}
${issueNote(issue)}
Write 3 Facebook posts for this ${ctx.party} campaign. Calibrate scope and local vs. national framing to match the race level. For each: write a bold opening line that energizes supporters, a 2-sentence body grounded in the candidate's values and the CANDIDATE STANCE CONTEXT above, and a strong call-to-action. Separate each post with ---`,
  ],

  instagram: (ctx, issue) => [
    `You are an experienced campaign social media director. Write energizing Instagram captions that reflect the candidate's voice, values, and party platform. Include relevant hashtags.`,
    `${ctx.raceCtx}

Recent news coverage:
${ctx.headlines}
${issueNote(issue)}
Write 3 Instagram captions for this ${ctx.party} campaign. Calibrate scope and local vs. national framing to match the race level. Each should be 2-3 sentences reflecting the candidate's actual positions (from CANDIDATE STANCE CONTEXT above), then 5 relevant hashtags including geography-specific tags. Separate each with ---`,
  ],

  newsletter: (ctx, issue) => [
    `You are an experienced campaign communications director. Write a warm, energizing campaign newsletter that rallies the candidate's supporters and motivates action.`,
    `${ctx.raceCtx}

Recent news coverage:
${ctx.headlines}
${issueNote(issue)}
Write a campaign email newsletter calibrated to this race level (local community focus for municipal/county, state policy for state, national agenda for federal):
SUBJECT LINE:
PREVIEW TEXT:
BODY: (3 short paragraphs — open with the candidate's core values and positions from the CANDIDATE STANCE CONTEXT above, connect to current news, close with a call-to-action)

Keep it tight and motivating.`,
  ],

  taglines: (ctx, issue) => [
    `You are a political messaging expert. Write short, powerful campaign taglines and signage ideas that capture the candidate's values and winning energy.`,
    `${ctx.raceCtx}

Recent news coverage:
${ctx.headlines}
${issueNote(issue)}
Write taglines and signage ideas that match the race level (community-focused for local races, policy-focused for state, issue-driven for federal). Ground them in the candidate's actual positions from CANDIDATE STANCE CONTEXT above:
- 5 campaign taglines (short, punchy, authentic to this candidate)
- 3 yard sign / banner ideas (bold, ALL CAPS, 5 words or fewer)

Label each section clearly.`,
  ],

  strategy: (ctx, issue) => [
    `You are a senior campaign strategist. Give sharp, actionable tactical advice grounded in winning political strategy calibrated to this candidate's party and race level.`,
    `${ctx.raceCtx}

Recent news coverage:
${ctx.headlines}
${issueNote(issue)}
Give 4 tactical strategy recommendations for this ${ctx.party} campaign based on this news. Scale the advice to the race level — local/grassroots tactics for county/municipal races, media and legislative strategy for state races, national coalition-building for federal races. For each:
- Bold title
- Urgency level: HIGH / MEDIUM / LOW
- 2 sentences of specific advice grounded in the candidate's positions and current news

Focus on offense — where this candidate's message is strongest. Separate each with ---`,
  ],

  'talking-points': (_ctx, _issue) => ['', ''], // handled separately

  'press-release': (ctx, issue) => [
    `You are an experienced campaign communications director. Write polished, publication-ready press releases that command media attention and drive the narrative. Write in proper AP style.`,
    `${ctx.raceCtx}
${issueNote(issue)}
Write a complete press release for this ${ctx.party} campaign. Use the candidate's actual positions and background from CANDIDATE STANCE CONTEXT above. Structure it exactly as follows:

FOR IMMEDIATE RELEASE

[HEADLINE — bold, under 12 words, present tense, newsy]

[DATELINE] — [LEAD PARAGRAPH: The most important news in one punchy sentence. Who, what, where, when, why.]

[BODY PARAGRAPH 1: Context and significance — why this matters to voters in this race's geography and at this race level.]

[BODY PARAGRAPH 2: Policy substance — connect to the candidate's specific positions and the current news environment.]

CANDIDATE QUOTE:
"[A compelling 2-3 sentence quote from ${ctx.name} that sounds natural and quotable — grounded in the candidate's voice and actual stances]"
— ${ctx.name}, ${ctx.race}

[CLOSING PARAGRAPH: Call to action or forward-looking statement. Keep it tight.]

###

ABOUT THE CAMPAIGN:
[2-sentence boilerplate about the candidate and campaign — background, race, and why they're running.]

PRESS CONTACT:
[Name], Communications Director
[email@campaign.com] | [555-000-0000]`,
  ],
}

export async function POST(req: NextRequest) {
  const session = await auth()
  const userId  = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { section, tone = 'Punchy', issue = '' } = await req.json() as {
    section: Section
    tone?: string
    issue?: string
  }
  if (!SECTIONS.includes(section)) {
    return NextResponse.json({ error: 'invalid_section' }, { status: 400 })
  }
  const ctx = await getContext(userId)

  // Talking points: scrape news for the issue then generate points
  if (section === 'talking-points') {
    if (!issue.trim()) return NextResponse.json({ error: 'no_issue' }, { status: 400 })

    const encoded = encodeURIComponent(`"${ctx.state}" ${issue} 2026`)
    const rssUrl  = `https://news.google.com/rss/search?q=${encoded}&hl=en-US&gl=US&ceid=US:en`
    let headlines = ''
    try {
      const rss  = await fetch(rssUrl, { headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: 0 } })
      const xml  = await rss.text()
      const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? []
      headlines = items.slice(0, 8).map(item => {
        const t = item.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? ''
        return t.replace(/&amp;/g, '&').replace(/<!\[CDATA\[|\]\]>/g, '').trim()
      }).filter(Boolean).map((h, i) => `${i + 1}. ${h}`).join('\n')
    } catch { /* use no headlines */ }

    const content = await ask(
      `You are an experienced political communications strategist. Write sharp, memorable talking points grounded in the candidate's actual positions and values.${toneInstruction(tone)}`,
      `${ctx.raceCtx}
Issue: ${issue}
${headlines ? `\nRecent news on this issue:\n${headlines}\n` : ''}
Write exactly 3 talking points for this ${ctx.party} candidate's position on "${issue}", calibrated to this race level. Ground them in the candidate's known stances from CANDIDATE STANCE CONTEXT if available. For each:
TALKING POINT [N]: (one punchy, quotable sentence)
SUPPORT: (one sentence of evidence or reasoning)

Separate each with ---`,
      500,
    )
    return NextResponse.json({ content })
  }

  if (!ctx.hasArticles) {
    return NextResponse.json({ error: 'no_articles' }, { status: 400 })
  }

  const [system, user] = prompts[section](ctx, issue)
  const content = await ask(system + toneInstruction(tone), user, 500)
  return NextResponse.json({ content })
}
