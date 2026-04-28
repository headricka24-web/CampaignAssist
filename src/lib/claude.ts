import Anthropic from '@anthropic-ai/sdk'

export const MODEL = 'claude-sonnet-4-6'

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey || apiKey === 'your_key_here' || !apiKey.startsWith('sk-')) {
    throw new Error(`ANTHROPIC_API_KEY is not set. Current value: "${apiKey?.slice(0, 8)}..."`)
  }
  return new Anthropic({ apiKey })
}

export async function ask(systemPrompt: string, userMessage: string, maxTokens = 1024): Promise<string> {
  const client = getClient()
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  })
  const block = message.content[0]
  if (block.type !== 'text') throw new Error('Unexpected response type from Claude')
  return block.text
}
