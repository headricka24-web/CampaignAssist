/**
 * Builds a race-level context string injected into every AI prompt.
 * Tailors tone, scope, dollar amounts, and geographic specificity
 * based on the candidate's race level (federal / state / county / municipal).
 */

type CandidateGeo = {
  name:            string
  race:            string
  state:           string
  party?:          string | null
  incumbent:       boolean
  raceLevel:       string | null
  district:        string | null
  county:          string | null
  city:            string | null
  bio?:            string | null
  topIssues?:      string | null
  electionDate?:   string | null
  fundraisingGoal?: number | null
}

export function buildRaceContext(c: CandidateGeo): string {
  const level = (c.raceLevel ?? '').toLowerCase()
  const party = c.party?.trim() || 'Independent'

  // ── Geography label ─────────────────────────────────────────────
  const geoLabel = (() => {
    if (level === 'federal' && c.district)  return `${c.state} Congressional District ${c.district}`
    if (level === 'state'   && c.district)  return `${c.state} District ${c.district}`
    if (level === 'county'  && c.county)    return `${c.county} County, ${c.state}`
    if (level === 'municipal' && c.city)    return `${c.city}, ${c.state}`
    return c.state || 'Unknown Geography'
  })()

  // ── Status label ────────────────────────────────────────────────
  const status = c.incumbent ? `incumbent ${party}` : `${party} challenger`

  // ── Base line ───────────────────────────────────────────────────
  const base = `CANDIDATE: ${c.name || 'Unknown'} (${status}), running for ${c.race || 'office'} in ${geoLabel}.`

  // ── Race-level guidance ─────────────────────────────────────────
  const guidance = (() => {
    switch (level) {

      case 'federal':
        return `RACE LEVEL: U.S. federal race. This candidate competes in national media, attracts national donors, and must address both district-level constituent concerns and national ${party} priorities. Content should reference the ${party} agenda, federal policy (taxes, border, defense, economy), and use language appropriate for a congressional or Senate race. Fundraising asks should reflect federal-level ranges ($25–$2,900 for individuals; major donor tier $1,000+). Threats may include national media scrutiny and opposition from opposing parties and national organizations.`

      case 'state':
        return `RACE LEVEL: State-level race. This candidate operates in state media markets and addresses state legislative priorities — budget, education, infrastructure, state taxes, and state-specific policy. Content should be tailored to ${c.state} voters and the ${party} platform. Fundraising asks are mid-range ($25–$1,000 typical; major donor $500–$2,500). Threats are primarily from opposing candidates and state/regional media.`

      case 'county':
        return `RACE LEVEL: County-level race. This is a local government race focused on county services — property taxes, law enforcement, zoning, roads, and county budget. Content must be hyper-local and speak to ${c.county ? c.county + ' County' : c.state} residents directly. Avoid national political language unless tying to a local impact. Fundraising asks are modest ($10–$500 typical). Threats are local — neighborhood issues, local newspaper coverage, opponent endorsements from local organizations.`

      case 'municipal':
        return `RACE LEVEL: Municipal/local race. This is a city, town, or special district race (mayor, city council, school board, etc.) focused on community-level issues — local schools, public safety, city budget, local taxes, zoning, and quality of life. Content must speak directly to ${c.city ? c.city : c.state} residents and their daily concerns. Keep messaging community-focused and avoid heavy national partisan framing unless directly relevant. Fundraising asks are very modest ($10–$250 typical). Threats are community-specific — local endorsements, neighborhood newspapers, social media groups, PTA networks.`

      default:
        return `RACE LEVEL: Campaign race. Tailor content to the candidate's specific race and constituency.`
    }
  })()

  // ── Campaign detail context ─────────────────────────────────────────
  const extras: string[] = []
  if (c.topIssues?.trim())    extras.push(`TOP CAMPAIGN ISSUES: ${c.topIssues.trim()}`)
  if (c.bio?.trim())          extras.push(`CANDIDATE BACKGROUND: ${c.bio.trim()}`)
  if (c.electionDate?.trim()) extras.push(`ELECTION DATE: ${c.electionDate.trim()}`)
  if (c.fundraisingGoal)      extras.push(`FUNDRAISING GOAL: $${c.fundraisingGoal.toLocaleString()}`)

  const detail = extras.length > 0 ? `\n${extras.join('\n')}` : ''

  return `${base}\n${guidance}${detail}`
}

/**
 * Short one-liner for use in fundraising prompts where the ask range matters.
 */
export function askRange(raceLevel: string | null): string {
  switch ((raceLevel ?? '').toLowerCase()) {
    case 'federal':   return '$25–$2,900'
    case 'state':     return '$25–$1,000'
    case 'county':    return '$10–$500'
    case 'municipal': return '$10–$250'
    default:          return '$25–$500'
  }
}

/**
 * Builds a candidate-stance context block from stored articles and hot-buttons briefing.
 * Injects actual positions/priorities into every politically-sensitive copy prompt so
 * generated content reflects the candidate's real stances rather than generic party messaging.
 */
import type { PrismaClient } from '@prisma/client'

export async function buildCandidateStanceContext(
  userId: string,
  prisma: PrismaClient,
): Promise<string> {
  const [articles, hotButtons] = await Promise.all([
    prisma.article.findMany({
      where:   { userId, bucket: { in: ['CandidateCoverage', 'HotButtons'] } },
      orderBy: { datePublished: 'desc' },
      take:    20,
      select:  { title: true, summary: true, bucket: true, topics: true },
    }),
    prisma.generatedContent.findUnique({
      where:  { userId_type: { userId, type: 'hot-buttons-briefing' } },
      select: { content: true },
    }),
  ])

  const lines: string[] = []

  if (articles.length > 0) {
    const candidateArticles = articles.filter(a => a.bucket === 'CandidateCoverage')
    const hotButtonArticles  = articles.filter(a => a.bucket === 'HotButtons')

    if (candidateArticles.length > 0) {
      lines.push('CANDIDATE COVERAGE SUMMARIES (use these to extract actual positions and stances):')
      for (const a of candidateArticles.slice(0, 10)) {
        const text = a.summary?.trim() || a.title
        lines.push(`- ${text}`)
      }
    }

    if (hotButtonArticles.length > 0) {
      lines.push('\nHOT BUTTON ISSUE COVERAGE (candidate\'s known positions on local issues):')
      for (const a of hotButtonArticles.slice(0, 8)) {
        const text = a.summary?.trim() || a.title
        lines.push(`- ${text}`)
      }
    }
  }

  if (hotButtons?.content) {
    // Extract just the TOP ISSUES section from the briefing (first 800 chars is enough for context)
    const snippet = hotButtons.content.slice(0, 800).replace(/\n{3,}/g, '\n\n')
    lines.push('\nHOT BUTTON ISSUES BRIEFING (candidate\'s issue priorities from latest analysis):')
    lines.push(snippet)
  }

  if (lines.length === 0) return ''

  return `\nCANDIDATE STANCE CONTEXT — The following is extracted from actual news coverage and issue analysis. Every piece of copy you generate MUST reflect these specific positions and priorities rather than generic party talking points. Ground messaging in these real stances:\n${lines.join('\n')}\n`
}

/**
 * Label for the geographic scope — used in constituent and hot-buttons prompts.
 */
export function geoScope(c: Pick<CandidateGeo, 'raceLevel' | 'district' | 'county' | 'city' | 'state'>): string {
  const level = (c.raceLevel ?? '').toLowerCase()
  if (level === 'federal'   && c.district) return `${c.state} CD-${c.district}`
  if (level === 'state'     && c.district) return `${c.state} District ${c.district}`
  if (level === 'county'    && c.county)   return `${c.county} County, ${c.state}`
  if (level === 'municipal' && c.city)     return `${c.city}, ${c.state}`
  return c.state
}
