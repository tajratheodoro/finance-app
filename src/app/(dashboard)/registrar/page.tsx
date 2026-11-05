import { Suspense } from 'react'
import { connection } from 'next/server'
import { listAccounts } from '@/features/accounts/queries'
import { listCategories } from '@/features/categories/queries'
import { Registrar } from '@/features/registrar/components/registrar'

export default function RegistrarPage() {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
      <h1 className="text-3xl font-semibold">Registrar</h1>
      <Suspense
        fallback={<p className="text-sm text-muted-foreground">Carregando…</p>}
      >
        <RegistrarContent />
      </Suspense>
    </div>
  )
}

async function RegistrarContent() {
  await connection()
  const [accounts, categories] = await Promise.all([
    listAccounts(),
    listCategories(),
  ])

  return (
    <Registrar
      accounts={accounts}
      categories={categories.map(({ id, name, type }) => ({ id, name, type }))}
    />
  )
}
