import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { formatBrl } from '@/lib/money'

type SummaryCardsProps = {
  totalBalanceCents: number
  incomeCents: number
  expenseCents: number
  balanceCents: number
}

export function SummaryCards({
  totalBalanceCents,
  incomeCents,
  expenseCents,
  balanceCents,
}: SummaryCardsProps) {
  const metrics = [
    { label: 'Saldo total', cents: totalBalanceCents },
    { label: 'Receitas do período', cents: incomeCents },
    { label: 'Despesas do período', cents: expenseCents },
    { label: 'Saldo do período', cents: balanceCents },
  ]

  return (
    <section
      aria-label="Resumo"
      className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
    >
      {metrics.map(({ label, cents }) => (
        <Card key={label} size="sm">
          <CardHeader>
            <CardDescription>{label}</CardDescription>
          </CardHeader>
          <CardContent>
            <p
              className={cn(
                'text-lg font-semibold tabular-nums sm:text-2xl',
                cents < 0 && 'text-destructive',
              )}
            >
              {formatBrl(cents)}
            </p>
          </CardContent>
        </Card>
      ))}
    </section>
  )
}
