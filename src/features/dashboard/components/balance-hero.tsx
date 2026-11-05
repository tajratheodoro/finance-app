import Link from 'next/link'
import type { AccountWithBalance } from '@/features/accounts/queries'
import { formatBrl } from '@/lib/money'
import { cn } from '@/lib/utils'
import { CountUp } from './count-up'

const STACK_LIMIT = 3

const TYPE_LABELS: Record<AccountWithBalance['type'], string> = {
  CHECKING: 'Conta corrente',
  WALLET: 'Carteira',
  SAVINGS: 'Poupança',
}

export function BalanceHero({
  totalBalanceCents,
  accounts,
}: {
  totalBalanceCents: number
  accounts: AccountWithBalance[]
}) {
  const stacked = accounts.slice(0, STACK_LIMIT)
  const hidden = accounts.length - stacked.length

  return (
    <section
      aria-label="Saldo total"
      className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]"
    >
      <div className="flex min-h-48 flex-col justify-between gap-8 rounded-3xl bg-primary p-6 text-primary-foreground sm:p-8 dark:bg-card dark:text-card-foreground">
        <p className="text-sm opacity-80">Saldo total</p>
        <div>
          <p
            className={cn(
              'text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl',
              totalBalanceCents < 0 && 'text-destructive',
            )}
          >
            <CountUp cents={totalBalanceCents} />
          </p>
          <p className="mt-2 text-sm opacity-80">
            Somando {accounts.length}{' '}
            {accounts.length === 1 ? 'conta' : 'contas'}
          </p>
        </div>
      </div>

      {/* ponytail: plain palette blocks; swap for AccountCard from features/accounts once it exists. */}
      <div className="flex flex-col">
        {stacked.map((account, index) => (
          <Link
            key={account.id}
            href="/accounts"
            className={cn(
              'relative flex h-28 flex-col justify-between rounded-3xl bg-secondary p-5 text-secondary-foreground ring-4 ring-background focus-visible:ring-ring focus-visible:outline-none',
              index > 0 && '-mt-14',
            )}
          >
            <div className="flex items-baseline justify-between gap-4">
              <span className="truncate font-medium">{account.name}</span>
              <span
                className={cn(
                  'shrink-0 font-semibold tabular-nums',
                  account.balanceCents < 0 && 'text-destructive',
                )}
              >
                {formatBrl(account.balanceCents)}
              </span>
            </div>
            <span className="text-sm opacity-75">
              {TYPE_LABELS[account.type]}
            </span>
          </Link>
        ))}
        {hidden > 0 ? (
          <Link
            href="/accounts"
            className="mt-3 inline-flex min-h-11 items-center self-start rounded-full px-3 text-sm text-muted-foreground underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            Mais {hidden} {hidden === 1 ? 'conta' : 'contas'}
          </Link>
        ) : null}
      </div>
    </section>
  )
}
