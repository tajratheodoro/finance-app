import type { AccountType } from '@/generated/prisma/client'
import { db } from '@/lib/db'

export type AccountWithBalance = {
  id: string
  name: string
  type: AccountType
  institution: string | null
  initialBalanceCents: number
  balanceCents: number
}

export async function listAccounts(): Promise<AccountWithBalance[]> {
  const [accounts, totals] = await Promise.all([
    db.account.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        type: true,
        institution: true,
        initialBalanceCents: true,
      },
    }),
    db.transaction.groupBy({
      by: ['accountId', 'type'],
      _sum: { amountCents: true },
    }),
  ])

  // Net movement per account: income adds, expense subtracts.
  const movement = new Map<string, number>()
  for (const total of totals) {
    const signed =
      (total._sum.amountCents ?? 0) * (total.type === 'INCOME' ? 1 : -1)
    movement.set(total.accountId, (movement.get(total.accountId) ?? 0) + signed)
  }

  return accounts.map((account) => ({
    id: account.id,
    name: account.name,
    type: account.type,
    institution: account.institution,
    initialBalanceCents: account.initialBalanceCents,
    balanceCents: account.initialBalanceCents + (movement.get(account.id) ?? 0),
  }))
}
