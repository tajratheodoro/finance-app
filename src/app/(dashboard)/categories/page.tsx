import { Suspense } from 'react'
import { connection } from 'next/server'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CategoryForm } from '@/features/categories/components/category-form'
import { DeleteCategoryButton } from '@/features/categories/components/delete-category-button'
import { listCategories } from '@/features/categories/queries'

// The header renders at once; the list reads the database inside Suspense.
export default function CategoriesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">Categorias</h1>
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
      <p className="rounded-3xl border border-dashed p-6 text-center text-sm text-muted-foreground">
        Nenhuma categoria cadastrada ainda.
      </p>
    )
  }

  return (
    <ul className="grid gap-4 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-[240ms] sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((category) => (
        <li key={category.id}>
          <Card className="h-full rounded-3xl">
            <CardHeader className="flex items-center justify-between gap-2">
              <CardTitle className="flex min-w-0 items-center gap-3">
                <span
                  aria-hidden
                  className="size-4 shrink-0 rounded-full ring-1 ring-foreground/10"
                  style={{ backgroundColor: category.color }}
                />
                <span className="truncate">{category.name}</span>
              </CardTitle>
              <div className="flex shrink-0 gap-1">
                <CategoryForm
                  category={category}
                  typeLocked={category._count.transactions > 0}
                />
                <DeleteCategoryButton id={category.id} name={category.name} />
              </div>
            </CardHeader>
            <CardContent>
              <Badge
                variant="outline"
                className={
                  category.type === 'INCOME' ? 'text-income' : 'text-expense'
                }
              >
                {category.type === 'INCOME' ? 'Receita' : 'Despesa'}
              </Badge>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  )
}
