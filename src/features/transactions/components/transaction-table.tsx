import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatBrl } from '@/lib/money'
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
      <p className="text-sm text-muted-foreground">
        Nenhuma transação encontrada.
      </p>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Data</TableHead>
          <TableHead>Descrição</TableHead>
          <TableHead>Conta</TableHead>
          <TableHead>Categoria</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead className="text-right">Valor</TableHead>
          <TableHead>
            <span className="sr-only">Ações</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((transaction) => (
          <TableRow key={transaction.id}>
            <TableCell>
              {transaction.date.toLocaleDateString('pt-BR', {
                timeZone: 'UTC',
              })}
            </TableCell>
            <TableCell className="whitespace-normal">
              {transaction.description}
            </TableCell>
            <TableCell>{transaction.account.name}</TableCell>
            <TableCell>{transaction.category.name}</TableCell>
            <TableCell>
              <Badge variant="outline">
                {transaction.type === 'INCOME' ? 'Receita' : 'Despesa'}
              </Badge>
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {formatBrl(transaction.amountCents)}
            </TableCell>
            <TableCell>
              <div className="flex flex-col items-end gap-1 sm:flex-row sm:justify-end">
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
        ))}
      </TableBody>
    </Table>
  )
}
