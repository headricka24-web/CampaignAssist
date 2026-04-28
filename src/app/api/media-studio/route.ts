import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { ask } from '@/lib/claude'

const SECTIONS = ['facebook', 'instagram', 'newsletter', 'taglines', 'strategy'] as const
type Section = typeof SECTIONS[number]

async function getContext() {
  const candidate = await prisma.candidate.findFirst()
  const articles = await prisma.article.findMany({
    orderBy: { datePublished: 'desc' },
    take: 10,
  })
  const name = candidate?.name ?? 'the candidate'
  const race = candidate ? `${candidate.race} in ${candidate.state}` : 'this race'
  const headlines = articles.map(a => `- ${a.title} (${a.sentiment ?? 'Neutral'})`).join('\n')
  return { name, race, headlines, hasArticles: articles.length > 0 }
}

const prompts: Record<Section, (ctx: { name: string; race: string; headlines: string }) => [string, string]> = {
  facebook: (ctx) => [
    'You are a campaign social media director. Write punchy Facebook posts that drive engagement. No hashtags.',
    `Candidate: ${ctx.name}, running for ${ctx.race}.\n\nRecent news:\n${ctx.headlines}\n\nWrite 3 Facebook posts. For each, write a bold opening line, 2-sentence body, and a call-to-action. Separate each post with ---`,
  ],
  instagram: (ctx) => [
    'You are a campaign social media director. Write Instagram captions with energy and hashtags.',
    `Candidate: ${ctx.name}, running for ${ctx.race}.\n\nRecent news:\n${ctx.headlines}\n\nWrite 3 Instagram captions. Each should be 2-3 sentences with 5 hashtags at the end. Separate each with ---`,
  ],
  newsletter: (ctx) => [
    'You are a campaign communications director. Write a warm, energizing campaign newsletter.',
    `Candidate: ${ctx.name}, running for ${ctx.race}.\n\nRecent news:\n${ctx.headlines}\n\nWrite a campaign email newsletter with: Subject line, Preview text, and 3 short body paragraphs. Label each section clearly.`,
  ],
  taglines: (ctx) => [
    'You are a political messaging expert. Write short, memorable campaign taglines and signage text.',
    `Candidate: ${ctx.name}, running for ${ctx.race}.\n\nRecent news:\n${ctx.headlines}\n\nWrite:\n- 5 campaign taglines (short, punchy)\n- 3 yard sign / banner ideas (bold, ALL CAPS style)\n\nLabel each section.`,
  ],
  strategy: (ctx) => [
    'You are a senior campaign strategist. Give sharp, actionable tactical advice.',
    `Candidate: ${ctx.name}, running for ${ctx.race}.\n\nRecent news:\n${ctx.headlines}\n\nGive 4 tactical strategy recommendations based on this news. For each: write a bold title, mark urgency (HIGH/MEDIUM/LOW), and give 2 sentences of advice. Separate each with ---`,
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
