import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import Anthropic from '@anthropic-ai/sdk'
import * as XLSX from 'xlsx'

export const maxDuration = 60

const SYSTEM = `You are a press and media contacts data parser for a political campaign.

Return ONLY a valid JSON array. Each object must have:
- "name": full name string (required — skip row if missing)
- "outlet": publication, station, or organization (required — use "Unknown" if missing)
- "role": one of Reporter | Editor | Producer | Anchor | Columnist | Blogger | Other | null
- "beat": coverage area, e.g. Politics | Local Government | Business | Education | Crime | Health | Agriculture | Veterans | General | null
- "email": email address string or null
- "phone": phone number string or null
- "twitter": Twitter/X handle (include @) or null
- "notes": any additional info, notes, or context about this contact or null
- "relationship": one of cold | warm | ally | hostile (default "cold" if unknown)

Rules:
- Skip clearly invalid rows (all empty, header rows, separator rows).
- Normalize phone numbers: keep as-is from the source.
- If a column seems like notes/comments, put it in "notes".
- Return [] if no contacts found.
Return ONLY the JSON array — no markdown, no explanation.`

function rowsToText(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return 'No data rows found.'
  const headers = Object.keys(rows[0])
  const lines   = [headers.join(' | ')]
  for (const row of rows.slice(0, 300)) {
    lines.push(headers.map(h => String(row[h] ?? '')).join(' | '))
  }
  return lines.join('\n')
}

export async function POST(req: NextRequest) {
  const session = await auth()
  const userId  = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file     = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const name = file.name.toLowerCase()
  const mime = file.type.toLowerCase()

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  let responseText: string

  if (mime === 'application/pdf' || name.endsWith('.pdf')) {
    const buffer = Buffer.from(await file.arrayBuffer())
    const b64    = buffer.toString('base64')

    const msg = await client.messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: 4096,
      system:     SYSTEM,
      messages: [{
        role:    'user',
        content: [
          {
            type:   'document',
            source: { type: 'base64', media_type: 'application/pdf', data: b64 },
          } as unknown as Anthropic.TextBlockParam,
          { type: 'text', text: 'Extract all press and media contacts from this document.' },
        ],
      }],
    })
    responseText = msg.content[0].type === 'text' ? msg.content[0].text : '[]'

  } else {
    const buffer = Buffer.from(await file.arrayBuffer())
    let rows: Record<string, unknown>[] = []

    if (name.endsWith('.txt') || mime === 'text/plain') {
      const text = buffer.toString('utf-8')
      rows = XLSX.utils.sheet_to_json(
        XLSX.read(text, { type: 'string' }).Sheets[
          XLSX.read(text, { type: 'string' }).SheetNames[0]
        ]
      ) as Record<string, unknown>[]
    } else {
      const wb    = XLSX.read(buffer, { type: 'buffer', cellDates: true })
      const sheet = wb.Sheets[wb.SheetNames[0]]
      rows        = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[]
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: 'No data rows found in file.' }, { status: 400 })
    }

    const msg = await client.messages.create({
      model:      'claude-sonnet-4-6',
      max_tokens: 4096,
      system:     SYSTEM,
      messages: [{
        role:    'user',
        content: `Extract all press and media contacts from these rows:\n\n${rowsToText(rows)}`,
      }],
    })
    responseText = msg.content[0].type === 'text' ? msg.content[0].text : '[]'
  }

  const clean = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

  let contacts: unknown[]
  try {
    contacts = JSON.parse(clean)
    if (!Array.isArray(contacts)) contacts = []
  } catch {
    return NextResponse.json({ error: 'Could not parse response', raw: clean }, { status: 422 })
  }

  return NextResponse.json({ contacts, count: contacts.length })
}
