/**
 * Builds a race-level context string injected into every AI prompt.
 * Tailors tone, scope, dollar amounts, and geographic specificity
 * based on the candidate's race level (federal / state / county / municipal).
 */

type CandidateGeo = {
  name:        string
  race:        string
  state:       string
  incumbent:   boolean
  raceLevel:   string | null
  district:    string | null
  county:      string | null
  city:        string | null
}

export function buildRaceContext(c: CandidateGeo): string {
  const level = (c.raceLevel ?? '').toLowerCase()

  // ── Geography label ─────────────────────────────────────────────
  const geoLabel = (() => {
    if (level === 'federal' && c.district)  return `${c.state} Congressional District ${c.district}`
    if (level === 'state'   && c.district)  return `${c.state} District ${c.district}`
    if (level === 'county'  && c.county)    return `${c.county} County, ${c.state}`
    if (level === 'municipal' && c.city)    return `${c.city}, ${c.state}`
    return c.state
  })()

  // ── Status label ────────────────────────────────────────────────
  const status = c.incumbent ? 'incumbent Republican' : 'Republican challenger'

  // ── Base line ───────────────────────────────────────────────────
  const base = `CANDIDATE: ${c.name} (${status}), running for ${c.race} in ${geoLabel}.`

  // ── Race-level guidance ─────────────────────────────────────────
  const guidance = (() => {
    switch (level) {

      case 'federal':
        return `RACE LEVEL: U.S. federal race. This candidate competes in national media, attracts national donors, and must address both district-level constituent concerns and national Republican priorities. Content should reference national GOP agenda, federal policy (taxes, border, defense, economy), and use language appropriate for a congressional or Senate race. Fundraising asks should reflect federal-level ranges ($25–$2,900 for individuals; major donor tier $1,000+). Threats may include national media scrutiny and opposition from national Democratic organizations.`

      case 'state':
        return `RACE LEVEL: State-level race. This candidate operates in state media markets and addresses state legislative priorities — budget, education, infrastructure, state taxes, and state-specific policy. Content should be tailored to ${c.state} voters and the state Republican party platform. Fundraising asks are mid-range ($25–$1,000 typical; major donor $500–$2,500). Threats are primarily from state Democratic opposition and state/regional media.`

      case 'county':
        return `RACE LEVEL: County-level race. This is a local government race focused on county services — property taxes, law enforcement, zoning, roads, county budget, and local Republican values. Content must be hyper-local and speak to ${c.county ? c.county + ' County' : c.state} residents directly. Avoid national political language unless tying to a local impact. Fundraising asks are modest ($10–$500 typical). Threats are local — neighborhood issues, local newspaper coverage, opponent endorsements from local organizations.`

      case 'municipal':
        return `RACE LEVEL: Municipal/local race. This is a city, town, or special district race (mayor, city council, school board, etc.) focused on community-level issues — local schools, public safety, city budget, local taxes, zoning, and quality of life. Content must speak directly to ${c.city ? c.city : c.state} residents and their daily concerns. Keep messaging community-focused and avoid heavy national partisan framing unless directly relevant. Fundraising asks are very modest ($10–$250 typical). Threats are community-specific — local endorsements, neighborhood newspapers, social media groups, PTA networks.`

      default:
        return `RACE LEVEL: Campaign race. Tailor content to the candidate's specific race and constituency.`
    }
  })()

  return `${base}\n${guidance}`
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
