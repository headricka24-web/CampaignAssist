import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'

// ── GET — list all transactions for this candidate ──────────────────────────
export async function GET() {
  const session = await auth()
  const userId  = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const candidate = await prisma.candidate.findFirst({
    where:  { userId },
    select: { id: true },
  })
  const cid = candidate?.id ?? ''

  const transactions = await prisma.budgetTransaction.findMany({
    where:   { candidateId: cid },
    orderBy: { txDate: 'desc' },
  })

  // summary totals
  const income  = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  return NextResponse.json({ transactions, income, expense, balance: income - expense })
}

// ── POST — create a transaction ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await auth()
  const userId  = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const candidate = await prisma.candidate.findFirst({
    where:  { userId },
    select: { id: true },
  })
  const cid = candidate?.id ?? ''

  const body = await req.json() as {
    type: string
    category: string
    amount: number
    vendor?: string
    description?: string
    txDate?: string
    paymentMethod?: string
    notes?: string
  }

  const tx = await prisma.budgetTransaction.create({
    data: {
      candidateId:   cid || null,
      type:          body.type,
      category:      body.category,
      amount:        body.amount,
      vendor:        body.vendor        ?? null,
      description:   body.description   ?? null,
      txDate:        body.txDate ? new Date(body.txDate) : new Date(),
      paymentMethod: body.paymentMethod ?? null,
      notes:         body.notes         ?? null,
    },
  })

  return NextResponse.json(tx, { status: 201 })
}

// ── DELETE — remove a transaction ───────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const session = await auth()
  const userId  = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { id } = await req.json() as { id: string }

  // verify ownership via candidateId
  const candidate = await prisma.candidate.findFirst({
    where:  { userId },
    select: { id: true },
  })
  const cid = candidate?.id ?? ''

  const tx = await prisma.budgetTransaction.findUnique({ where: { id } })
  if (!tx || tx.candidateId !== cid) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }

  await prisma.budgetTransaction.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
