'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { ItemSelect } from './transaction-form'

type Option = { id: string; name: string }
type Category = Option & { type: 'INCOME' | 'EXPENSE' }

const TYPE_ITEMS = [
  { value: '', label: 'Todos' },
  { value: 'INCOME', label: 'Receita' },
  { value: 'EXPENSE', label: 'Despesa' },
]

const FIELD = 'flex min-w-0 flex-col gap-1'
const LABEL = 'text-xs text-muted-foreground'

export function TransactionFilters({
  accounts,
  categories,
}: {
  accounts: Option[]
  categories: Category[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const type = searchParams.get('type') ?? ''
  const accountId = searchParams.get('accountId') ?? ''
  const categoryId = searchParams.get('categoryId') ?? ''
  const from = searchParams.get('from') ?? ''
  const to = searchParams.get('to') ?? ''
  const hasFilters = Boolean(type || accountId || categoryId || from || to)

  // Any filter change goes back to page 1. Empty values remove the param.
  function update(changes: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(changes)) {
      if (value) params.set(key, value)
      else params.delete(key)
    }
    params.delete('page')
    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  const accountItems = [
    { value: '', label: 'Todas as contas' },
    ...accounts.map(({ id, name }) => ({ value: id, label: name })),
  ]
  const categoryItems = [
    { value: '', label: 'Todas as categorias' },
    ...categories
      .filter((category) => !type || category.type === type)
      .map(({ id, name }) => ({ value: id, label: name })),
  ]

  return (
    <section
      aria-label="Filtros"
      className="flex flex-col gap-4 rounded-3xl bg-card p-4"
    >
      <div
        role="group"
        aria-label="Tipo"
        className="grid grid-cols-3 gap-1 rounded-full bg-secondary p-1 sm:w-fit"
      >
        {TYPE_ITEMS.map((item) => {
          const active = item.value === type
          return (
            <button
              key={item.value}
              type="button"
              aria-pressed={active}
              // A category of the other type would match nothing, so it is cleared.
              onClick={() => update({ type: item.value, categoryId: '' })}
              className={cn(
                'min-h-11 rounded-full px-5 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:min-h-9',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-secondary-foreground hover:bg-accent',
              )}
            >
              {item.label}
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className={FIELD}>
          <Label htmlFor="filter-account" className={LABEL}>
            Conta
          </Label>
          <ItemSelect
            id="filter-account"
            items={accountItems}
            value={accountId}
            onChange={(next) => update({ accountId: next })}
          />
        </div>

        <div className={FIELD}>
          <Label htmlFor="filter-category" className={LABEL}>
            Categoria
          </Label>
          <ItemSelect
            id="filter-category"
            items={categoryItems}
            value={categoryId}
            onChange={(next) => update({ categoryId: next })}
          />
        </div>

        <div className={FIELD}>
          <Label htmlFor="filter-from" className={LABEL}>
            De
          </Label>
          <Input
            id="filter-from"
            type="date"
            className="min-h-11 min-w-0 rounded-full sm:min-h-8"
            value={from}
            onChange={(event) => update({ from: event.target.value })}
          />
        </div>

        <div className={FIELD}>
          <Label htmlFor="filter-to" className={LABEL}>
            Até
          </Label>
          <Input
            id="filter-to"
            type="date"
            className="min-h-11 min-w-0 rounded-full sm:min-h-8"
            value={to}
            onChange={(event) => update({ to: event.target.value })}
          />
        </div>
      </div>

      {hasFilters && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="min-h-11 rounded-full sm:min-h-8"
            onClick={() =>
              update({
                type: '',
                accountId: '',
                categoryId: '',
                from: '',
                to: '',
              })
            }
          >
            Limpar filtros
          </Button>
        </div>
      )}
    </section>
  )
}
