'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { Delete } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AccountSelector } from '@/features/accounts/components/account-selector'
import type { AccountWithBalance } from '@/features/accounts/queries'
import { ItemSelect } from '@/features/transactions/components/transaction-form'
import { createTransaction } from '@/features/transactions/actions'
import { centsToInput, formatBrl } from '@/lib/money'
import { cn } from '@/lib/utils'
import { evaluate, pressKey, type Key } from '../calculator'

type Category = { id: string; name: string; type: 'INCOME' | 'EXPENSE' }
type Mode = 'gasto' | 'receita' | 'deposito'

const MODES: { value: Mode; label: string }[] = [
  { value: 'gasto', label: 'Gasto' },
  { value: 'receita', label: 'Receita' },
  { value: 'deposito', label: 'Depósito' },
]

const TYPE_OF: Record<Mode, Category['type']> = {
  gasto: 'EXPENSE',
  receita: 'INCOME',
  deposito: 'INCOME',
}

// amountCents is a 32-bit Int in the database.
const MAX_CENTS = 2_147_483_647

type Tile = { key: Key | '='; label: string; aria?: string; kind: string }

const TILES: Tile[] = [
  { key: 'clear', label: 'C', aria: 'Limpar', kind: 'action' },
  { key: 'back', label: '', aria: 'Apagar último dígito', kind: 'action' },
  { key: '÷', label: '÷', aria: 'Dividir', kind: 'operator' },
  { key: '×', label: '×', aria: 'Multiplicar', kind: 'operator' },
  { key: '7', label: '7', kind: 'digit' },
  { key: '8', label: '8', kind: 'digit' },
  { key: '9', label: '9', kind: 'digit' },
  { key: '−', label: '−', aria: 'Subtrair', kind: 'operator' },
  { key: '4', label: '4', kind: 'digit' },
  { key: '5', label: '5', kind: 'digit' },
  { key: '6', label: '6', kind: 'digit' },
  { key: '+', label: '+', aria: 'Somar', kind: 'operator' },
  { key: '1', label: '1', kind: 'digit' },
  { key: '2', label: '2', kind: 'digit' },
  { key: '3', label: '3', kind: 'digit' },
  { key: '=', label: '=', aria: 'Calcular', kind: 'equals' },
  { key: '0', label: '0', kind: 'digit' },
  { key: ',', label: ',', aria: 'Vírgula decimal', kind: 'digit' },
]

const TILE_CLASS: Record<string, string> = {
  digit: 'bg-background text-foreground',
  action: 'bg-secondary text-secondary-foreground',
  operator: 'bg-secondary text-secondary-foreground text-3xl',
  equals: 'row-span-2 bg-primary text-primary-foreground text-3xl',
}

const KEYBOARD: Record<string, Key | '='> = {
  ',': ',',
  '.': ',',
  '+': '+',
  '-': '−',
  '*': '×',
  x: '×',
  '/': '÷',
  Backspace: 'back',
  Escape: 'clear',
  '=': '=',
}

function todayIso(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

// "12,50" stays, "125,00" becomes "125" so the expression reads like typed input.
const toExpression = (cents: number) => centsToInput(cents).replace(/,00$/, '')

const display = (expression: string) =>
  expression.replace(/[+−×÷]/g, (operator) => ` ${operator} `)

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p id={id} className="text-sm text-destructive">
      {message}
    </p>
  ) : null
}

export function Registrar({
  accounts,
  categories,
}: {
  accounts: AccountWithBalance[]
  categories: Category[]
}) {
  const [mode, setMode] = useState<Mode>('gasto')
  const [expression, setExpression] = useState('0')
  const [attempted, setAttempted] = useState(false)
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '')
  const [categoryId, setCategoryId] = useState('')
  const [date, setDate] = useState(todayIso)
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string>()
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [saved, setSaved] = useState<string>()
  const [pending, startTransition] = useTransition()

  const type = TYPE_OF[mode]
  const typeCategories = categories.filter((c) => c.type === type)

  // A trailing operator or comma is still being typed: preview what is complete.
  const preview = evaluate(expression.replace(/[+−×÷,]$/, ''))
  const cents = preview.ok ? preview.cents : null
  const problem = !preview.ok
    ? preview.error
    : preview.cents < 0
      ? 'O resultado não pode ser negativo.'
      : preview.cents > MAX_CENTS
        ? 'Valor muito alto.'
        : preview.cents === 0
          ? 'Digite um valor maior que zero.'
          : null
  // Zero is the starting state, so it only counts as a problem after a save attempt.
  const showProblem = problem && (attempted || cents !== 0)
  const amountError = fieldErrors.amount?.[0]

  function press(key: Key | '=') {
    setSaved(undefined)
    setAttempted(false)
    setFieldErrors((current) => ({ ...current, amount: [] }))
    if (key === '=') {
      if (cents !== null && cents >= 0 && cents <= MAX_CENTS) {
        setExpression(toExpression(cents))
      } else {
        setAttempted(true)
      }
      return
    }
    setExpression((current) => pressKey(current, key))
  }

  // Keyboard layer for desktop. Skipped while typing in a field.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey || event.altKey) return
      const target = event.target as HTMLElement
      if (
        target.closest(
          'input, textarea, select, [contenteditable], [role="combobox"], [role="listbox"]',
        )
      ) {
        return
      }
      const key = /^\d$/.test(event.key)
        ? (event.key as Key)
        : KEYBOARD[event.key]
      if (!key) return
      event.preventDefault()
      press(key)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  function changeMode(next: Mode) {
    setMode(next)
    setSaved(undefined)
    const selected = categories.find((c) => c.id === categoryId)
    if (selected && selected.type !== TYPE_OF[next]) setCategoryId('')
  }

  function submit(event: React.FormEvent) {
    event.preventDefault()
    setAttempted(true)
    setSaved(undefined)
    setError(undefined)
    setFieldErrors({})
    if (problem || cents === null) return

    const category = categories.find((c) => c.id === categoryId)
    const fallback = mode === 'deposito' ? 'Depósito' : (category?.name ?? '')
    const input = {
      description: description.trim() || fallback,
      amount: centsToInput(cents),
      type,
      date,
      accountId,
      categoryId,
    }

    startTransition(async () => {
      const result = await createTransaction(input)
      if (!result.ok) {
        setError(result.error)
        setFieldErrors(result.fieldErrors ?? {})
        return
      }
      const label = MODES.find((m) => m.value === mode)!.label
      const account = accounts.find((a) => a.id === accountId)?.name
      setSaved(`Registro salvo: ${label} de ${formatBrl(cents)} em ${account}.`)
      setExpression('0')
      setDescription('')
      setAttempted(false)
    })
  }

  const result = cents === null ? '—' : formatBrl(cents)

  return (
    <div className="flex flex-col gap-6">
      <fieldset className="flex rounded-full bg-secondary p-1">
        <legend className="sr-only">Tipo de registro</legend>
        {MODES.map((option) => (
          <label
            key={option.value}
            className="relative flex min-h-11 flex-1 cursor-pointer items-center justify-center rounded-full px-3 text-sm font-medium text-secondary-foreground has-checked:bg-primary has-checked:text-primary-foreground has-focus-visible:ring-2 has-focus-visible:ring-ring motion-safe:transition-colors"
          >
            <input
              type="radio"
              name="mode"
              value={option.value}
              checked={mode === option.value}
              onChange={() => changeMode(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </fieldset>

      <section
        aria-label="Calculadora"
        className="flex flex-col gap-4 rounded-3xl bg-card p-4 text-card-foreground sm:p-5"
      >
        <div className="flex min-h-32 flex-col items-end justify-end gap-1 px-2 text-right">
          <p
            aria-label="Expressão"
            className="min-h-6 max-w-full text-base break-all text-muted-foreground tabular-nums"
          >
            {display(expression)}
          </p>
          <output
            aria-live="polite"
            aria-label="Resultado"
            className={cn(
              'max-w-full font-semibold break-all tabular-nums',
              result.length > 12 ? 'text-3xl sm:text-4xl' : 'text-5xl',
              mode === 'gasto' ? 'text-expense' : 'text-income',
            )}
          >
            <span
              key={result}
              className="inline-block motion-safe:animate-in motion-safe:duration-150 motion-safe:fade-in"
            >
              {result}
            </span>
          </output>
          <p
            id="amount-error"
            role="alert"
            className="min-h-5 text-sm text-destructive"
          >
            {amountError || (showProblem ? problem : '')}
          </p>
        </div>

        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {TILES.map((tile) => (
            <button
              key={tile.key}
              type="button"
              aria-label={tile.aria}
              onClick={() => press(tile.key)}
              className={cn(
                'flex min-h-14 items-center justify-center rounded-2xl text-2xl font-semibold tabular-nums outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card motion-safe:transition-transform motion-safe:duration-80 motion-safe:active:scale-96 sm:min-h-16',
                TILE_CLASS[tile.kind],
                tile.key === '0' && 'col-span-2',
              )}
            >
              {tile.key === 'back' ? (
                <Delete aria-hidden="true" className="size-6" />
              ) : (
                tile.label
              )}
            </button>
          ))}
        </div>
      </section>

      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Conta</span>
          {accounts.length ? (
            <AccountSelector
              accounts={accounts}
              value={accountId}
              onChange={(id) => {
                setAccountId(id)
                setSaved(undefined)
              }}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhuma conta cadastrada.{' '}
              <Link href="/accounts" className="text-foreground underline">
                Criar conta
              </Link>
            </p>
          )}
          <FieldError
            id="accountId-error"
            message={fieldErrors.accountId?.[0]}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="categoryId">Categoria</Label>
            <ItemSelect
              id="categoryId"
              items={typeCategories.map((c) => ({
                value: c.id,
                label: c.name,
              }))}
              value={categoryId || null}
              onChange={setCategoryId}
              invalid={!!fieldErrors.categoryId?.length}
              describedBy={
                fieldErrors.categoryId?.length ? 'categoryId-error' : undefined
              }
              placeholder={
                typeCategories.length
                  ? 'Escolha uma categoria'
                  : 'Nenhuma categoria deste tipo'
              }
            />
            <FieldError
              id="categoryId-error"
              message={fieldErrors.categoryId?.[0]}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="date">Data</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="min-h-11 rounded-full px-4 sm:min-h-8"
              aria-invalid={!!fieldErrors.date?.length}
              aria-describedby={
                fieldErrors.date?.length ? 'date-error' : undefined
              }
            />
            <FieldError id="date-error" message={fieldErrors.date?.[0]} />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="description">Descrição (opcional)</Label>
          <Input
            id="description"
            autoComplete="off"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder={
              mode === 'deposito'
                ? 'Depósito'
                : (categories.find((c) => c.id === categoryId)?.name ??
                  'Nome da categoria')
            }
            className="min-h-11 rounded-full px-4 sm:min-h-8"
            aria-invalid={!!fieldErrors.description?.length}
            aria-describedby={
              fieldErrors.description?.length ? 'description-error' : undefined
            }
          />
          <FieldError
            id="description-error"
            message={fieldErrors.description?.[0]}
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {saved && (
          <p role="status" className="text-sm font-medium text-foreground">
            {saved}
          </p>
        )}

        <Button
          type="submit"
          disabled={pending}
          className="min-h-12 rounded-full text-base"
        >
          {pending ? 'Salvando…' : 'Salvar registro'}
        </Button>
      </form>
    </div>
  )
}
