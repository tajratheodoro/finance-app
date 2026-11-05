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
import { listAccounts } from '@/features/accounts/queries'
import { BalanceHero } from '@/features/dashboard/components/balance-hero'
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

  const [recent, totalBalanceCents, accounts, summary, expenses, monthly] =
    await Promise.all([
      getRecentTransactions(5),
      getTotalBalance(),
      listAccounts(),
      getPeriodSummary(period),
      getExpensesByCategory(period),
      getMonthlySeries(period),
    ])

  if (recent.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold">Painel</h1>
        <Card className="max-w-xl rounded-3xl">
          <CardHeader>
            <CardTitle>Nenhuma transação ainda</CardTitle>
            <CardDescription>
              Adicione a primeira transação para ver os totais e os gráficos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="h-11 rounded-full px-5"
              nativeButton={false}
              render={<Link href="/transactions" />}
            >
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
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">Painel</h1>

      <BalanceHero totalBalanceCents={totalBalanceCents} accounts={accounts} />

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Período</h2>
          <PeriodPicker key={pickerValue} value={pickerValue} />
        </div>
        <SummaryCards
          incomeCents={summary.incomeCents}
          expenseCents={summary.expenseCents}
          balanceCents={summary.balanceCents}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-3xl">
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

        <Card className="rounded-3xl">
          <CardHeader>
            <CardTitle>Receitas e despesas, últimos 6 meses</CardTitle>
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
