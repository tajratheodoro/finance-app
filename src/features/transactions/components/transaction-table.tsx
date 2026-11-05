import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatBrl } from '@/lib/money'
import { cn } from '@/lib/utils'
import type { TransactionWithNames } from '../queries'
import { DeleteTransactionButton } from './delete-transaction-button'
import { TransactionFormDialog } from './transaction-form'

type Option = { id: string; name: string }
type Category = Option & { type: 'INCOME' | 'EXPENSE' }

export function TransactionTable({
  items,
  accounts,
  categories,
}: {
  items: TransactionWithNames[]
  accounts: Option[]
  categories: Category[]
}) {
  if (items.length === 0) {
    return (
      <p className="rounded-3xl bg-card px-6 py-10 text-center text-sm text-muted-foreground">
        Nenhuma transação encontrada. Ajuste os filtros ou crie uma nova.
      </p>
    )
  }

  // Below sm the table, rows and cells are block/grid, so each row reads as a card.
  return (
    <div className="rounded-3xl sm:bg-card sm:p-2">
      <Table className="block sm:table">
        <TableHeader className="hidden sm:table-header-group">
          <TableRow className="hover:bg-transparent">
            <TableHead className="h-11 px-4">Data</TableHead>
            <TableHead className="px-4">Descrição</TableHead>
            <TableHead className="px-4">Conta</TableHead>
            <TableHead className="px-4">Categoria</TableHead>
            <TableHead className="px-4">Tipo</TableHead>
            <TableHead className="px-4 text-right">Valor</TableHead>
            <TableHead className="px-4">
              <span className="sr-only">Ações</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="flex flex-col gap-2 sm:table-row-group">
          {items.map((transaction) => {
            const income = transaction.type === 'INCOME'
            return (
              <TableRow
                key={transaction.id}
                className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5 rounded-3xl border-0 bg-card p-4 motion-safe:animate-in motion-safe:duration-200 motion-safe:fade-in motion-safe:slide-in-from-bottom-2 sm:table-row sm:rounded-none sm:border-b sm:border-border sm:bg-transparent sm:p-0"
              >
                <TableCell className="col-start-1 row-start-1 p-0 text-xs text-muted-foreground sm:table-cell sm:p-4 sm:text-sm sm:text-foreground">
                  {transaction.date.toLocaleDateString('pt-BR', {
                    timeZone: 'UTC',
                  })}
                </TableCell>
                <TableCell className="col-start-1 row-start-2 p-0 font-medium whitespace-normal sm:table-cell sm:p-4">
                  <span className="block">{transaction.description}</span>
                  <span className="mt-0.5 block text-sm font-normal text-muted-foreground sm:hidden">
                    {transaction.account.name} · {transaction.category.name}
                  </span>
                </TableCell>
                <TableCell className="hidden sm:table-cell sm:p-4">
                  {transaction.account.name}
                </TableCell>
                <TableCell className="hidden sm:table-cell sm:p-4">
                  {transaction.category.name}
                </TableCell>
                <TableCell className="hidden sm:table-cell sm:p-4">
                  <span className="inline-flex rounded-full border border-border px-2.5 py-0.5 text-xs">
                    {income ? 'Receita' : 'Despesa'}
                  </span>
                </TableCell>
                <TableCell
                  className={cn(
                    'col-start-2 row-span-2 row-start-1 self-center p-0 text-right font-semibold tabular-nums sm:table-cell sm:p-4',
                    income ? 'text-income' : 'text-expense',
                  )}
                >
                  {income ? '+' : '-'} {formatBrl(transaction.amountCents)}
                </TableCell>
                <TableCell className="col-span-2 mt-2 p-0 sm:table-cell sm:p-4">
                  <div className="flex items-center justify-end gap-2">
                    <TransactionFormDialog
                      label="Editar"
                      variant="outline"
                      accounts={accounts}
                      categories={categories}
                      transaction={transaction}
                    />
                    <DeleteTransactionButton
                      id={transaction.id}
                      description={transaction.description}
                    />
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
