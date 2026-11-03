import { Suspense } from 'react'
import { connection } from 'next/server'
import { Badge } from '@/components/ui/badge'
import { CategoryForm } from '@/features/categories/components/category-form'
import { DeleteCategoryButton } from '@/features/categories/components/delete-category-button'
import { listCategories } from '@/features/categories/queries'

// The header renders at once; the list reads the database inside Suspense.
export default function CategoriesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Categorias</h1>
        <CategoryForm />
      </div>

      <Suspense
        fallback={
          <p className="text-sm text-muted-foreground">
            Carregando categorias…
          </p>
        }
      >
        <CategoriesList />
      </Suspense>
    </div>
  )
}

async function CategoriesList() {
  await connection()
  const categories = await listCategories()

  if (categories.length === 0) {
    return (
      <p className="text-muted-foreground">
        Nenhuma categoria cadastrada ainda.
      </p>
    )
  }

  return (
    <ul className="divide-y rounded-xl border">
      {categories.map((category) => (
        <li
          key={category.id}
          className="flex flex-wrap items-center justify-between gap-3 p-4"
        >
          <div className="flex min-w-0 items-center gap-3">
            <span
              aria-hidden
              className="size-4 shrink-0 rounded-full ring-1 ring-foreground/10"
              style={{ backgroundColor: category.color }}
            />
            <span className="truncate font-medium">{category.name}</span>
            <Badge variant="secondary">
              {category.type === 'INCOME' ? 'Receita' : 'Despesa'}
            </Badge>
          </div>
          <div className="flex gap-2">
            <CategoryForm
              category={category}
              typeLocked={category._count.transactions > 0}
            />
            <DeleteCategoryButton id={category.id} name={category.name} />
          </div>
        </li>
      ))}
    </ul>
  )
}
