export const dynamic = 'force-dynamic'

import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import PressContacts from '@/components/PressContacts'

export default async function PressPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  return <PressContacts />
}
