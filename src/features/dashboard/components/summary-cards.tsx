import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { formatBrl } from '@/lib/money'
import { cn } from '@/lib/utils'

type SummaryCardsProps = {
  incomeCents: number
  expenseCents: number
  balanceCents: number
}

// The period balance leads; income and expenses sit beside it as its two parts.
export function SummaryCards({
  incomeCents,
  expenseCents,
  balanceCents,
}: SummaryCardsProps) {
  const spentShare =
    incomeCents > 0 ? Math.round((expenseCents / incomeCents) * 100) : null

  return (
    <section
      aria-label="Resumo do período"
      className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)]"
    >
      <Card className="col-span-2 rounded-3xl lg:col-span-1">
        <CardHeader>
          <p className="text-sm text-muted-foreground">Saldo do período</p>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          <p
            className={cn(
              'text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl',
              balanceCents < 0 && 'text-destructive',
            )}
          >
            {formatBrl(balanceCents)}
          </p>
          {spentShare !== null ? (
            <p className="text-sm text-muted-foreground">
              Despesas somam {spentShare}% das receitas
            </p>
          ) : null}
        </CardContent>
      </Card>
      <Part label="Receitas do período" cents={incomeCents} dot="bg-income" />
      <Part label="Despesas do período" cents={expenseCents} dot="bg-expense" />
    </section>
  )
}

function Part({
  label,
  cents,
  dot,
}: {
  label: string
  cents: number
  dot: string
}) {
  return (
    <Card size="sm" className="justify-between rounded-3xl bg-muted ring-0">
      <CardHeader>
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <span aria-hidden className={cn('size-2 rounded-full', dot)} />
          {label}
        </p>
      </CardHeader>
      <CardContent>
        <p className="text-lg font-semibold tabular-nums sm:text-2xl">
          {formatBrl(cents)}
        </p>
      </CardContent>
    </Card>
  )
}
