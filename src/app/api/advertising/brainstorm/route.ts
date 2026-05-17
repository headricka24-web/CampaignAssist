import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { ask } from '@/lib/claude'
import { auth } from '@/auth'
import { buildRaceContext } from '@/lib/raceContext'

export const maxDuration = 60

async function getContext(userId: string) {
  const candidate = await prisma.candidate.findFirst({
    where: { userId },
    select: { name: true, race: true, state: true, incumbent: true, raceLevel: true, district: true, county: true, city: true },
  })
  if (!candidate) return null

  // Pull recent articles — headlines inform ad concept themes
  const articles = await prisma.article.findMany({
    where: { userId },
    orderBy: { datePublished: 'desc' },
    take: 8,
    select: { title: true, sentiment: true },
  })

  const raceCtx = buildRaceContext({ ...candidate, incumbent: candidate.incumbent ?? false })
  return { raceCtx, articles }
}

export async function POST(req: NextRequest) {
  const { theme = '' } = await req.json() as { theme?: string }

  const session = await auth()
  const userId  = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const ctx = await getContext(userId)
  if (!ctx) return NextResponse.json({ error: 'no_candidate' }, { status: 400 })

  const headlineLines = ctx.articles.length
    ? ctx.articles.map(a => `- ${a.title} (${a.sentiment ?? 'Neutral'})`).join('\n')
    : ''

  const system = `You are a creative Republican political ad director known for producing breakthrough campaign ads — concepts that are memorable, emotionally resonant, and built to win. You think in visuals, narratives, and voter psychology. Your ideas are bold, specific, and executable.`

  const user = `${ctx.raceCtx}

${theme ? `REQUESTED THEME / FOCUS: ${theme}\n` : ''}
${headlineLines ? `RECENT NEWS / INTELLIGENCE:\n${headlineLines}\n` : ''}

Generate 5 distinct, creative ad concepts for this campaign. For each concept:

**CONCEPT [N]: [MEMORABLE TITLE]**
FORMAT: [Best format — TV :30, Radio, Social Video, Direct Mail, Digital Display, etc.]
HOOK: [The single most important element that makes this ad work — the opening image, line, or idea]
NARRATIVE: [2–3 sentences describing the full arc of the ad]
KEY MESSAGE: [The one thing a voter remembers after seeing this ad]
WHY IT WINS: [One sentence on the psychological or strategic reason this concept works]

---

Make the concepts varied — different emotions, different formats, different angles. At least one should be an attack/contrast concept, at least one should be a positive/biographical concept, and at least one should be issue-based.`

  const content = await ask(system, user, 1000)
  return NextResponse.json({ content })
}
