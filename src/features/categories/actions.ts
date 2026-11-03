'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { db } from '@/lib/db'
import { fromError, type ActionResult } from '@/lib/action-result'
import { categorySchema } from './schemas'

const TYPE_LOCKED =
  'Não é possível mudar o tipo de uma categoria que já tem transações.'

function invalidInput(error: z.ZodError): ActionResult<never> {
  return {
    ok: false,
    error: 'Revise os campos destacados.',
    fieldErrors: z.flattenError(error).fieldErrors as Record<string, string[]>,
  }
}

export async function createCategory(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = categorySchema.safeParse(input)
  if (!parsed.success) return invalidInput(parsed.error)

  let category
  try {
    category = await db.category.create({ data: parsed.data })
  } catch (err) {
    return fromError(err, {})
  }

  revalidatePath('/categories')
  return { ok: true, data: { id: category.id } }
}

export async function updateCategory(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  const parsed = categorySchema.safeParse(input)
  if (!parsed.success) return invalidInput(parsed.error)

  try {
    const current = await db.category.findUnique({
      where: { id },
      select: { type: true, _count: { select: { transactions: true } } },
    })
    // ponytail: check and write are not in one transaction; a row inserted in between could mismatch type. Fine for single-user phase 1.
    if (
      current &&
      current.type !== parsed.data.type &&
      current._count.transactions > 0
    ) {
      return {
        ok: false,
        error: TYPE_LOCKED,
        fieldErrors: { type: [TYPE_LOCKED] },
      }
    }
    await db.category.update({ where: { id }, data: parsed.data })
  } catch (err) {
    return fromError(err, { P2025: 'Categoria não encontrada.' })
  }

  revalidatePath('/categories')
  return { ok: true }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  try {
    await db.category.delete({ where: { id } })
  } catch (err) {
    return fromError(err, {
      P2003:
        'Esta categoria tem transações. Exclua ou mova as transações antes.',
      P2025: 'Categoria não encontrada.',
    })
  }

  revalidatePath('/categories')
  return { ok: true }
}
