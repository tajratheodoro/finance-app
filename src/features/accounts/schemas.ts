import { z } from 'zod'
import { parseBrlToCents } from '@/lib/money'

export const accountSchema = z
  .object({
    name: z.string().trim().min(1, 'Informe um nome.'),
    type: z.enum(['CHECKING', 'WALLET', 'SAVINGS'], {
      error: 'Escolha um tipo.',
    }),
    initialBalance: z.string().default('0'),
  })
  .transform((data, ctx) => {
    const initialBalanceCents = parseBrlToCents(data.initialBalance, {
      allowNegative: true,
      allowZero: true,
    })
    if (initialBalanceCents === null) {
      ctx.addIssue({
        code: 'custom',
        path: ['initialBalance'],
        message: 'Valor inválido.',
      })
      return z.NEVER
    }
    return { name: data.name, type: data.type, initialBalanceCents }
  })

export type AccountInput = z.input<typeof accountSchema>
