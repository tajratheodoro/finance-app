'use client'

import { useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createTransaction, updateTransaction } from '../actions'
import { transactionSchema, type TransactionInput } from '../schemas'

type Option = { id: string; name: string }
type Category = Option & { type: 'INCOME' | 'EXPENSE' }

export type EditableTransaction = {
  id: string
  description: string
  amountCents: number
  type: 'INCOME' | 'EXPENSE'
  date: Date
  accountId: string
  categoryId: string
}

type Props = {
  accounts: Option[]
  categories: Category[]
  transaction?: EditableTransaction
}

const TYPE_OPTIONS = [
  { value: 'INCOME', label: 'Receita' },
  { value: 'EXPENSE', label: 'Despesa' },
]

const toItem = ({ id, name }: Option) => ({ value: id, label: name })

function todayIso(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

function toDefaults(transaction?: EditableTransaction): TransactionInput {
  if (!transaction) {
    return {
      description: '',
      amount: '',
      type: 'EXPENSE',
      date: todayIso(),
      accountId: '',
      categoryId: '',
    }
  }
  return {
    description: transaction.description,
    amount: (transaction.amountCents / 100).toFixed(2).replace('.', ','),
    type: transaction.type,
    // Stored at noon UTC, so the UTC date is the calendar day the user picked.
    date: transaction.date.toISOString().slice(0, 10),
    accountId: transaction.accountId,
    categoryId: transaction.categoryId,
  }
}

// Shared by the form and the list filters. An empty value shows the placeholder.
export function ItemSelect({
  id,
  items,
  value,
  onChange,
  invalid = false,
  describedBy,
  placeholder,
}: {
  id: string
  items: { value: string; label: string }[]
  value: string | null
  onChange: (value: string) => void
  invalid?: boolean
  describedBy?: string
  placeholder?: string
}) {
  return (
    <Select
      items={items}
      value={value}
      onValueChange={(next) => onChange(next ?? '')}
    >
      <SelectTrigger
        id={id}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        className="min-h-11 w-full rounded-full sm:min-h-8"
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p id={id} className="text-sm text-destructive">
      {message}
    </p>
  ) : null
}

function TransactionForm({
  accounts,
  categories,
  transaction,
  onDone,
}: Props & { onDone: () => void }) {
  const [serverError, setServerError] = useState<string>()
  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<TransactionInput>({
    // raw: the server action parses the input again, so it gets the strings as typed.
    resolver: zodResolver(transactionSchema, undefined, { raw: true }),
    defaultValues: toDefaults(transaction),
  })

  const type = useWatch({ control, name: 'type' })
  const categoryItems = categories
    .filter((category) => category.type === type)
    .map(toItem)

  async function onSubmit(values: TransactionInput) {
    setServerError(undefined)
    const result = transaction
      ? await updateTransaction(transaction.id, values)
      : await createTransaction(values)

    if (result.ok) {
      onDone()
      return
    }
    setServerError(result.error)
    for (const [field, messages] of Object.entries(result.fieldErrors ?? {})) {
      setError(field as keyof TransactionInput, { message: messages[0] })
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Descrição</Label>
        <Input
          id="description"
          autoComplete="off"
          aria-invalid={!!errors.description}
          aria-describedby={
            errors.description ? 'description-error' : undefined
          }
          {...register('description')}
        />
        <FieldError
          id="description-error"
          message={errors.description?.message}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="type">Tipo</Label>
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <ItemSelect
                id="type"
                items={TYPE_OPTIONS}
                value={field.value}
                invalid={!!errors.type}
                describedBy={errors.type ? 'type-error' : undefined}
                onChange={(next) => {
                  field.onChange(next)
                  // Drop the category if it belongs to the other type.
                  const selected = categories.find(
                    (category) => category.id === getValues('categoryId'),
                  )
                  if (selected && selected.type !== next) {
                    setValue('categoryId', '')
                  }
                }}
              />
            )}
          />
          <FieldError id="type-error" message={errors.type?.message} />
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="amount">Valor (R$)</Label>
          <Input
            id="amount"
            inputMode="decimal"
            placeholder="0,00"
            autoComplete="off"
            className="h-14 rounded-2xl text-2xl font-semibold tabular-nums md:text-2xl"
            aria-invalid={!!errors.amount}
            aria-describedby={errors.amount ? 'amount-error' : undefined}
            {...register('amount')}
          />
          <FieldError id="amount-error" message={errors.amount?.message} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="date">Data</Label>
          <Input
            id="date"
            type="date"
            aria-invalid={!!errors.date}
            aria-describedby={errors.date ? 'date-error' : undefined}
            {...register('date')}
          />
          <FieldError id="date-error" message={errors.date?.message} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="accountId">Conta</Label>
          <Controller
            name="accountId"
            control={control}
            render={({ field }) => (
              <ItemSelect
                id="accountId"
                items={accounts.map(toItem)}
                value={field.value || null}
                invalid={!!errors.accountId}
                describedBy={errors.accountId ? 'accountId-error' : undefined}
                placeholder="Escolha uma conta"
                onChange={field.onChange}
              />
            )}
          />
          <FieldError
            id="accountId-error"
            message={errors.accountId?.message}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="categoryId">Categoria</Label>
        <Controller
          name="categoryId"
          control={control}
          render={({ field }) => (
            <ItemSelect
              id="categoryId"
              items={categoryItems}
              value={field.value || null}
              invalid={!!errors.categoryId}
              describedBy={errors.categoryId ? 'categoryId-error' : undefined}
              placeholder="Escolha uma categoria"
              onChange={field.onChange}
            />
          )}
        />
        <FieldError
          id="categoryId-error"
          message={errors.categoryId?.message}
        />
      </div>

      {serverError && (
        <p role="alert" className="text-sm text-destructive">
          {serverError}
        </p>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <DialogClose
          render={
            <Button variant="outline" className="min-h-11 rounded-full" />
          }
        >
          Cancelar
        </DialogClose>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="min-h-11 rounded-full"
        >
          {isSubmitting ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </form>
  )
}

export function TransactionFormDialog({
  label,
  variant = 'default',
  ...props
}: Props & { label: string; variant?: 'default' | 'outline' }) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant={variant}
            size="sm"
            className="min-h-11 rounded-full px-4 sm:min-h-8"
          />
        }
      >
        {label}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {props.transaction ? 'Editar transação' : 'Nova transação'}
          </DialogTitle>
        </DialogHeader>
        {/* Mounted only while open, so each open starts from fresh values. */}
        <TransactionForm {...props} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
