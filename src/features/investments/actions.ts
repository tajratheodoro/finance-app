'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { db } from '@/lib/db'
import { fromError, type ActionResult } from '@/lib/action-result'
import { investmentSchema } from './schemas'

const ERRORS = { P2025: 'Investimento não encontrado.' }

function invalid(error: z.ZodError): ActionResult<never> {
  return {
    ok: false,
    error: 'Revise os campos destacados.',
    fieldErrors: z.flattenError(error).fieldErrors,
  }
}

export async function createInvestment(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = investmentSchema.safeParse(input)
  if (!parsed.success) return invalid(parsed.error)

  try {
    const row = await db.investment.create({ data: parsed.data })
    revalidatePath('/investments')
    return { ok: true, data: { id: row.id } }
  } catch (err) {
    return fromError(err, ERRORS)
  }
}

export async function updateInvestment(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  const parsed = investmentSchema.safeParse(input)
  if (!parsed.success) return invalid(parsed.error)

  try {
    await db.investment.update({ where: { id }, data: parsed.data })
    revalidatePath('/investments')
    return { ok: true }
  } catch (err) {
    return fromError(err, ERRORS)
  }
}

export async function deleteInvestment(id: string): Promise<ActionResult> {
  try {
    await db.investment.delete({ where: { id } })
    revalidatePath('/investments')
    return { ok: true }
  } catch (err) {
    return fromError(err, ERRORS)
  }
}
