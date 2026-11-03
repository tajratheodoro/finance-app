import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from '@/features/categories/actions'
import { listCategories } from '@/features/categories/queries'
import { resetDb } from '../helpers/db'

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

const valid = { name: 'Mercado', type: 'EXPENSE', color: '#00ff00' } as const

// Creates a category that already has one transaction, so it cannot be deleted.
async function categoryWithTransaction() {
  const category = await db.category.create({ data: valid })
  const account = await db.account.create({
    data: { name: 'Nubank', type: 'CHECKING' },
  })
  await db.transaction.create({
    data: {
      description: 'Supermercado',
      amountCents: 15000,
      type: 'EXPENSE',
      date: new Date('2026-01-31T12:00:00.000Z'),
      accountId: account.id,
      categoryId: category.id,
    },
  })
  return category
}

describe('categories actions and queries', () => {
  beforeEach(resetDb)
  afterAll(() => db.$disconnect())

  describe('createCategory', () => {
    it('creates a category with valid input', async () => {
      const result = await createCategory(valid)

      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(revalidatePath).toHaveBeenCalledWith('/categories')
      const row = await db.category.findUnique({
        where: { id: result.data!.id },
      })
      expect(row?.name).toBe('Mercado')
    })

    it('rejects an empty name and writes nothing', async () => {
      const result = await createCategory({ ...valid, name: '  ' })

      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.fieldErrors?.name).toBeDefined()
      expect(await db.category.count()).toBe(0)
    })
  })

  describe('listCategories', () => {
    it('filters by type', async () => {
      await db.category.create({ data: valid })
      await db.category.create({
        data: { ...valid, name: 'Salário', type: 'INCOME' },
      })

      const expenses = await listCategories('EXPENSE')

      expect(expenses.map((c) => c.name)).toEqual(['Mercado'])
    })
  })

  describe('updateCategory', () => {
    it('changes the name of a category with transactions when the type stays the same', async () => {
      const category = await categoryWithTransaction()

      const result = await updateCategory(category.id, {
        ...valid,
        name: 'Supermercado',
      })

      expect(result.ok).toBe(true)
      const row = await db.category.findUnique({ where: { id: category.id } })
      expect(row?.name).toBe('Supermercado')
    })

    it('blocks changing the type of a category with transactions', async () => {
      const category = await categoryWithTransaction()
      const message =
        'Não é possível mudar o tipo de uma categoria que já tem transações.'

      const result = await updateCategory(category.id, {
        ...valid,
        type: 'INCOME',
      })

      expect(result).toEqual({
        ok: false,
        error: message,
        fieldErrors: { type: [message] },
      })
      const row = await db.category.findUnique({ where: { id: category.id } })
      expect(row?.type).toBe('EXPENSE')
    })

    it('changes the type of a category without transactions', async () => {
      const category = await db.category.create({ data: valid })

      const result = await updateCategory(category.id, {
        ...valid,
        type: 'INCOME',
      })

      expect(result.ok).toBe(true)
      const row = await db.category.findUnique({ where: { id: category.id } })
      expect(row?.type).toBe('INCOME')
    })

    it('returns "não encontrada" for an unknown id', async () => {
      const result = await updateCategory('missing-id', valid)

      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.error).toContain('não encontrada')
    })
  })

  describe('deleteCategory', () => {
    it('blocks deleting a category with transactions and keeps it', async () => {
      const category = await categoryWithTransaction()

      const result = await deleteCategory(category.id)

      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.error).toContain('transações')
      expect(
        await db.category.findUnique({ where: { id: category.id } }),
      ).not.toBeNull()
    })

    it('deletes a category without transactions', async () => {
      const category = await db.category.create({ data: valid })

      const result = await deleteCategory(category.id)

      expect(result.ok).toBe(true)
      expect(
        await db.category.findUnique({ where: { id: category.id } }),
      ).toBeNull()
    })

    it('returns "não encontrada" for an unknown id', async () => {
      const result = await deleteCategory('missing-id')

      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.error).toContain('não encontrada')
    })
  })
})
