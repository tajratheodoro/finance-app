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

type RecentTransaction = Awaited<
  ReturnType<typeof getRecentTransactions>
>[number]

export function RecentTransactions({
  transactions,
}: {
  transactions: RecentTransaction[]
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Últimas transações</CardTitle>
        <CardAction>
          <Button
            variant="ghost"
            size="sm"
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
                  <span>{transaction.category.name}</span>
                  <time dateTime={transaction.date.toISOString()}>
                    {transaction.date.toLocaleDateString('pt-BR', {
                      timeZone: 'UTC',
                    })}
                  </time>
                </div>
              </div>
              <p className="shrink-0 font-medium tabular-nums">
                {transaction.type === 'INCOME' ? '+' : '-'}
                {formatBrl(transaction.amountCents)}
              </p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
