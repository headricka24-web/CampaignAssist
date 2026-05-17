import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { ask } from '@/lib/claude'
import { auth } from '@/auth'
import { buildRaceContext } from '@/lib/raceContext'

export const maxDuration = 60

const PHASES   = ['early', 'middle', 'final-push', 'gotv'] as const
const BUDGETS  = ['under-5k', '5k-25k', '25k-100k', '100k-plus'] as const
type Phase     = typeof PHASES[number]
type Budget    = typeof BUDGETS[number]

const PHASE_LABELS: Record<Phase, string> = {
  'early':      'Early Campaign (6+ months out)',
  'middle':     'Mid-Campaign (2–6 months out)',
  'final-push': 'Final Push (last 30–60 days)',
  'gotv':       'GOTV (final 2 weeks)',
}

const BUDGET_LABELS: Record<Budget, string> = {
  'under-5k':   'Under $5,000',
  '5k-25k':     '$5,000 – $25,000',
  '25k-100k':   '$25,000 – $100,000',
  '100k-plus':  '$100,000+',
}

async function getContext(userId: string) {
  const candidate = await prisma.candidate.findFirst({
    where: { userId },
    select: { name: true, race: true, state: true, incumbent: true, raceLevel: true, district: true, county: true, city: true },
  })
  if (!candidate) return null
  const raceCtx = buildRaceContext({ ...candidate, incumbent: candidate.incumbent ?? false })
  return { raceCtx }
}

export async function POST(req: NextRequest) {
  const { phase, budget } = await req.json() as { phase: Phase; budget: Budget }

  if (!PHASES.includes(phase) || !BUDGETS.includes(budget)) {
    return NextResponse.json({ error: 'invalid_params' }, { status: 400 })
  }

  const session = await auth()
  const userId  = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const ctx = await getContext(userId)
  if (!ctx) return NextResponse.json({ error: 'no_candidate' }, { status: 400 })

  const system = `You are a senior Republican political media consultant who has run ad campaigns for candidates at every level — municipal to federal. You give precise, budget-conscious, phase-appropriate advertising strategy. You are direct, practical, and focused on winning.`

  const user = `${ctx.raceCtx}

CAMPAIGN PHASE: ${PHASE_LABELS[phase]}
ADVERTISING BUDGET: ${BUDGET_LABELS[budget]}

Build a complete advertising strategy plan for this phase and budget. Structure your response as follows:

## STRATEGIC OBJECTIVE
One sentence on what this phase needs to accomplish.

## RECOMMENDED AD MIX
List the specific ad formats to use (e.g., digital display, radio, TV, direct mail, social video). For each:
- FORMAT: [name]
- BUDGET ALLOCATION: [% of total budget + rough dollar range]
- WHY: [1 sentence rationale based on race level and phase]

## TARGETING PRIORITIES
3 bullet points on which voter segments and geographies to prioritize.

## MEDIA BUYING NOTES
2–3 practical tips on where/how to buy for this race level and budget (e.g., specific platforms, dayparts, direct buy vs. programmatic).

## MESSAGING FOCUS
The 2–3 core message themes that should run in every ad this phase.

## WHAT TO AVOID
2 common mistakes candidates at this budget/phase make — and what to do instead.

Be specific to the race level and budget. Don't recommend TV buys for a $3,000 municipal budget.`

  const content = await ask(system, user, 900)
  return NextResponse.json({ content })
}
