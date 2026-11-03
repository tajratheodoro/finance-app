'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { fromError, type ActionResult } from '@/lib/action-result'
import { db } from '@/lib/db'
import { transactionSchema, type TransactionOutput } from './schemas'

const NOT_FOUND = { P2025: 'Transação não encontrada.' }

// The category must exist and match the transaction type. Needs the database, so it cannot live in the Zod schema.
async function categoryMismatch(
  data: TransactionOutput,
): Promise<ActionResult | null> {
  const category = await db.category.findUnique({
    where: { id: data.categoryId },
    select: { type: true },
  })
  if (category?.type === data.type) return null

  const message =
    data.type === 'INCOME'
      ? 'Escolha uma categoria de receita.'
      : 'Escolha uma categoria de despesa.'
  return { ok: false, error: message, fieldErrors: { categoryId: [message] } }
}

function revalidate() {
  revalidatePath('/transactions')
  revalidatePath('/')
}

export async function createTransaction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = transactionSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Revise os campos.',
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    }
  }

  try {
    const mismatch = await categoryMismatch(parsed.data)
    if (mismatch) return mismatch

    const { id } = await db.transaction.create({
      data: parsed.data,
      select: { id: true },
    })
    revalidate()
    return { ok: true, data: { id } }
  } catch (err) {
    return fromError(err, {})
  }
}

export async function updateTransaction(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  const parsed = transactionSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Revise os campos.',
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    }
  }

  try {
    const mismatch = await categoryMismatch(parsed.data)
    if (mismatch) return mismatch

    await db.transaction.update({ where: { id }, data: parsed.data })
    revalidate()
    return { ok: true }
  } catch (err) {
    return fromError(err, NOT_FOUND)
  }
}

export async function deleteTransaction(id: string): Promise<ActionResult> {
  try {
    await db.transaction.delete({ where: { id } })
    revalidate()
    return { ok: true }
  } catch (err) {
    return fromError(err, NOT_FOUND)
  }
}
