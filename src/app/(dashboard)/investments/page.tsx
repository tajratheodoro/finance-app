import { Suspense } from 'react'
import { connection } from 'next/server'
import { AllocationChart } from '@/features/investments/components/allocation-chart'
import { DeleteInvestmentButton } from '@/features/investments/components/delete-investment-button'
import { InvestmentFormDialog } from '@/features/investments/components/investment-form'
import {
  getInvestmentSummary,
  listInvestments,
} from '@/features/investments/queries'
import { kindLabels } from '@/features/investments/schemas'
import { returnPercent } from '@/features/investments/summary'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatBrl } from '@/lib/money'

function formatPercent(value: number): string {
  const text = value.toFixed(2).replace('.', ',')
  return `${value > 0 ? '+' : ''}${text}%`
}

function returnTone(value: number): string {
  if (value > 0) return 'text-income'
  if (value < 0) return 'text-expense'
  return 'text-muted-foreground'
}

export default function InvestmentsPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Investimentos</h1>
        <InvestmentFormDialog />
      </div>

      <Suspense
        fallback={
          <p className="text-sm text-muted-foreground">
            Carregando investimentos…
          </p>
        }
      >
        <InvestmentsContent />
      </Suspense>
    </div>
  )
}

async function InvestmentsContent() {
  await connection()
  const [investments, summary] = await Promise.all([
    listInvestments(),
    getInvestmentSummary(),
  ])

  if (investments.length === 0) {
    return (
      <div className="flex flex-col items-start gap-4 rounded-3xl bg-card p-6">
        <p className="text-muted-foreground">
          Nenhum investimento cadastrado. Registre o primeiro para ver o total e
          a distribuição.
        </p>
        <InvestmentFormDialog />
      </div>
    )
  }

  const gain = summary.currentValueCents - summary.investedCents

  return (
    <div className="flex flex-col gap-8 motion-safe:animate-in motion-safe:duration-[240ms] motion-safe:ease-out motion-safe:fade-in motion-safe:slide-in-from-bottom-2">
      <section
        aria-label="Resumo da carteira"
        className="grid gap-4 rounded-3xl bg-card p-6 sm:grid-cols-[minmax(0,1.4fr)_repeat(2,minmax(0,1fr))] sm:items-end"
      >
        <div>
          <p className="text-sm text-muted-foreground">Valor atual</p>
          <p className="text-4xl font-semibold tabular-nums">
            {formatBrl(summary.currentValueCents)}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Total investido</p>
          <p className="text-xl font-semibold tabular-nums">
            {formatBrl(summary.investedCents)}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Rentabilidade</p>
          <p
            className={`text-xl font-semibold tabular-nums ${returnTone(summary.returnPercent)}`}
          >
            {formatPercent(summary.returnPercent)}
            <span className="ml-2 text-sm font-medium">
              {gain > 0 ? '+' : ''}
              {formatBrl(gain)}
            </span>
          </p>
        </div>
      </section>

      <section
        aria-labelledby="allocation-title"
        className="flex flex-col gap-4 rounded-3xl bg-card p-6"
      >
        <h2 id="allocation-title" className="text-sm text-muted-foreground">
          Distribuição por tipo
        </h2>
        <AllocationChart
          data={summary.allocation.map((a) => ({
            ...a,
            label: kindLabels[a.kind],
          }))}
        />
      </section>

      <Table aria-label="Investimentos cadastrados">
        <TableHeader className="hidden sm:table-header-group">
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Instituição</TableHead>
            <TableHead className="text-right">Investido</TableHead>
            <TableHead className="text-right">Valor atual</TableHead>
            <TableHead className="text-right">Retorno</TableHead>
            <TableHead>
              <span className="sr-only">Ações</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {investments.map((i) => {
            const pct = returnPercent(i.investedCents, i.currentValueCents)
            return (
              <TableRow
                key={i.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1 rounded-3xl bg-card p-4 sm:table-row sm:rounded-none sm:bg-transparent sm:p-0"
              >
                <TableCell className="min-w-0 truncate p-0 font-medium sm:p-2">
                  {i.name}
                </TableCell>
                <TableCell className="col-start-1 row-start-2 p-0 text-muted-foreground sm:p-2">
                  {kindLabels[i.kind]}
                  {i.institution ? (
                    <span className="sm:hidden"> · {i.institution}</span>
                  ) : null}
                </TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">
                  {i.institution ?? '—'}
                </TableCell>
                <TableCell className="col-start-1 row-start-3 p-0 text-muted-foreground tabular-nums sm:p-2 sm:text-right">
                  <span className="sm:hidden">Investido </span>
                  {formatBrl(i.investedCents)}
                </TableCell>
                <TableCell className="col-start-2 row-start-1 p-0 text-right font-semibold tabular-nums sm:p-2">
                  {formatBrl(i.currentValueCents)}
                </TableCell>
                <TableCell
                  className={`col-start-2 row-start-2 p-0 text-right font-medium tabular-nums sm:p-2 ${returnTone(pct)}`}
                >
                  {formatPercent(pct)}
                </TableCell>
                <TableCell className="col-span-2 p-0 pt-2 sm:p-2">
                  <div className="flex justify-end gap-2">
                    <InvestmentFormDialog investment={i} />
                    <DeleteInvestmentButton id={i.id} name={i.name} />
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
