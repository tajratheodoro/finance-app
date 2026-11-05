import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { getRecentTransactions } from '@/features/dashboard/queries'
import { formatBrl } from '@/lib/money'
import { cn } from '@/lib/utils'

type RecentTransaction = Awaited<
  ReturnType<typeof getRecentTransactions>
>[number]

export function RecentTransactions({
  transactions,
}: {
  transactions: RecentTransaction[]
}) {
  return (
    <Card className="rounded-3xl">
      <CardHeader>
        <CardTitle>Últimas transações</CardTitle>
        <CardAction>
          <Button
            variant="ghost"
            className="h-11 rounded-full px-4"
            nativeButton={false}
            render={<Link href="/transactions" />}
          >
            Ver todas
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ul className="divide-y">
          {transactions.map((transaction) => (
            <li
              key={transaction.id}
              className="flex items-center justify-between gap-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {transaction.description}
                </p>
                <div className="flex gap-2 text-sm text-muted-foreground">
                  <span className="truncate">{transaction.category.name}</span>
                  <time dateTime={transaction.date.toISOString()}>
                    {transaction.date.toLocaleDateString('pt-BR', {
                      timeZone: 'UTC',
                      day: '2-digit',
                      month: 'short',
                    })}
                  </time>
                </div>
              </div>
              <p
                className={cn(
                  'shrink-0 font-semibold tabular-nums',
                  transaction.type === 'INCOME'
                    ? 'text-income'
                    : 'text-foreground',
                )}
              >
                {transaction.type === 'INCOME' ? '+' : '−'}
                {formatBrl(transaction.amountCents)}
              </p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
