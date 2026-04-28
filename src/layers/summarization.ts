import { ask } from '@/lib/claude'
import { SUMMARIZE_SYSTEM, DIGEST_SYSTEM } from '@/lib/prompts'

export async function summarizeArticle(
  title: string,
  rawText: string,
  outlet: string,
  date: string,
): Promise<string> {
  const userMessage = `Outlet: ${outlet}\nDate: ${date}\nTitle: ${title}\n\n${rawText.slice(0, 6000)}`
  return ask(SUMMARIZE_SYSTEM, userMessage)
}

export async function generateBinDigest(summaries: string[], binName: string): Promise<string> {
  const userMessage = `BIN: ${binName}\n\nARTICLE SUMMARIES:\n${summaries.map((s, i) => `[${i + 1}] ${s}`).join('\n\n')}`
  return ask(DIGEST_SYSTEM, userMessage)
}
