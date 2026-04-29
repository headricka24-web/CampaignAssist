import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ask } from '@/lib/claude'

export const maxDuration = 60

export async function GET() {
  const candidate = await prisma.candidate.findFirst()
  const name  = candidate?.name  ?? 'the candidate'
  const state = candidate?.state ?? 'the state'
  const race  = candidate?.race  ?? 'this race'

  const profile = await ask(
    `You are a political data analyst and demographer with deep knowledge of US state-level census data, voting patterns, and electoral demographics. Be specific with real data. Use actual statistics from the most recent census and election data you have.`,
    `Generate a comprehensive constituent profile for a Republican candidate running for ${race} in ${state}.

Structure your response with these exact sections:

## STATE OVERVIEW
Population, median household income, urban/rural split, top industries/employers. Use specific numbers.

## DEMOGRAPHIC BREAKDOWN
Key demographic groups with estimated percentages: White, Hispanic/Latino, Black, Asian, Other. Age distribution: Under 35, 35-54, 55+. Education: College degree vs. no degree.

## VOTING PATTERNS
Last 3 election cycles for this race type in ${state} — who won, by how much. Is this a red/blue/purple state? Recent trends.

## KEY VOTER BLOCS FOR REPUBLICANS
The 4-5 groups that are the strongest base for a Republican candidate in ${state}. For each: estimated size, why they lean Republican, what issues they care most about.

## SWING VOTERS TO TARGET
The 3-4 groups that are persuadable in ${state}. For each: who they are, what moves them, what message would win them over for a Republican.

## MARKETING FOCUS RECOMMENDATION
Based on this data, where should ${name}'s campaign concentrate its outreach? Which geography (urban/suburban/rural), which demographics, and which 3 issues resonate most with winnable voters in ${state}.`,
    2000,
  )

  return NextResponse.json({ profile, state, name, race })
}
