import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { resetDb } from '../helpers/db'
import {
  createAccount,
  deleteAccount,
  updateAccount,
} from '@/features/accounts/actions'
import { listAccounts } from '@/features/accounts/queries'

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

const DATE = new Date('2026-01-05T12:00:00.000Z')

describe('accounts', () => {
  beforeEach(async () => {
    await resetDb()
    vi.clearAllMocks()
  })
  afterAll(() => db.$disconnect())

  it('createAccount stores a valid account and returns its id', async () => {
    const result = await createAccount({
      name: 'Nubank',
      type: 'CHECKING',
      institution: ' Nubank ',
      initialBalance: '1000,00',
    })

    expect(result).toMatchObject({ ok: true })
    const id = result.ok ? result.data?.id : undefined
    const account = await db.account.findUniqueOrThrow({ where: { id } })
    expect(account).toMatchObject({
      name: 'Nubank',
      type: 'CHECKING',
      institution: 'Nubank',
      initialBalanceCents: 100000,
    })
    expect(revalidatePath).toHaveBeenCalledWith('/accounts')
  })

  it('createAccount returns field errors and stores nothing for an empty name', async () => {
    const result = await createAccount({ name: '  ', type: 'CHECKING' })

    expect(result).toMatchObject({
      ok: false,
      fieldErrors: { name: expect.any(Array) },
    })
    expect(await db.account.count()).toBe(0)
  })

  it('updateAccount changes the name and balance, and clears an empty institution', async () => {
    const account = await db.account.create({
      data: { name: 'Nubank', type: 'CHECKING', institution: 'Nubank' },
    })

    const result = await updateAccount(account.id, {
      name: 'Carteira',
      type: 'WALLET',
      institution: '',
      initialBalance: '50,00',
    })

    expect(result).toMatchObject({ ok: true })
    expect(
      await db.account.findUniqueOrThrow({ where: { id: account.id } }),
    ).toMatchObject({
      name: 'Carteira',
      type: 'WALLET',
      institution: null,
      initialBalanceCents: 5000,
    })
  })

  it('updateAccount returns a message for an id that does not exist', async () => {
    const result = await updateAccount('nao-existe', {
      name: 'X',
      type: 'CHECKING',
    })

    expect(result).toMatchObject({
      ok: false,
      error: expect.stringContaining('não encontrada'),
    })
  })

  it('listAccounts returns the initial balance plus income minus expense', async () => {
    const account = await db.account.create({
      data: {
        name: 'Nubank',
        type: 'CHECKING',
        institution: 'Nubank',
        initialBalanceCents: 100000,
      },
    })
    const income = await db.category.create({
      data: { name: 'Salário', type: 'INCOME', color: '#00ff00' },
    })
    const expense = await db.category.create({
      data: { name: 'Mercado', type: 'EXPENSE', color: '#ff0000' },
    })
    await db.transaction.createMany({
      data: [
        {
          description: 'Salário',
          amountCents: 50000,
          type: 'INCOME',
          date: DATE,
          accountId: account.id,
          categoryId: income.id,
        },
        {
          description: 'Mercado',
          amountCents: 20000,
          type: 'EXPENSE',
          date: DATE,
          accountId: account.id,
          categoryId: expense.id,
        },
      ],
    })

    expect(await listAccounts()).toEqual([
      {
        id: account.id,
        name: 'Nubank',
        type: 'CHECKING',
        institution: 'Nubank',
        initialBalanceCents: 100000,
        balanceCents: 130000,
      },
    ])
  })

  it('deleteAccount is blocked when the account has transactions', async () => {
    const account = await db.account.create({
      data: { name: 'Nubank', type: 'CHECKING' },
    })
    const category = await db.category.create({
      data: { name: 'Mercado', type: 'EXPENSE', color: '#ff0000' },
    })
    await db.transaction.create({
      data: {
        description: 'Mercado',
        amountCents: 20000,
        type: 'EXPENSE',
        date: DATE,
        accountId: account.id,
        categoryId: category.id,
      },
    })

    const result = await deleteAccount(account.id)

    expect(result).toMatchObject({
      ok: false,
      error: expect.stringContaining('transações'),
    })
    expect(
      await db.account.findUnique({ where: { id: account.id } }),
    ).not.toBeNull()
  })

  it('deleteAccount returns a message for an id that does not exist', async () => {
    const result = await deleteAccount('nao-existe')

    expect(result).toMatchObject({
      ok: false,
      error: expect.stringContaining('não encontrada'),
    })
  })
})
