import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

function dayStart(d: Date) {
  const s = new Date(d); s.setHours(0, 0, 0, 0); return s
}
function weekStart(d: Date) {
  const s = new Date(d)
  s.setDate(s.getDate() - s.getDay())
  s.setHours(0, 0, 0, 0)
  return s
}
function monthStart(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

export async function GET() {
  const now        = new Date()
  const todayStart = dayStart(now)
  const wkStart    = weekStart(now)
  const moStart    = monthStart(now)
  const in3Days    = new Date(now.getTime() + 3 * 86_400_000)
  const in48h      = new Date(now.getTime() + 2 * 86_400_000)

  const [
    contactsToday,
    contactsThisWeek,
    raisedWeek,
    raisedMonth,
    followUpsDue,
    volunteerShifts,
    pendingDraftCount,
    pendingDrafts,
    upcomingEvents,
    shiftsIn48h,
  ] = await Promise.all([
    prisma.contact.count({ where: { contactedAt: { gte: todayStart } } }),
    prisma.contact.count({ where: { contactedAt: { gte: wkStart } } }),
    prisma.donor.aggregate({ where: { donatedAt: { gte: wkStart } }, _sum: { amount: true } }),
    prisma.donor.aggregate({ where: { donatedAt: { gte: moStart } }, _sum: { amount: true } }),
    prisma.donor.findMany({
      where: { followUpDue: { lte: in3Days }, status: { not: 'thanked' } },
      orderBy: { followUpDue: 'asc' },
      take: 8,
    }),
    prisma.volunteer.count({ where: { shiftDate: { gte: now }, status: { in: ['scheduled', 'confirmed'] } } }),
    prisma.contentDraft.count({ where: { status: 'pending' } }),
    prisma.contentDraft.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.campaignEvent.findMany({
      where: { eventDate: { gte: now }, status: 'upcoming' },
      orderBy: { eventDate: 'asc' },
      take: 6,
    }),
    prisma.volunteer.count({
      where: { shiftDate: { gte: now, lte: in48h }, status: 'scheduled' },
    }),
  ])

  // Compute next best actions
  const actions: { priority: 'high' | 'medium' | 'low'; text: string }[] = []

  const overdueFollowUps = followUpsDue.filter(d => d.followUpDue && d.followUpDue < now)
  if (overdueFollowUps.length > 0) {
    actions.push({ priority: 'high', text: `${overdueFollowUps.length} donor follow-up${overdueFollowUps.length > 1 ? 's' : ''} are overdue — call them today` })
  }

  if (contactsToday === 0) {
    actions.push({ priority: 'high', text: 'No voter contacts logged today — start your outreach push now' })
  } else if (contactsToday < 50) {
    actions.push({ priority: 'medium', text: `Only ${contactsToday} contacts today — push to hit your daily target` })
  }

  if (shiftsIn48h > 0) {
    actions.push({ priority: 'medium', text: `${shiftsIn48h} volunteer shift${shiftsIn48h > 1 ? 's' : ''} in the next 48 hours need confirmation` })
  }

  if (pendingDraftCount > 0) {
    actions.push({ priority: 'low', text: `${pendingDraftCount} content draft${pendingDraftCount > 1 ? 's' : ''} awaiting your approval` })
  }

  const nextEvent = upcomingEvents[0]
  if (nextEvent) {
    const daysUntil = Math.ceil((new Date(nextEvent.eventDate).getTime() - now.getTime()) / 86_400_000)
    if (daysUntil <= 7) {
      actions.push({
        priority: daysUntil <= 2 ? 'high' : 'medium',
        text: `"${nextEvent.title}" is in ${daysUntil} day${daysUntil === 1 ? '' : 's'} — confirm logistics`,
      })
    }
  }

  if (actions.length === 0) {
    actions.push({ priority: 'low', text: 'Campaign is on track — keep the momentum going' })
  }

  return NextResponse.json({
    contacts:       { today: contactsToday, thisWeek: contactsThisWeek },
    fundraising:    { thisWeek: raisedWeek._sum.amount ?? 0, thisMonth: raisedMonth._sum.amount ?? 0 },
    followUpsDue:   followUpsDue.map(d => ({
      id: d.id, name: d.name, amount: d.amount,
      followUpDue: d.followUpDue?.toISOString() ?? null,
      status: d.status, overdue: !!(d.followUpDue && d.followUpDue < now),
    })),
    volunteerShifts,
    pendingDraftCount,
    pendingDrafts:  pendingDrafts.map(d => ({
      id: d.id, title: d.title, type: d.type, platform: d.platform,
      createdAt: d.createdAt.toISOString(),
    })),
    upcomingEvents: upcomingEvents.map(e => ({
      id: e.id, title: e.title, type: e.type,
      eventDate: e.eventDate.toISOString(), location: e.location,
    })),
    actions,
  })
}
