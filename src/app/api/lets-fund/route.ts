import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ask } from '@/lib/claude'

export const maxDuration = 60

const TYPES = ['email', 'directmail', 'callscript', 'textscript', 'majordonor', 'thankyou'] as const
type FundType = typeof TYPES[number]

async function getContext() {
  const candidate = await prisma.candidate.findFirst()
  const articles  = await prisma.article.findMany({ orderBy: { datePublished: 'desc' }, take: 8 })
  const name      = candidate?.name  ?? 'our candidate'
  const race      = candidate?.race  ?? 'this race'
  const state     = candidate?.state ?? 'our state'
  const headlines = articles.map(a => `- ${a.title}`).join('\n')
  return { name, race, state, headlines }
}

function targetingNote(demographic: string, issue: string): string {
  const parts: string[] = []
  if (demographic && demographic !== 'General') parts.push(`TARGET DEMOGRAPHIC: ${demographic}`)
  if (issue && issue !== 'General') parts.push(`FOCUS ISSUE: ${issue}`)
  if (parts.length === 0) return ''
  return `\n\nIMPORTANT TARGETING:\n${parts.join('\n')}\nTailor every word of this piece specifically to this audience and issue. Reference their values, concerns, and language directly.`
}

type Ctx = { name: string; race: string; state: string; headlines: string }

const prompts: Record<FundType, (c: Ctx, demographic: string, issue: string) => [string, string]> = {
  email: (c, d, iss) => [
    'You are a political fundraising director. Write short, punchy fundraising emails. Be direct and urgent.',
    `${c.name}, ${c.race}, ${c.state}.${targetingNote(d, iss)}

Write a fundraising email:
SUBJECT LINE:
PREVIEW TEXT:
BODY: (2 short paragraphs + donation ask of $25/$50/$100)
SIGN OFF:`,
  ],

  directmail: (c, d, iss) => [
    'You are a political direct mail expert. Write concise, high-impact mail copy.',
    `${c.name}, ${c.race}, ${c.state}.${targetingNote(d, iss)}

Write a direct mail piece:
ENVELOPE TEASER:
HEADLINE:
BODY: (2 short paragraphs)
ASK: ($35 / $75 / $150 / Other)
P.S.:`,
  ],

  callscript: (c, d, iss) => [
    'You are a phone banking director. Write natural, brief call scripts.',
    `${c.name}, ${c.race}, ${c.state}.${targetingNote(d, iss)}

Write a call script:
OPENING: (use [VOLUNTEER NAME])
PITCH: (2-3 sentences)
ASK:
TOP 2 OBJECTIONS + RESPONSES:
CLOSING:`,
  ],

  textscript: (c, d, iss) => [
    'Write short political SMS fundraising messages. Under 160 chars each.',
    `${c.name}, ${c.race}, ${c.state}.${targetingNote(d, iss)}

Write 4 SMS messages:
MESSAGE 1 — INTRO: (160 chars, include STOP to opt out)
MESSAGE 2 — ISSUE: (160 chars)
MESSAGE 3 — ASK: (160 chars, use [LINK])
MESSAGE 4 — FOLLOW-UP: (160 chars)`,
  ],

  majordonor: (c, d, iss) => [
    'Write a sophisticated major donor ask letter. Personal, concise, compelling.',
    `${c.name}, ${c.race}, ${c.state}.${targetingNote(d, iss)}

Write a major donor letter ($1,000+):
OPENING: (use [DONOR NAME])
THE MOMENT: (why this race matters now, 2 sentences)
THE ASK: ($1,000 / $2,500 / max)
CLOSE:
P.S.:`,
  ],

  thankyou: (c, d, iss) => [
    'Write warm, brief campaign donor thank-you notes.',
    `${c.name}, ${c.race}, ${c.state}.${targetingNote(d, iss)}

Write 3 short thank-you templates (2-3 sentences each, use [DONOR NAME] and [AMOUNT]):
TEMPLATE 1 — FIRST-TIME ($25-$99):
TEMPLATE 2 — REPEAT ($100-$499):
TEMPLATE 3 — MAJOR ($500+):`,
  ],
}

export async function POST(req: NextRequest) {
  const { type, demographic = 'General', issue = 'General' } = await req.json() as {
    type: FundType
    demographic?: string
    issue?: string
  }
  if (!TYPES.includes(type)) return NextResponse.json({ error: 'invalid_type' }, { status: 400 })

  const ctx = await getContext()
  const [system, user] = prompts[type](ctx, demographic, issue)
  const content = await ask(system, user, 500)
  return NextResponse.json({ content })
}
