import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import Anthropic from '@anthropic-ai/sdk'
import * as XLSX from 'xlsx'

export const maxDuration = 60

const BUDGET_CATEGORIES = [
  'Donations', 'In-Kind', 'Loan', 'Refund',
  'Staff', 'Advertising', 'Events', 'Printing',
  'Travel', 'Consulting', 'Legal', 'Office', 'Polling', 'Other',
]

const SYSTEM = `You are a campaign finance data parser. Extract budget transactions from the provided data.

Return ONLY a valid JSON array. Each object must have:
- "date": ISO date string YYYY-MM-DD (today if unknown)
- "type": "income" or "expense" (infer from context — deposits/donations = income, payments/checks written = expense)
- "category": one of exactly: ${BUDGET_CATEGORIES.join(', ')}
- "amount": positive number
- "vendor": string or null (payee name, donor name, or source)
- "description": string or null (brief description of what it was for)
- "paymentMethod": "check" | "card" | "cash" | "transfer" | "in-kind" | null
- "notes": string or null

Rules:
- If a row has a negative amount, it is a debit/expense.
- If a row has a positive amount (or deposit column), it is income.
- Map payroll/salary to category "Staff".
- Map ad buys/Facebook/Google/mailers to "Advertising".
- If category is ambiguous, default to "Other".
- Skip rows that are clearly headers, totals, or summaries (not individual transactions).
- Return [] if no transactions found.
Return ONLY the JSON array — no markdown, no explanation.`

function rowsToText(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return 'No data rows found.'
  const headers = Object.keys(rows[0])
  const lines   = [headers.join(' | ')]
  for (const row of rows.slice(0, 200)) { // cap at 200 rows per call
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
    // ── PDF: send natively to Claude ──────────────────────────────────────
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
          { type: 'text', text: 'Extract all budget transactions from this document.' },
        ],
      }],
    })
    responseText = msg.content[0].type === 'text' ? msg.content[0].text : '[]'

  } else {
    // ── CSV / XLSX / TXT: parse with xlsx then send rows to Claude ─────────
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
        content: `Extract all budget transactions from these spreadsheet rows:\n\n${rowsToText(rows)}`,
      }],
    })
    responseText = msg.content[0].type === 'text' ? msg.content[0].text : '[]'
  }

  // Strip any accidental markdown fences
  const clean = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

  let transactions: unknown[]
  try {
    transactions = JSON.parse(clean)
    if (!Array.isArray(transactions)) transactions = []
  } catch {
    return NextResponse.json({ error: 'Could not parse response', raw: clean }, { status: 422 })
  }

  return NextResponse.json({ transactions, count: transactions.length })
}
