import { connection } from 'next/server'
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

// Kept separate from the client form module, because a server page cannot read values exported from a 'use client' file.
const typeLabels = {
  CHECKING: 'Conta corrente',
  WALLET: 'Carteira',
  SAVINGS: 'Poupança',
} as const

export default async function AccountsPage() {
  await connection()
  const accounts = await listAccounts()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Contas</h1>
        <AccountFormDialog />
      </div>

      {accounts.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma conta cadastrada.
        </p>
      ) : (
        <Table aria-label="Contas cadastradas">
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead className="hidden sm:table-cell">Tipo</TableHead>
              <TableHead className="text-right">Saldo</TableHead>
              <TableHead>
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.map((account) => (
              <TableRow key={account.id}>
                <TableCell className="font-medium">{account.name}</TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">
                  {typeLabels[account.type]}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatBrl(account.balanceCents)}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <AccountFormDialog account={account} />
                    <DeleteAccountButton id={account.id} name={account.name} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
