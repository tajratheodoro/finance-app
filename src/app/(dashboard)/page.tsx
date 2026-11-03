import Link from 'next/link'
import { connection } from 'next/server'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ExpensesByCategoryChart } from '@/features/dashboard/components/expenses-by-category-chart'
import { MonthlyChart } from '@/features/dashboard/components/monthly-chart'
import { PeriodPicker } from '@/features/dashboard/components/period-picker'
import { RecentTransactions } from '@/features/dashboard/components/recent-transactions'
import { SummaryCards } from '@/features/dashboard/components/summary-cards'
import { parsePeriod } from '@/features/dashboard/period'
import {
  getExpensesByCategory,
  getMonthlySeries,
  getPeriodSummary,
  getRecentTransactions,
  getTotalBalance,
} from '@/features/dashboard/queries'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  await connection()
  const { month } = await searchParams
  const period = parsePeriod(month)

  const [recent, totalBalanceCents, summary, expenses, monthly] =
    await Promise.all([
      getRecentTransactions(5),
      getTotalBalance(),
      getPeriodSummary(period),
      getExpensesByCategory(period),
      getMonthlySeries(period),
    ])

  if (recent.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold">Painel</h1>
        <Card>
          <CardHeader>
            <CardTitle>Nenhuma transação ainda</CardTitle>
            <CardDescription>
              Adicione a primeira transação para ver os totais e os gráficos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button nativeButton={false} render={<Link href="/transactions" />}>
              Adicionar primeira transação
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const pickerValue = `${period.year}-${String(period.month).padStart(2, '0')}`
  const hasMonthlyData = monthly.some(
    (item) => item.incomeCents !== 0 || item.expenseCents !== 0,
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Painel</h1>
        <PeriodPicker key={pickerValue} value={pickerValue} />
      </div>

      <SummaryCards
        totalBalanceCents={totalBalanceCents}
        incomeCents={summary.incomeCents}
        expenseCents={summary.expenseCents}
        balanceCents={summary.balanceCents}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Despesas por categoria</CardTitle>
          </CardHeader>
          <CardContent>
            {expenses.length > 0 ? (
              <ExpensesByCategoryChart data={expenses} />
            ) : (
              <EmptyNote>Nenhuma despesa neste período.</EmptyNote>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Receitas x despesas nos últimos 6 meses</CardTitle>
          </CardHeader>
          <CardContent>
            {hasMonthlyData ? (
              <MonthlyChart data={monthly} />
            ) : (
              <EmptyNote>Nenhuma movimentação nos últimos 6 meses.</EmptyNote>
            )}
          </CardContent>
        </Card>
      </div>

      <RecentTransactions transactions={recent} />
    </div>
  )
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="py-8 text-center text-sm text-muted-foreground">{children}</p>
  )
}
