import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ask } from '@/lib/claude'

export const maxDuration = 60

function toneInstruction(tone: string): string {
  const map: Record<string, string> = {
    'Punchy':          'Write in a punchy, high-energy style — short sentences, bold claims, urgent tone.',
    'Sophisticated':   'Write in a sophisticated, polished style — confident, authoritative, and refined.',
    'Intellectual':    'Write in an intellectual style — data-driven, thoughtful, cite specific facts and policy details.',
    'Policy-Oriented': 'Write in a policy-oriented style — focus on specific policy positions, outcomes, and governance details.',
  }
  return map[tone] ? `\n\nTONE INSTRUCTION: ${map[tone]}` : ''
}

const TYPES = ['email', 'directmail', 'callscript', 'textscript', 'majordonor', 'thankyou'] as const
type FundType = typeof TYPES[number]

async function getContext() {
  const candidate = await prisma.candidate.findFirst()
  const articles  = await prisma.article.findMany({ orderBy: { datePublished: 'desc' }, take: 8 })
  const name      = candidate?.name      ?? 'our candidate'
  const race      = candidate?.race      ?? 'this race'
  const state     = candidate?.state     ?? 'our state'
  const incumbent = candidate?.incumbent ? 'incumbent Republican' : 'Republican challenger'
  const headlines = articles.map(a => `- ${a.title}`).join('\n')
  return { name, race, state, incumbent, headlines }
}

function targetingNote(demographic: string, issue: string): string {
  const parts: string[] = []
  if (demographic && demographic !== 'General') parts.push(`TARGET DEMOGRAPHIC: ${demographic}`)
  if (issue && issue !== 'General') parts.push(`FOCUS ISSUE: ${issue}`)
  if (parts.length === 0) return ''
  return `\n\nIMPORTANT TARGETING:\n${parts.join('\n')}\nTailor every word of this piece specifically to this audience and issue. Reference their conservative values, concerns, and language directly.`
}

type Ctx = { name: string; race: string; state: string; incumbent: string; headlines: string }

const prompts: Record<FundType, (c: Ctx, demographic: string, issue: string) => [string, string]> = {
  email: (c, d, iss) => [
    'You are a Republican political fundraising director. Write short, urgent fundraising emails that fire up the conservative base. Appeal to patriotism, freedom, and the stakes of losing to the left. Be direct.',
    `${c.name} (${c.incumbent}), running for ${c.race} in ${c.state}.${targetingNote(d, iss)}

Write a GOP fundraising email:
SUBJECT LINE:
PREVIEW TEXT:
BODY: (2 short paragraphs — open with the conservative stakes, close with urgency + donation ask of $25/$50/$100)
SIGN OFF:`,
  ],

  directmail: (c, d, iss) => [
    'You are a Republican direct mail expert. Write concise, high-impact conservative mail copy that motivates donors and contrasts with the opposition.',
    `${c.name} (${c.incumbent}), running for ${c.race} in ${c.state}.${targetingNote(d, iss)}

Write a Republican direct mail piece:
ENVELOPE TEASER:
HEADLINE:
BODY: (2 short paragraphs — lead with conservative values, contrast with the left)
ASK: ($35 / $75 / $150 / Other)
P.S.:`,
  ],

  callscript: (c, d, iss) => [
    'You are a Republican phone banking director. Write natural, brief call scripts for GOP volunteers. Warm but focused on conservative wins.',
    `${c.name} (${c.incumbent}), running for ${c.race} in ${c.state}.${targetingNote(d, iss)}

Write a GOP call script:
OPENING: (use [VOLUNTEER NAME], mention the Republican cause)
PITCH: (2-3 sentences on why ${c.name} is the conservative choice)
ASK:
TOP 2 OBJECTIONS + RESPONSES: (handle common pushback with conservative framing)
CLOSING:`,
  ],

  textscript: (c, d, iss) => [
    'Write short Republican SMS fundraising messages. Under 160 chars each. Patriotic, urgent, conservative tone.',
    `${c.name} (${c.incumbent}), running for ${c.race} in ${c.state}.${targetingNote(d, iss)}

Write 4 SMS messages:
MESSAGE 1 — INTRO: (160 chars, mention GOP/Republican, include STOP to opt out)
MESSAGE 2 — ISSUE: (160 chars, conservative framing)
MESSAGE 3 — ASK: (160 chars, use [LINK])
MESSAGE 4 — FOLLOW-UP: (160 chars)`,
  ],

  majordonor: (c, d, iss) => [
    'Write a sophisticated Republican major donor ask letter. Personal, concise, and compelling — appeal to the donor\'s investment in conservative governance and the GOP\'s long-term vision.',
    `${c.name} (${c.incumbent}), running for ${c.race} in ${c.state}.${targetingNote(d, iss)}

Write a major donor letter ($1,000+):
OPENING: (use [DONOR NAME], reference their commitment to conservative values)
THE MOMENT: (why this race matters for the Republican agenda, 2 sentences)
THE ASK: ($1,000 / $2,500 / max)
CLOSE:
P.S.:`,
  ],

  thankyou: (c, d, iss) => [
    'Write warm, brief Republican campaign donor thank-you notes. Reference the conservative mission and make donors feel like partners in the GOP cause.',
    `${c.name} (${c.incumbent}), running for ${c.race} in ${c.state}.${targetingNote(d, iss)}

Write 3 short thank-you templates (2-3 sentences each, use [DONOR NAME] and [AMOUNT]):
TEMPLATE 1 — FIRST-TIME ($25-$99): (welcome them to the Republican team)
TEMPLATE 2 — REPEAT ($100-$499): (acknowledge their ongoing loyalty to the cause)
TEMPLATE 3 — MAJOR ($500+): (treat them as a key partner in the conservative movement)`,
  ],
}

export async function POST(req: NextRequest) {
  const { type, demographic = 'General', issue = 'General', tone = 'Punchy' } = await req.json() as {
    type: FundType
    demographic?: string
    issue?: string
    tone?: string
  }
  if (!TYPES.includes(type)) return NextResponse.json({ error: 'invalid_type' }, { status: 400 })

  const ctx = await getContext()
  const [system, user] = prompts[type](ctx, demographic, issue)
  const content = await ask(system + toneInstruction(tone), user, 500)
  return NextResponse.json({ content })
}
