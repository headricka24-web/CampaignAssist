import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'

export const maxDuration = 30

// Minimal CSV parser — handles quoted fields with commas
function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  for (const line of lines) {
    if (!line.trim()) continue
    const cells: string[] = []
    let cur = '', inQ = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQ && line[i + 1] === '"') { cur += '"'; i++ }
        else inQ = !inQ
      } else if (ch === ',' && !inQ) {
        cells.push(cur.trim()); cur = ''
      } else {
        cur += ch
      }
    }
    cells.push(cur.trim())
    rows.push(cells)
  }
  return rows
}

// Map a header name to a canonical field key
function mapHeader(h: string): string {
  const s = h.toLowerCase().replace(/[^a-z]/g, '')
  if (['firstname','first'].includes(s))    return 'firstName'
  if (['lastname','last','surname'].includes(s)) return 'lastName'
  if (['fullname','name'].includes(s))      return 'fullName'
  if (['phone','phonenumber','mobile','cell'].includes(s)) return 'phone'
  if (['email','emailaddress'].includes(s)) return 'email'
  if (['address','streetaddress','addr'].includes(s)) return 'address'
  if (['city'].includes(s))                 return 'city'
  if (['state','st'].includes(s))           return 'state'
  if (['zip','zipcode','postal'].includes(s)) return 'zip'
  if (['party','partyaffiliation'].includes(s)) return 'party'
  if (['support','supportlevel','score'].includes(s)) return 'supportLevel'
  if (['notes','note','comments'].includes(s)) return 'notes'
  return ''
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const userId  = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { id } = await params
  const cid = await prisma.candidate.findFirst({ where: { userId }, select: { id: true } })
  if (!cid) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const list = await prisma.contactList.findFirst({ where: { id }, select: { candidateId: true } })
  if (!list || list.candidateId !== cid.id) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const { csv } = await req.json() as { csv: string }
  if (!csv?.trim()) return NextResponse.json({ error: 'csv required' }, { status: 400 })

  const rows = parseCSV(csv)
  if (rows.length < 2) return NextResponse.json({ error: 'CSV must have a header row and at least one data row' }, { status: 400 })

  const headers = rows[0].map(mapHeader)
  const contacts: {
    listId: string; firstName: string; lastName: string | null; phone: string | null
    email: string | null; address: string | null; city: string | null; state: string | null
    zip: string | null; party: string | null; supportLevel: string | null; notes: string | null
    sortOrder: number
  }[] = []

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    const get = (key: string) => {
      const idx = headers.indexOf(key)
      return idx >= 0 && row[idx] ? row[idx] : null
    }
    const fullName = get('fullName')
    const firstName = get('firstName') ?? (fullName ? fullName.split(' ')[0] : null)
    const lastName  = get('lastName')  ?? (fullName ? fullName.split(' ').slice(1).join(' ') || null : null)
    if (!firstName) continue

    contacts.push({
      listId: id,
      firstName,
      lastName,
      phone:        get('phone'),
      email:        get('email'),
      address:      get('address'),
      city:         get('city'),
      state:        get('state'),
      zip:          get('zip'),
      party:        get('party'),
      supportLevel: get('supportLevel'),
      notes:        get('notes'),
      sortOrder:    i - 1,
    })
  }

  if (contacts.length === 0) return NextResponse.json({ error: 'No valid rows found' }, { status: 400 })

  await prisma.$transaction([
    prisma.listContact.createMany({ data: contacts }),
    prisma.contactList.update({ where: { id }, data: { totalCount: { increment: contacts.length } } }),
  ])

  return NextResponse.json({ imported: contacts.length })
}
