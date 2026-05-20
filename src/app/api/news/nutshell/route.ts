import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ask } from '@/lib/claude'
import { auth } from '@/auth'
import { buildRaceContext } from '@/lib/raceContext'

export const maxDuration = 45

export async function POST() {
  const session = await auth()
  const userId  = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const candidate = await prisma.candidate.findFirst({
    where:  { userId },
    select: { name: true, race: true, state: true, party: true, incumbent: true, raceLevel: true, district: true, county: true, city: true, bio: true, topIssues: true, electionDate: true, fundraisingGoal: true },
  })

  const articles = await prisma.article.findMany({
    where:   { userId },
    orderBy: { datePublished: 'desc' },
    take:    60,
    select:  { title: true, summary: true, sentiment: true, bucket: true, topics: true, datePublished: true, outlet: { select: { name: true } } },
  })

  if (articles.length === 0) {
    return NextResponse.json({ error: 'no_articles' }, { status: 400 })
  }

  const raceCtx = candidate
    ? buildRaceContext({ ...candidate, incumbent: candidate.incumbent ?? false })
    : ''

  const articleLines = articles.map(a => {
    const topicsArr: string[] = (() => { try { return JSON.parse(a.topics) as string[] } catch { return [] } })()
    const topicStr = topicsArr.length > 0 ? ` [${topicsArr.join(', ')}]` : ''
    const dateStr  = new Date(a.datePublished).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const bucket   = a.bucket ?? 'General'
    const summary  = a.summary ? ` — ${a.summary.slice(0, 120)}` : ''
    return `[${bucket}] (${dateStr}) ${a.outlet.name}: "${a.title}"${topicStr}${summary}`
  }).join('\n')

  const nutshell = await ask(
    `You are a sharp campaign intelligence analyst. You synthesize news coverage quickly and clearly — no filler, no padding. Write like you're briefing a candidate who has 90 seconds before walking on stage.`,
    `${raceCtx}

RECENT MEDIA COVERAGE (${articles.length} articles):
${articleLines}

Write an "In a Nutshell" intelligence briefing. Be punchy and specific. Structure it exactly as follows:

## BREAKING / MOST URGENT
1–3 sentences on the single most time-sensitive story or development in the coverage. If nothing is truly breaking, say so briefly.

## CONSISTENT THEMES
The 3–4 topics or narratives that keep appearing across multiple articles. For each:
- **[Topic]:** One sentence on how it's being framed and what it signals.

## SENTIMENT SNAPSHOT
One sentence on the overall tone of coverage — is the press favorable, critical, mixed? Call out any sharp shifts.

## WHAT TO WATCH
1–2 lines on a story or thread that's just starting to surface and could become a bigger issue in the next news cycle.`,
    700,
  )

  return NextResponse.json({ nutshell, articleCount: articles.length })
}
