import { ask } from '@/lib/claude'
import { CLASSIFY_SYSTEM } from '@/lib/prompts'
import type { ClassificationResult } from '@/lib/types'

export async function classifyArticle(
  title: string,
  rawText: string,
  candidateName: string,
  opponentName?: string,
): Promise<ClassificationResult> {
  const context = [
    `Candidate: ${candidateName}`,
    opponentName ? `Opponent: ${opponentName}` : null,
  ]
    .filter(Boolean)
    .join('\n')

  const userMessage = `${context}\n\nARTICLE TITLE: ${title}\n\nARTICLE TEXT:\n${rawText.slice(0, 4000)}`
  const raw = await ask(CLASSIFY_SYSTEM, userMessage)

  try {
    return JSON.parse(raw) as ClassificationResult
  } catch {
    return { bucket: 'GeneralRace', topics: [], sentiment: 'Neutral', confidence: 0.5 }
  }
}
