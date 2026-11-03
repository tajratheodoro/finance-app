'use client'

import { useState, useTransition } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { createAccount, updateAccount } from '@/features/accounts/actions'
import { accountSchema, type AccountInput } from '@/features/accounts/schemas'
import { centsToInput } from '@/lib/money'

type Account = {
  id: string
  name: string
  type: AccountInput['type']
  initialBalanceCents: number
}

const typeOptions: { value: AccountInput['type']; label: string }[] = [
  { value: 'CHECKING', label: 'Conta corrente' },
  { value: 'WALLET', label: 'Carteira' },
  { value: 'SAVINGS', label: 'Poupança' },
]

export function AccountFormDialog({ account }: { account?: Account }) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant={account ? 'outline' : 'default'} size="sm" />}
        aria-label={account ? `Editar ${account.name}` : undefined}
      >
        {account ? 'Editar' : 'Nova conta'}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{account ? 'Editar conta' : 'Nova conta'}</DialogTitle>
          <DialogDescription>
            {account
              ? 'Altere os dados da conta.'
              : 'Cadastre uma conta para acompanhar o saldo.'}
          </DialogDescription>
        </DialogHeader>
        <AccountForm account={account} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}

// Kept in its own component so the form state resets each time the dialog opens.
function AccountForm({
  account,
  onDone,
}: {
  account?: Account
  onDone: () => void
}) {
  const [error, setError] = useState<string>()
  const [pending, startTransition] = useTransition()
  const {
    control,
    register,
    handleSubmit,
    setError: setFieldError,
    formState: { errors },
  } = useForm<AccountInput>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: account?.name ?? '',
      type: account?.type,
      initialBalance: account ? centsToInput(account.initialBalanceCents) : '0',
    },
  })

  const onSubmit = handleSubmit((values) => {
    setError(undefined)
    startTransition(async () => {
      const result = account
        ? await updateAccount(account.id, values)
        : await createAccount(values)

      if (result.ok) {
        onDone()
        return
      }

      setError(result.error)
      for (const [field, messages] of Object.entries(
        result.fieldErrors ?? {},
      )) {
        setFieldError(field as keyof AccountInput, { message: messages[0] })
      }
    })
  })

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="account-name">Nome</Label>
        <Input
          id="account-name"
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? 'account-name-error' : undefined}
          {...register('name')}
        />
        {errors.name && (
          <p id="account-name-error" className="text-sm text-destructive">
            {errors.name.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="account-type">Tipo</Label>
        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <Select
              items={typeOptions}
              value={field.value ?? null}
              onValueChange={field.onChange}
            >
              <SelectTrigger
                id="account-type"
                className="w-full"
                aria-invalid={errors.type ? true : undefined}
                aria-describedby={
                  errors.type ? 'account-type-error' : undefined
                }
              >
                <SelectValue placeholder="Escolha um tipo" />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.type && (
          <p id="account-type-error" className="text-sm text-destructive">
            {errors.type.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="account-balance">Saldo inicial</Label>
        <Input
          id="account-balance"
          inputMode="decimal"
          placeholder="0,00"
          aria-invalid={errors.initialBalance ? true : undefined}
          aria-describedby={
            errors.initialBalance
              ? 'account-balance-error'
              : 'account-balance-hint'
          }
          {...register('initialBalance')}
        />
        {errors.initialBalance ? (
          <p id="account-balance-error" className="text-sm text-destructive">
            {errors.initialBalance.message}
          </p>
        ) : (
          <p
            id="account-balance-hint"
            className="text-sm text-muted-foreground"
          >
            Pode ser zero ou negativo.
          </p>
        )}
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>
          Cancelar
        </DialogClose>
        <Button type="submit" disabled={pending}>
          {pending ? 'Salvando…' : 'Salvar'}
        </Button>
      </DialogFooter>
    </form>
  )
}
