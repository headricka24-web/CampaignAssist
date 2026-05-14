export const dynamic = 'force-dynamic'

import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import BudgetTracker from '@/components/BudgetTracker'

export default async function BudgetPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  return <BudgetTracker />
}
