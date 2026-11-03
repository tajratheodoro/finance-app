'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ItemSelect } from './transaction-form'

type Option = { id: string; name: string }
type Category = Option & { type: 'INCOME' | 'EXPENSE' }

const TYPE_ITEMS = [
  { value: '', label: 'Todos os tipos' },
  { value: 'INCOME', label: 'Receita' },
  { value: 'EXPENSE', label: 'Despesa' },
]

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
    <section aria-label="Filtros" className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="filter-type">Tipo</Label>
          <ItemSelect
            id="filter-type"
            items={TYPE_ITEMS}
            value={type}
            // A category of the other type would match nothing, so it is cleared.
            onChange={(next) => update({ type: next, categoryId: '' })}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="filter-account">Conta</Label>
          <ItemSelect
            id="filter-account"
            items={accountItems}
            value={accountId}
            onChange={(next) => update({ accountId: next })}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="filter-category">Categoria</Label>
          <ItemSelect
            id="filter-category"
            items={categoryItems}
            value={categoryId}
            onChange={(next) => update({ categoryId: next })}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="filter-from">De</Label>
          <Input
            id="filter-from"
            type="date"
            value={from}
            onChange={(event) => update({ from: event.target.value })}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="filter-to">Até</Label>
          <Input
            id="filter-to"
            type="date"
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
