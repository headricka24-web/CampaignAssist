import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import { ask } from '@/lib/claude'
import { buildRaceContext, buildCandidateStanceContext } from '@/lib/raceContext'

export const maxDuration = 60

async function getCandidate(userId: string) {
  return prisma.candidate.findFirst({
    where: { userId },
    select: { id: true, name: true, race: true, state: true, party: true, incumbent: true, raceLevel: true, district: true, county: true, city: true, bio: true, topIssues: true, electionDate: true, fundraisingGoal: true },
  })
}

// ── GET — load stored threats (most recent scan, non-dismissed) ───────────────
export async function GET(req: NextRequest) {
  const session = await auth()
  const userId  = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const includeDismissed = searchParams.get('dismissed') === 'true'
  const candidate = await getCandidate(userId)

  const threats = await prisma.threatRecord.findMany({
    where: {
      candidateId: candidate?.id ?? undefined,
      ...(includeDismissed ? {} : { dismissed: false }),
    },
    orderBy: [
      { severity: 'asc' }, // HIGH sorts before MEDIUM/LOW alphabetically
      { createdAt: 'desc' },
    ],
    include: { scan: { select: { createdAt: true } } },
  })

  // Sort: HIGH first, then MEDIUM, then LOW
  const order = { HIGH: 0, MEDIUM: 1, LOW: 2 }
  const sorted = [...threats].sort((a, b) =>
    (order[a.severity as keyof typeof order] ?? 1) - (order[b.severity as keyof typeof order] ?? 1)
  )

  return NextResponse.json({ threats: sorted })
}

// ── PATCH — update a threat (save response, dismiss, add notes) ───────────────
export async function PATCH(req: NextRequest) {
  const session = await auth()
  const userId  = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const candidate = await getCandidate(userId)
  const { id, response, dismissed, notes } = await req.json() as {
    id: string; response?: string; dismissed?: boolean; notes?: string
  }
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const existing = await prisma.threatRecord.findUnique({ where: { id } })
  if (!existing || existing.candidateId !== candidate?.id) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }

  const threat = await prisma.threatRecord.update({
    where: { id },
    data: {
      ...(response  !== undefined && { response }),
      ...(dismissed !== undefined && { dismissed }),
      ...(notes     !== undefined && { notes }),
    },
  })
  return NextResponse.json(threat)
}

// ── POST — scan for threats OR generate a response ────────────────────────────
export async function POST(req: NextRequest) {
  const session = await auth()
  const userId  = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json() as { type: 'scan' | 'respond'; threat?: string; threatId?: string }

  const candidate = await getCandidate(userId)
  const name     = candidate?.name  ?? 'the candidate'
  const state    = candidate?.state ?? 'the state'
  const race     = candidate?.race  ?? 'this race'
  const raceCtx  = candidate ? buildRaceContext({ ...candidate, name, race, state, incumbent: candidate.incumbent ?? false }) : `CANDIDATE: ${name}, running for ${race} in ${state}.`

  // ── SCAN ──────────────────────────────────────────────────────────────────
  if (body.type === 'scan') {
    const articles = await prisma.article.findMany({
      where:   { userId },
      orderBy: { datePublished: 'desc' },
      take: 40,
      include: { outlet: true },
    })

    const manualContext = (body as { type: string; manualContext?: string }).manualContext?.trim() ?? ''

    if (articles.length === 0 && !manualContext) {
      return NextResponse.json({ error: 'no_articles' }, { status: 400 })
    }

    const articleList = articles.length > 0
      ? articles.map(a => `- [${a.bucket ?? 'General'}] "${a.title}" (${a.outlet.name}) — Sentiment: ${a.sentiment ?? 'Neutral'}`).join('\n')
      : null

    const sourceBlock = articleList
      ? `Here are the currently tracked news articles:\n${articleList}`
      : `No news articles are tracked yet. Use the candidate context and the following background information to identify threats:\n${manualContext}`

    const raw = await ask(
      `You are an expert opposition research director and crisis communications strategist. Your job is to find every possible attack vector the opposition could use against this candidate. Be blunt, specific, and thorough. Think like the opponent's campaign manager.`,
      `${raceCtx}

${sourceBlock}

Identify 4-6 SPECIFIC THREATS scaled to this race level (local/community attacks for municipal/county races; state media and legislative attacks for state races; national opposition and media attacks for federal races) — attack angles the opponent or media could use against ${name}.

For each threat write exactly this format:

THREAT: [one-line description of the attack]
SEVERITY: [HIGH / MEDIUM / LOW]
ANGLE: [how the opposition would frame this attack in one sentence]
WHY IT MATTERS: [one sentence on why this hurts the campaign if left unanswered]

Separate each threat with ---`,
      1200,
    )

    // Parse threats from AI response
    type ParsedThreat = { threat: string; severity: 'HIGH' | 'MEDIUM' | 'LOW'; angle: string; why: string }
    const parsed: ParsedThreat[] = raw.split('---').map(block => {
      const get = (key: string) => block.match(new RegExp(`${key}:\\s*(.+)`, 'i'))?.[1]?.trim() ?? ''
      const sev = get('SEVERITY').toUpperCase()
      return {
        threat:   get('THREAT'),
        severity: (['HIGH','MEDIUM','LOW'].includes(sev) ? sev : 'MEDIUM') as 'HIGH' | 'MEDIUM' | 'LOW',
        angle:    get('ANGLE'),
        why:      get('WHY IT MATTERS'),
      }
    }).filter(t => t.threat)

    // Persist to database
    if (parsed.length > 0 && candidate?.id) {
      const scan = await prisma.threatScan.create({ data: { candidateId: candidate.id } })
      await prisma.threatRecord.createMany({
        data: parsed.map(t => ({
          candidateId: candidate.id!,
          scanId:      scan.id,
          threat:      t.threat,
          severity:    t.severity,
          angle:       t.angle,
          why:         t.why,
        })),
      })
    }

    return NextResponse.json({ threats: raw })
  }

  // ── RESPOND ───────────────────────────────────────────────────────────────
  if (body.type === 'respond') {
    const threat     = body.threat ?? 'this attack'
    const stanceCtx  = await buildCandidateStanceContext(userId, prisma)

    const response = await ask(
      `You are an experienced rapid-response communications director. Write sharp, confident, on-offense counter-messaging grounded in the candidate's actual positions. Never be defensive — always pivot to this candidate's strengths.`,
      `${raceCtx}${stanceCtx}

THREAT TO RESPOND TO:
${threat}

Write a rapid response package:

RAPID RESPONSE STATEMENT: (2-3 sentences, quote-ready for media)
PIVOT MESSAGE: (one sentence that turns this attack into a Republican win)
SOCIAL MEDIA COUNTER: (under 280 chars, punchy and shareable)
TALKING POINTS FOR SURROGATES: (3 bullet points volunteers/surrogates can use)`,
      600,
    )

    // If a threatId was provided, persist the response
    if (body.threatId && candidate?.id) {
      const existing = await prisma.threatRecord.findUnique({ where: { id: body.threatId } })
      if (existing?.candidateId === candidate.id) {
        await prisma.threatRecord.update({ where: { id: body.threatId }, data: { response } })
      }
    }

    return NextResponse.json({ response })
  }

  return NextResponse.json({ error: 'invalid_type' }, { status: 400 })
}
