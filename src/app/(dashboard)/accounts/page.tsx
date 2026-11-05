import { Suspense } from 'react'
import { connection } from 'next/server'
import { typeLabels } from '@/features/accounts/brands'
import { AccountCard } from '@/features/accounts/components/account-card'
import { AccountFormDialog } from '@/features/accounts/components/account-form'
import { DeleteAccountButton } from '@/features/accounts/components/delete-account-button'
import { listAccounts } from '@/features/accounts/queries'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatBrl } from '@/lib/money'

// The header renders at once; the list reads the database inside Suspense.
export default function AccountsPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Contas</h1>
        <AccountFormDialog />
      </div>

      <Suspense
        fallback={
          <p className="text-sm text-muted-foreground">Carregando contas…</p>
        }
      >
        <AccountsList />
      </Suspense>
    </div>
  )
}

async function AccountsList() {
  await connection()
  const accounts = await listAccounts()

  if (accounts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhuma conta cadastrada. Use Nova conta para começar.
      </p>
    )
  }

  const totalCents = accounts.reduce((sum, a) => sum + a.balanceCents, 0)

  return (
    <>
      <section aria-labelledby="accounts-cards" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="accounts-cards" className="text-sm text-muted-foreground">
            Saldo somado
          </h2>
          <p className="text-3xl font-semibold tabular-nums">
            {formatBrl(totalCents)}
          </p>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <li key={account.id}>
              <AccountCard account={account} />
            </li>
          ))}
        </ul>
      </section>

      <Table aria-label="Contas cadastradas">
        <TableHeader className="hidden sm:table-header-group">
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Instituição</TableHead>
            <TableHead className="text-right">Saldo</TableHead>
            <TableHead>
              <span className="sr-only">Ações</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accounts.map((account) => (
            <TableRow
              key={account.id}
              className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1 py-4 sm:table-row sm:py-0"
            >
              <TableCell className="min-w-0 truncate p-0 font-medium sm:p-2">
                {account.name}
              </TableCell>
              <TableCell className="col-start-1 row-start-2 p-0 text-muted-foreground sm:p-2">
                {typeLabels[account.type]}
              </TableCell>
              <TableCell className="hidden text-muted-foreground sm:table-cell">
                {account.institution ?? '—'}
              </TableCell>
              <TableCell className="col-start-2 row-start-1 p-0 text-right font-semibold tabular-nums sm:p-2">
                {formatBrl(account.balanceCents)}
              </TableCell>
              <TableCell className="col-span-2 p-0 pt-2 sm:p-2">
                <div className="flex justify-end gap-2">
                  <AccountFormDialog account={account} />
                  <DeleteAccountButton id={account.id} name={account.name} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  )
}
