import Link from 'next/link'
import { connection } from 'next/server'
import { buttonVariants } from '@/components/ui/button'
import { listAccounts } from '@/features/accounts/queries'
import { listCategories } from '@/features/categories/queries'
import { TransactionFilters } from '@/features/transactions/components/transaction-filters'
import { TransactionFormDialog } from '@/features/transactions/components/transaction-form'
import { TransactionTable } from '@/features/transactions/components/transaction-table'
import { listTransactions } from '@/features/transactions/queries'
import { cn } from '@/lib/utils'

type SearchParams = Record<string, string | string[] | undefined>

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

// Accepts only real calendar days. "2026-02-31" is ignored.
function parseDay(value: string | undefined): Date | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined
  const date = new Date(`${value}T00:00:00Z`)
  return date.toISOString().slice(0, 10) === value ? date : undefined
}

// Keeps the current filters and changes only the page.
function pageHref(params: SearchParams, page: number): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    const single = first(value)
    if (key !== 'page' && single) search.set(key, single)
  }
  search.set('page', String(page))
  return `/transactions?${search}`
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  await connection()
  const params = await searchParams
  const type = first(params.type)
  const pageNumber = Number.parseInt(first(params.page) ?? '', 10)
  const page = Number.isFinite(pageNumber) && pageNumber > 0 ? pageNumber : 1

  const [{ items, total, pageSize }, accounts, categories] = await Promise.all([
    listTransactions({
      page,
      type: type === 'INCOME' || type === 'EXPENSE' ? type : undefined,
      accountId: first(params.accountId) || undefined,
      categoryId: first(params.categoryId) || undefined,
      from: parseDay(first(params.from)),
      to: parseDay(first(params.to)),
    }),
    listAccounts(),
    listCategories(),
  ])

  const lastPage = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Transações</h1>
          <p className="text-sm text-muted-foreground">
            {total} {total === 1 ? 'transação' : 'transações'}
          </p>
        </div>
        <TransactionFormDialog
          label="Nova transação"
          accounts={accounts}
          categories={categories}
        />
      </div>

      <TransactionFilters accounts={accounts} categories={categories} />

      <TransactionTable
        items={items}
        accounts={accounts}
        categories={categories}
      />

      {total > pageSize && (
        <nav
          aria-label="Paginação"
          className="flex flex-wrap items-center justify-between gap-4"
        >
          <span className="text-sm text-muted-foreground">
            Página {page} de {lastPage}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={pageHref(params, page - 1)}
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'sm' }),
                )}
              >
                Anterior
              </Link>
            )}
            {page < lastPage && (
              <Link
                href={pageHref(params, page + 1)}
                className={cn(
                  buttonVariants({ variant: 'outline', size: 'sm' }),
                )}
              >
                Próxima
              </Link>
            )}
          </div>
        </nav>
      )}
    </div>
  )
}
