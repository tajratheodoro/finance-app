import { z } from 'zod'
import { parseBrlToCents } from '@/lib/money'

export const transactionSchema = z
  .object({
    description: z.string().trim().min(1, 'Informe uma descrição.'),
    amount: z.string(),
    type: z.enum(['INCOME', 'EXPENSE'], { error: 'Escolha um tipo.' }),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe uma data.'),
    accountId: z.string().min(1, 'Escolha uma conta.'),
    categoryId: z.string().min(1, 'Escolha uma categoria.'),
  })
  .transform((data, ctx) => {
    const amountCents = parseBrlToCents(data.amount)
    if (amountCents === null) {
      ctx.addIssue({
        code: 'custom',
        path: ['amount'],
        message: 'Valor inválido.',
      })
      return z.NEVER
    }

    // Noon UTC keeps the calendar day stable in every timezone.
    const [year, month, day] = data.date.split('-').map(Number)
    const date = new Date(Date.UTC(year, month - 1, day, 12))
    if (date.getUTCDate() !== day) {
      ctx.addIssue({
        code: 'custom',
        path: ['date'],
        message: 'Data inexistente.',
      })
      return z.NEVER
    }

    return {
      description: data.description,
      amountCents,
      type: data.type,
      date,
      accountId: data.accountId,
      categoryId: data.categoryId,
    }
  })

export type TransactionInput = z.input<typeof transactionSchema>
export type TransactionOutput = z.output<typeof transactionSchema>
