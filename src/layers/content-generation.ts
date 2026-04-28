import { ask } from '@/lib/claude'
import {
  DAILY_DIGEST_SYSTEM,
  ISSUE_BRIEF_SYSTEM,
  NEWSLETTER_SYSTEM,
  SOCIAL_COPY_SYSTEM,
} from '@/lib/prompts'

export async function generateDailyDigest(digest: string, date: string): Promise<string> {
  return ask(DAILY_DIGEST_SYSTEM, `Date: ${date}\n\nBIN DIGEST:\n${digest}`)
}

export async function generateIssueBrief(topic: string, summaries: string[]): Promise<string> {
  const joined = summaries.map((s, i) => `[${i + 1}] ${s}`).join('\n\n')
  return ask(ISSUE_BRIEF_SYSTEM, `Topic: ${topic}\n\nSOURCE SUMMARIES:\n${joined}`)
}

export async function generateNewsletter(digest: string, candidateName: string): Promise<string> {
  return ask(NEWSLETTER_SYSTEM, `Candidate: ${candidateName}\n\nDIGEST:\n${digest}`)
}

export async function generateSocialCopy(
  summary: string,
): Promise<{ twitter: string; facebook: string; instagram: string }> {
  const raw = await ask(SOCIAL_COPY_SYSTEM, summary)
  try {
    return JSON.parse(raw)
  } catch {
    return { twitter: '', facebook: '', instagram: '' }
  }
}
