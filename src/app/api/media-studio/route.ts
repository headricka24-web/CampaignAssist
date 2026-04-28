import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { ask } from '@/lib/claude'

export const maxDuration = 60

const SECTIONS = ['facebook', 'instagram', 'newsletter', 'taglines', 'strategy'] as const
type Section = typeof SECTIONS[number]

async function getContext() {
  const candidate = await prisma.candidate.findFirst()
  const articles  = await prisma.article.findMany({
    orderBy: { datePublished: 'desc' },
    take: 10,
  })
  const name      = candidate?.name      ?? 'the candidate'
  const race      = candidate?.race      ?? 'this race'
  const state     = candidate?.state     ?? 'the state'
  const incumbent = candidate?.incumbent ? 'incumbent Republican' : 'Republican challenger'
  const headlines = articles.map(a => `- ${a.title} (${a.sentiment ?? 'Neutral'})`).join('\n')
  return { name, race, state, incumbent, headlines, hasArticles: articles.length > 0 }
}

type Ctx = { name: string; race: string; state: string; incumbent: string; headlines: string }

const prompts: Record<Section, (ctx: Ctx) => [string, string]> = {
  facebook: (ctx) => [
    'You are a Republican campaign social media director. Write punchy, conservative Facebook posts that energize the GOP base and appeal to patriotic values. No hashtags. Bold and direct.',
    `Candidate: ${ctx.name} (${ctx.incumbent}), running for ${ctx.race} in ${ctx.state}.

Recent news coverage:
${ctx.headlines}

Write 3 Facebook posts for the Republican campaign. For each: write a bold opening line that fires up conservatives, a 2-sentence body grounded in Republican values, and a strong call-to-action. Separate each post with ---`,
  ],

  instagram: (ctx) => [
    'You are a Republican campaign social media director. Write energizing Instagram captions with a patriotic, conservative voice and relevant hashtags.',
    `Candidate: ${ctx.name} (${ctx.incumbent}), running for ${ctx.race} in ${ctx.state}.

Recent news coverage:
${ctx.headlines}

Write 3 Instagram captions for the Republican campaign. Each should be 2-3 sentences with a conservative message, then 5 relevant hashtags (include #GOP, #Republican, and state-specific tags). Separate each with ---`,
  ],

  newsletter: (ctx) => [
    'You are a Republican campaign communications director. Write a warm, energizing campaign newsletter that rallies the conservative base and motivates action.',
    `Candidate: ${ctx.name} (${ctx.incumbent}), running for ${ctx.race} in ${ctx.state}.

Recent news coverage:
${ctx.headlines}

Write a campaign email newsletter with:
SUBJECT LINE:
PREVIEW TEXT:
BODY: (3 short paragraphs — open with conservative values, connect to current news, close with a call-to-action)

Keep it tight and motivating.`,
  ],

  taglines: (ctx) => [
    'You are a Republican political messaging expert. Write short, powerful campaign taglines that capture conservative values and winning energy.',
    `Candidate: ${ctx.name} (${ctx.incumbent}), running for ${ctx.race} in ${ctx.state}.

Recent news coverage:
${ctx.headlines}

Write:
- 5 campaign taglines (short, punchy, conservative — think America, freedom, strength, common sense)
- 3 yard sign / banner ideas (bold, ALL CAPS, 5 words or fewer)

Label each section clearly.`,
  ],

  strategy: (ctx) => [
    'You are a senior Republican campaign strategist. Give sharp, actionable tactical advice grounded in conservative political strategy and GOP winning playbooks.',
    `Candidate: ${ctx.name} (${ctx.incumbent}), running for ${ctx.race} in ${ctx.state}.

Recent news coverage:
${ctx.headlines}

Give 4 tactical Republican strategy recommendations based on this news. For each:
- Bold title
- Urgency level: HIGH / MEDIUM / LOW
- 2 sentences of specific advice on how to use this for a GOP win

Focus on offense — where the Republican message is strongest and where Democrats are vulnerable. Separate each with ---`,
  ],
}

export async function POST(req: NextRequest) {
  const { section } = await req.json() as { section: Section }
  if (!SECTIONS.includes(section)) {
    return NextResponse.json({ error: 'invalid_section' }, { status: 400 })
  }

  const ctx = await getContext()
  if (!ctx.hasArticles) {
    return NextResponse.json({ error: 'no_articles' }, { status: 400 })
  }

  const [system, user] = prompts[section](ctx)
  const content = await ask(system, user, 500)
  return NextResponse.json({ content })
}
