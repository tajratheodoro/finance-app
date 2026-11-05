'use client'

import { useState, useTransition } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Pencil, Plus } from 'lucide-react'
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
import {
  createInvestment,
  updateInvestment,
} from '@/features/investments/actions'
import {
  investmentSchema,
  kindOptions,
  type InvestmentInput,
} from '@/features/investments/schemas'
import { centsToInput } from '@/lib/money'

type Investment = {
  id: string
  name: string
  kind: InvestmentInput['kind']
  institution: string | null
  investedCents: number
  currentValueCents: number
}

export function InvestmentFormDialog({
  investment,
}: {
  investment?: Investment
}) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant={investment ? 'outline' : 'default'}
            size={investment ? 'icon' : 'default'}
            className={
              investment
                ? 'size-11 rounded-full sm:size-9'
                : 'h-11 rounded-full px-5'
            }
          />
        }
        aria-label={investment ? `Editar ${investment.name}` : undefined}
      >
        {investment ? (
          <Pencil aria-hidden />
        ) : (
          <>
            <Plus aria-hidden /> Novo investimento
          </>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {investment ? 'Editar investimento' : 'Novo investimento'}
          </DialogTitle>
          <DialogDescription>
            {investment
              ? 'Atualize o valor atual sempre que quiser.'
              : 'Informe quanto você aplicou e quanto vale hoje.'}
          </DialogDescription>
        </DialogHeader>
        <InvestmentForm investment={investment} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}

// Own component so the form state resets each time the dialog opens.
function InvestmentForm({
  investment,
  onDone,
}: {
  investment?: Investment
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
  } = useForm<InvestmentInput>({
    // raw: the server action parses again, so it must get the typed strings.
    resolver: zodResolver(investmentSchema, undefined, { raw: true }),
    defaultValues: {
      name: investment?.name ?? '',
      kind: investment?.kind,
      institution: investment?.institution ?? '',
      invested: investment ? centsToInput(investment.investedCents) : '',
      currentValue: investment
        ? centsToInput(investment.currentValueCents)
        : '',
    },
  })

  const onSubmit = handleSubmit((values) => {
    setError(undefined)
    startTransition(async () => {
      const result = investment
        ? await updateInvestment(investment.id, values)
        : await createInvestment(values)

      if (result.ok) {
        onDone()
        return
      }
      setError(result.error)
      for (const [field, messages] of Object.entries(
        result.fieldErrors ?? {},
      )) {
        setFieldError(field as keyof InvestmentInput, { message: messages[0] })
      }
    })
  })

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="investment-name">Nome</Label>
        <Input
          id="investment-name"
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? 'investment-name-error' : undefined}
          {...register('name')}
        />
        {errors.name && (
          <p id="investment-name-error" className="text-sm text-destructive">
            {errors.name.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="investment-kind">Tipo</Label>
        <Controller
          control={control}
          name="kind"
          render={({ field }) => (
            <Select
              items={
                kindOptions as unknown as { value: string; label: string }[]
              }
              value={field.value ?? null}
              onValueChange={field.onChange}
            >
              <SelectTrigger
                id="investment-kind"
                className="w-full"
                aria-invalid={errors.kind ? true : undefined}
                aria-describedby={
                  errors.kind ? 'investment-kind-error' : undefined
                }
              >
                <SelectValue placeholder="Escolha um tipo" />
              </SelectTrigger>
              <SelectContent>
                {kindOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.kind && (
          <p id="investment-kind-error" className="text-sm text-destructive">
            {errors.kind.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="investment-institution">Instituição (opcional)</Label>
        <Input
          id="investment-institution"
          placeholder="XP, Nubank…"
          autoComplete="off"
          {...register('institution')}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="investment-invested">Valor investido (R$)</Label>
          <Input
            id="investment-invested"
            inputMode="decimal"
            placeholder="0,00"
            aria-invalid={errors.invested ? true : undefined}
            aria-describedby={
              errors.invested ? 'investment-invested-error' : undefined
            }
            {...register('invested')}
          />
          {errors.invested && (
            <p
              id="investment-invested-error"
              className="text-sm text-destructive"
            >
              {errors.invested.message}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="investment-current">Valor atual (R$)</Label>
          <Input
            id="investment-current"
            inputMode="decimal"
            placeholder="0,00"
            aria-invalid={errors.currentValue ? true : undefined}
            aria-describedby={
              errors.currentValue ? 'investment-current-error' : undefined
            }
            {...register('currentValue')}
          />
          {errors.currentValue && (
            <p
              id="investment-current-error"
              className="text-sm text-destructive"
            >
              {errors.currentValue.message}
            </p>
          )}
        </div>
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
