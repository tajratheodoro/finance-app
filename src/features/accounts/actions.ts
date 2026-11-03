'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { db } from '@/lib/db'
import { fromError, type ActionResult } from '@/lib/action-result'
import { accountSchema } from './schemas'

const ACCOUNT_ERRORS = {
  P2003: 'Esta conta tem transações. Exclua ou mova as transações antes.',
  P2025: 'Conta não encontrada.',
}

export async function createAccount(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = accountSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Revise os campos destacados.',
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    }
  }

  try {
    const account = await db.account.create({ data: parsed.data })
    revalidatePath('/accounts')
    return { ok: true, data: { id: account.id } }
  } catch (err) {
    return fromError(err, ACCOUNT_ERRORS)
  }
}

export async function updateAccount(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  const parsed = accountSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Revise os campos destacados.',
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    }
  }

  try {
    await db.account.update({ where: { id }, data: parsed.data })
    revalidatePath('/accounts')
    return { ok: true }
  } catch (err) {
    return fromError(err, ACCOUNT_ERRORS)
  }
}

export async function deleteAccount(id: string): Promise<ActionResult> {
  try {
    await db.account.delete({ where: { id } })
    revalidatePath('/accounts')
    return { ok: true }
  } catch (err) {
    return fromError(err, ACCOUNT_ERRORS)
  }
}
