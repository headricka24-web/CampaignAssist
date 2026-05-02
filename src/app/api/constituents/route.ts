import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ask } from '@/lib/claude'

export const maxDuration = 60

// ── State lookup tables ───────────────────────────────────────────────────────

const STATE_FIPS: Record<string, string> = {
  AL:'01',AK:'02',AZ:'04',AR:'05',CA:'06',CO:'08',CT:'09',DE:'10',
  FL:'12',GA:'13',HI:'15',ID:'16',IL:'17',IN:'18',IA:'19',KS:'20',
  KY:'21',LA:'22',ME:'23',MD:'24',MA:'25',MI:'26',MN:'27',MS:'28',
  MO:'29',MT:'30',NE:'31',NV:'32',NH:'33',NJ:'34',NM:'35',NY:'36',
  NC:'37',ND:'38',OH:'39',OK:'40',OR:'41',PA:'42',RI:'44',SC:'45',
  SD:'46',TN:'47',TX:'48',UT:'49',VT:'50',VA:'51',WA:'53',WV:'54',
  WI:'55',WY:'56',DC:'11',
}

const STATE_NAME_TO_ABBR: Record<string, string> = {
  'alabama':'AL','alaska':'AK','arizona':'AZ','arkansas':'AR','california':'CA',
  'colorado':'CO','connecticut':'CT','delaware':'DE','florida':'FL','georgia':'GA',
  'hawaii':'HI','idaho':'ID','illinois':'IL','indiana':'IN','iowa':'IA',
  'kansas':'KS','kentucky':'KY','louisiana':'LA','maine':'ME','maryland':'MD',
  'massachusetts':'MA','michigan':'MI','minnesota':'MN','mississippi':'MS',
  'missouri':'MO','montana':'MT','nebraska':'NE','nevada':'NV',
  'new hampshire':'NH','new jersey':'NJ','new mexico':'NM','new york':'NY',
  'north carolina':'NC','north dakota':'ND','ohio':'OH','oklahoma':'OK',
  'oregon':'OR','pennsylvania':'PA','rhode island':'RI','south carolina':'SC',
  'south dakota':'SD','tennessee':'TN','texas':'TX','utah':'UT','vermont':'VT',
  'virginia':'VA','washington':'WA','west virginia':'WV','wisconsin':'WI',
  'wyoming':'WY','district of columbia':'DC',
}

function getAbbr(state: string): string | null {
  const upper = state.trim().toUpperCase()
  if (STATE_FIPS[upper]) return upper
  return STATE_NAME_TO_ABBR[state.trim().toLowerCase()] ?? null
}

function getFips(state: string): string | null {
  const abbr = getAbbr(state)
  return abbr ? (STATE_FIPS[abbr] ?? null) : null
}

// ── ACS variable list ─────────────────────────────────────────────────────────

const ACS_VARS = [
  'B01003_001E',  // Total population
  'B01002_001E',  // Median age
  'B19013_001E',  // Median household income
  'B02001_002E',  // White alone
  'B02001_003E',  // Black/AA alone
  'B02001_005E',  // Asian alone
  'B03003_003E',  // Hispanic/Latino
  'B15003_001E',  // Pop 25+ (education denominator)
  'B15003_022E',  // Bachelor's
  'B15003_023E',  // Master's
  'B15003_024E',  // Professional degree
  'B15003_025E',  // Doctorate
  'B17001_001E',  // Poverty universe
  'B17001_002E',  // Below poverty level
  'B25003_001E',  // Total occupied housing units
  'B25003_002E',  // Owner-occupied
  'B21001_001E',  // Veterans universe (civilian 18+)
  'B21001_002E',  // Veterans
  'B05002_001E',  // Nativity universe
  'B05002_013E',  // Foreign born
  'B23025_002E',  // In labor force
  'B23025_005E',  // Unemployed
].join(',')

// ── 1. Census ACS ─────────────────────────────────────────────────────────────

type CensusData = {
  population:       number
  medianIncome:     number
  medianAge:        number
  pctWhite:         number
  pctBlack:         number
  pctHispanic:      number
  pctAsian:         number
  pctOther:         number
  pctBachelors:     number
  pctPoverty:       number
  pctOwnerOccupied: number
  pctVeterans:      number
  pctForeignBorn:   number
  pctUnemployed:    number
  source:           string
  geoLabel:         string
}

type GeoParams = {
  raceLevel: string | null
  district:  string | null
  county:    string | null
  city:      string | null
  stateFips: string
  apiKey:    string
}

// Look up FIPS code for a county by fuzzy-matching the county name
async function lookupCountyFips(stateFips: string, countyName: string, apiKey: string): Promise<string | null> {
  try {
    const url = `https://api.census.gov/data/2022/acs/acs5?get=NAME&for=county:*&in=state:${stateFips}&key=${apiKey}`
    const res = await fetch(url, { next: { revalidate: 86400 } })
    if (!res.ok) return null
    const json: string[][] = await res.json()
    // Each row: [NAME, state, county] — NAME looks like "Hillsborough County, New Hampshire"
    const target = countyName.toLowerCase().replace(/\s+county$/i, '').trim()
    const match = json.slice(1).find(row => row[0].toLowerCase().includes(target))
    return match ? match[2] : null  // county FIPS is 3-digit code in column index 2
  } catch { return null }
}

// Look up FIPS code for a place (city/municipality) by fuzzy-matching
async function lookupPlaceFips(stateFips: string, cityName: string, apiKey: string): Promise<string | null> {
  try {
    const url = `https://api.census.gov/data/2022/acs/acs5?get=NAME&for=place:*&in=state:${stateFips}&key=${apiKey}`
    const res = await fetch(url, { next: { revalidate: 86400 } })
    if (!res.ok) return null
    const json: string[][] = await res.json()
    const target = cityName.toLowerCase().trim()
    // Match by city name — NAME looks like "Manchester city, New Hampshire"
    const match = json.slice(1).find(row => row[0].toLowerCase().startsWith(target))
    return match ? match[2] : null  // place FIPS in column index 2
  } catch { return null }
}

// Build ACS 5-year URL for sub-state geographies
async function buildSubStateUrl(base: string, geo: GeoParams): Promise<{ url: string; geoLabel: string } | null> {
  const { raceLevel, district, county, city, stateFips, apiKey } = geo

  if (raceLevel === 'federal' && district) {
    const distNum = district.trim().padStart(2, '0')
    return {
      url: `${base}&for=congressional+district:${distNum}&in=state:${stateFips}&key=${apiKey}`,
      geoLabel: `Congressional District ${district}`,
    }
  }

  if (raceLevel === 'state' && district) {
    const distNum = district.trim().padStart(2, '0')
    // Try upper chamber first, then lower chamber
    return {
      url: `${base}&for=state+legislative+district+(upper+chamber):${distNum}&in=state:${stateFips}&key=${apiKey}`,
      geoLabel: `State Legislative District ${district}`,
    }
  }

  if (raceLevel === 'county' && county) {
    const countyFips = await lookupCountyFips(stateFips, county, apiKey)
    if (!countyFips) return null
    return {
      url: `${base}&for=county:${countyFips}&in=state:${stateFips}&key=${apiKey}`,
      geoLabel: county,
    }
  }

  if (raceLevel === 'municipal' && city) {
    const placeFips = await lookupPlaceFips(stateFips, city, apiKey)
    if (!placeFips) return null
    return {
      url: `${base}&for=place:${placeFips}&in=state:${stateFips}&key=${apiKey}`,
      geoLabel: city,
    }
  }

  return null
}

function parseACSRow(json: string[][]): CensusData | null {
  if (!json || json.length < 2) return null
  const [headers, row] = [json[0], json[1]]
  const n = (v: string) => Math.max(0, parseInt(row[headers.indexOf(v)]) || 0)

  const pop      = n('B01003_001E') || 1
  const white    = n('B02001_002E')
  const black    = n('B02001_003E')
  const asian    = n('B02001_005E')
  const hispanic = n('B03003_003E')
  const edPop    = n('B15003_001E') || 1
  const bachelors = n('B15003_022E') + n('B15003_023E') + n('B15003_024E') + n('B15003_025E')
  const povUniverse  = n('B17001_001E') || 1
  const housingTotal = n('B25003_001E') || 1
  const vetUniverse  = n('B21001_001E') || 1
  const natUniverse  = n('B05002_001E') || 1
  const laborForce   = n('B23025_002E') || 1

  return {
    population:       pop,
    medianIncome:     n('B19013_001E'),
    medianAge:        parseInt(row[headers.indexOf('B01002_001E')]) || 0,
    pctWhite:         Math.round((white    / pop)          * 1000) / 10,
    pctBlack:         Math.round((black    / pop)          * 1000) / 10,
    pctHispanic:      Math.round((hispanic / pop)          * 1000) / 10,
    pctAsian:         Math.round((asian    / pop)          * 1000) / 10,
    pctOther:         Math.round(((pop - white - black - asian) / pop) * 1000) / 10,
    pctBachelors:     Math.round((bachelors           / edPop)        * 1000) / 10,
    pctPoverty:       Math.round((n('B17001_002E')    / povUniverse)  * 1000) / 10,
    pctOwnerOccupied: Math.round((n('B25003_002E')    / housingTotal) * 1000) / 10,
    pctVeterans:      Math.round((n('B21001_002E')    / vetUniverse)  * 1000) / 10,
    pctForeignBorn:   Math.round((n('B05002_013E')    / natUniverse)  * 1000) / 10,
    pctUnemployed:    Math.round((n('B23025_005E')    / laborForce)   * 1000) / 10,
    source:           '',  // set by caller
    geoLabel:         '',  // set by caller
  }
}

async function fetchCensusData(
  stateFips: string,
  raceLevel: string | null,
  district:  string | null,
  county:    string | null,
  city:      string | null,
): Promise<CensusData | null> {
  const apiKey = process.env.CENSUS_API_KEY ?? 'DEMO_KEY'
  const base5  = `https://api.census.gov/data/2022/acs/acs5?get=NAME,${ACS_VARS}`
  const base1  = `https://api.census.gov/data/2023/acs/acs1?get=NAME,${ACS_VARS}`

  // Try sub-state geography first if candidate has targeting configured
  const subStateGeo = await buildSubStateUrl(base5, { raceLevel, district, county, city, stateFips, apiKey })

  // State-level fall-through URLs (1-year preferred, 5-year fallback)
  const stateUrls = [
    { url: `${base1}&for=state:${stateFips}&key=${apiKey}`, year: '2023 ACS 1-Year', geo: '' },
    { url: `${base5}&for=state:${stateFips}&key=${apiKey}`, year: '2022 ACS 5-Year', geo: '' },
  ]

  // If we have a sub-state URL, try it first (uses 5-year for reliability)
  const urlsToTry = subStateGeo
    ? [
        { url: subStateGeo.url, year: '2022 ACS 5-Year', geo: subStateGeo.geoLabel },
        // Also try lower chamber if upper failed (state races)
        ...(raceLevel === 'state' && district
          ? [{ url: `${base5}&for=state+legislative+district+(lower+chamber):${district.trim().padStart(2,'0')}&in=state:${stateFips}&key=${apiKey}`, year: '2022 ACS 5-Year', geo: `State Legislative District ${district}` }]
          : []),
        ...stateUrls,
      ]
    : stateUrls

  for (const { url, year, geo } of urlsToTry) {
    try {
      const res = await fetch(url, { next: { revalidate: 86400 } })
      if (!res.ok) continue
      const json: string[][] = await res.json()
      const data = parseACSRow(json)
      if (!data) continue
      data.source   = `U.S. Census Bureau, ${year} Estimates`
      data.geoLabel = geo
      return data
    } catch { continue }
  }
  return null
}

// ── 2. BLS — current unemployment ────────────────────────────────────────────

type BLSData = { rate: number; month: string; year: string; preliminary: boolean }

async function fetchBLSUnemployment(fips: string): Promise<BLSData | null> {
  const seriesId = `LASST${fips.padStart(2, '0')}0000000000003`
  const url = `https://api.bls.gov/publicAPI/v1/timeseries/data/${seriesId}`
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) return null
    const json = await res.json()
    const dataPoint = json?.Results?.series?.[0]?.data?.[0]
    if (!dataPoint) return null
    return {
      rate:        parseFloat(dataPoint.value),
      month:       dataPoint.periodName,
      year:        dataPoint.year,
      preliminary: dataPoint.footnotes?.some((f: { code?: string }) => f.code === 'P') ?? false,
    }
  } catch { return null }
}

// ── 3. FEC — recent election results ─────────────────────────────────────────

type FECCandidate = { name: string; party: string; votes: number; pct: number; won: boolean }
type FECData      = { cycle: number; office: string; candidates: FECCandidate[] }

function detectFECOffice(race: string): 'S' | 'H' | 'P' | null {
  const r = race.toLowerCase()
  if (r.includes('president')) return 'P'
  if ((r.includes('senate') || r.includes('senator')) && !r.includes('state senate') && !r.includes('state sen')) return 'S'
  if (r.includes('congress') || (r.includes('house') && !r.includes('state house')) || r.includes('representative')) return 'H'
  return null
}

async function fetchFECResults(stateAbbr: string, race: string, district: string | null): Promise<FECData | null> {
  const office = detectFECOffice(race)
  if (!office) return null

  const apiKey = process.env.FEC_API_KEY ?? 'DEMO_KEY'

  for (const cycle of [2024, 2022, 2020]) {
    try {
      const districtParam = (office === 'H' && district) ? `&district=${district.trim().padStart(2,'0')}` : ''
      const url = `https://api.fec.gov/v1/elections/?state=${stateAbbr}&cycle=${cycle}&office=${office}${districtParam}&sort=-votes&api_key=${apiKey}&per_page=10`
      const res = await fetch(url, { next: { revalidate: 86400 } })
      if (!res.ok) continue
      const json = await res.json()
      if (!json?.results?.length) continue

      const candidates: FECCandidate[] = json.results
        .filter((r: Record<string, unknown>) => r.candidate_name)
        .slice(0, 6)
        .map((r: Record<string, unknown>) => ({
          name:  String(r.candidate_name ?? ''),
          party: String(r.party_full ?? r.party ?? 'Unknown'),
          votes: Number(r.total_votes ?? 0),
          pct:   Math.round(Number(r.votes_pct ?? 0) * 10) / 10,
          won:   Boolean(r.won),
        }))

      if (candidates.length) return { cycle, office, candidates }
    } catch { continue }
  }
  return null
}

// ── Prompt assembly ───────────────────────────────────────────────────────────

function buildDataBlock(
  state:    string,
  geoLabel: string,
  census:   CensusData | null,
  bls:      BLSData    | null,
  fec:      FECData    | null,
): { block: string; sources: string[] } {
  const sections: string[] = []
  const sources: string[]  = []

  const geoTitle = geoLabel ? `${geoLabel.toUpperCase()}, ${state.toUpperCase()}` : state.toUpperCase()

  if (census) {
    sources.push(census.source)
    sections.push(`=== CENSUS BUREAU DEMOGRAPHICS — ${geoTitle} (${census.source}) ===
- Population: ${census.population.toLocaleString()}
- Median household income: $${census.medianIncome.toLocaleString()}
- Median age: ${census.medianAge}
- Race/ethnicity: White ${census.pctWhite}%, Hispanic/Latino ${census.pctHispanic}%, Black ${census.pctBlack}%, Asian ${census.pctAsian}%, Other/Multiracial ${census.pctOther}%
- Education (adults 25+): ${census.pctBachelors}% hold a bachelor's degree or higher
- Poverty rate: ${census.pctPoverty}%
- Homeownership rate: ${census.pctOwnerOccupied}%
- Veterans (share of civilian adults): ${census.pctVeterans}%
- Foreign-born residents: ${census.pctForeignBorn}%
- Census-measured unemployment: ${census.pctUnemployed}%`)
  }

  if (bls) {
    const label = `BLS LAUS, ${bls.month} ${bls.year}${bls.preliminary ? ' (preliminary)' : ''}`
    sources.push(label)
    sections.push(`=== BUREAU OF LABOR STATISTICS — CURRENT UNEMPLOYMENT (${label}) ===
- Unemployment rate: ${bls.rate}%`)
  }

  if (fec) {
    const officeLabel = fec.office === 'S' ? 'U.S. Senate' : fec.office === 'H' ? 'U.S. House' : 'Presidential'
    const label = `FEC, ${fec.cycle} ${officeLabel} results`
    sources.push(label)
    const rows = fec.candidates
      .map(c => `  ${c.won ? '✓ WINNER' : '         '} ${c.name} (${c.party}): ${c.pct}%${c.votes ? ` · ${c.votes.toLocaleString()} votes` : ''}`)
      .join('\n')
    sections.push(`=== FEC ELECTION RESULTS — ${fec.cycle} ${officeLabel.toUpperCase()} (${state.toUpperCase()}) ===\n${rows}`)
  }

  return {
    block:   sections.length ? `VERIFIED GOVERNMENT DATA FOR ${geoTitle}:\n\n${sections.join('\n\n')}` : '',
    sources,
  }
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET() {
  const candidate = await prisma.candidate.findFirst()
  const name      = candidate?.name      ?? 'the candidate'
  const state     = candidate?.state     ?? 'the state'
  const race      = candidate?.race      ?? 'this race'
  const party     = candidate?.party     ?? 'Republican'
  const raceLevel = candidate?.raceLevel ?? null
  const district  = candidate?.district  ?? null
  const county    = candidate?.county    ?? null
  const city      = candidate?.city      ?? null

  const fips      = getFips(state)
  const stateAbbr = getAbbr(state)

  const [censusResult, blsResult, fecResult] = await Promise.allSettled([
    fips      ? fetchCensusData(fips, raceLevel, district, county, city) : Promise.resolve(null),
    fips      ? fetchBLSUnemployment(fips)                               : Promise.resolve(null),
    stateAbbr ? fetchFECResults(stateAbbr, race, district)               : Promise.resolve(null),
  ])

  const census = censusResult.status === 'fulfilled' ? censusResult.value : null
  const bls    = blsResult.status    === 'fulfilled' ? blsResult.value    : null
  const fec    = fecResult.status    === 'fulfilled' ? fecResult.value    : null

  const geoLabel = census?.geoLabel ?? ''
  const { block: dataBlock, sources } = buildDataBlock(state, geoLabel, census, bls, fec)
  const hasRealData = sources.length > 0

  const geoContext = geoLabel
    ? `${geoLabel}, ${state}`
    : state

  const systemPrompt = hasRealData
    ? `You are a senior political strategist and demographer. You have been given verified, real data from U.S. government sources for ${geoContext}. Use these numbers as your factual foundation — do not contradict, round away, or ignore them. Your job is to interpret the data strategically and provide political context (voter blocs, persuasion targets, messaging strategy) that the raw data alone cannot reveal. Where the data is silent, draw on your knowledge but clearly distinguish analysis from fact.`
    : `You are a senior political strategist and demographer with deep knowledge of U.S. state-level demographics, voting patterns, and electoral history. Be specific with real data. Use actual statistics from the most recent census and election data you have.`

  const geographyDesc = geoLabel
    ? `${geoLabel} in ${state}`
    : state

  const userPrompt = `Generate a comprehensive constituent intelligence profile for a ${party} candidate running for ${race} in ${geographyDesc}.
${dataBlock ? `\n${dataBlock}\n` : ''}
Structure your response using these exact section headers:

## OVERVIEW
${hasRealData
  ? `Using the verified figures above, describe the ${geoLabel ? 'district/area' : 'state'}'s size, economic character, cost of living, and geographic/urban-rural breakdown. Add top industries and major employers not captured in the data.`
  : `Population, median income, cost of living, urban/rural split, top industries and employers. Use specific numbers.`
}

## DEMOGRAPHIC BREAKDOWN
${census
  ? `Use the exact Census Bureau percentages provided above for race/ethnicity, education, poverty, homeownership, veteran population, and foreign-born share. Add age distribution context (under 35 / 35–54 / 55+) based on the median age figure provided.`
  : `Race/ethnicity percentages, age distribution (under 35 / 35–54 / 55+), education (college vs. no degree), homeownership rate, veteran population.`
}

## ECONOMIC CONDITIONS
${bls
  ? `Use the BLS unemployment figure (${bls.rate}% as of ${bls.month} ${bls.year}) as your baseline. Describe the broader economic conditions, cost pressures, top employer sectors, and what economic issues voters feel most acutely in ${geographyDesc}.`
  : `Current unemployment, major industries, economic pressures, cost of living concerns, and what economic issues voters feel most acutely.`
}

## VOTING PATTERNS & RECENT ELECTION HISTORY
${fec
  ? `Use the FEC ${fec.cycle} results provided above as your factual anchor for the most recent federal race. Extend the analysis to cover the last 3 election cycles, overall partisan lean, and trajectory. Is this a red/blue/purple ${geoLabel ? 'district' : 'state'} and why?`
  : `Last 3 election cycles for this race type in ${geographyDesc} — who won, margins, trends. Is this a red/blue/purple ${geoLabel ? 'district' : 'state'} and why?`
}

## KEY VOTER BLOCS FOR ${party.toUpperCase()}S
The 4–5 groups that are the strongest base for a ${party} candidate in ${geographyDesc}. For each group: estimated share of electorate, geographic concentration within the ${geoLabel ? 'district' : 'state'}, top 2–3 issues they care about, and what message keeps them energized.

## SWING VOTERS TO TARGET
The 3–4 groups most persuadable in ${geographyDesc} right now. For each: who they are demographically, what they currently believe, and what specific message or issue would move them toward a ${party} candidate.

## CAMPAIGN STRATEGY RECOMMENDATION
Based on all of the above: where should ${name}'s campaign concentrate resources? Prioritize by geography (specific areas/precincts if known), demographic targets, and the 3 highest-leverage issues for this race. Be specific and direct.`

  const profile = await ask(systemPrompt, userPrompt, 3000)

  return NextResponse.json({ profile, state, name, race, sources })
}
