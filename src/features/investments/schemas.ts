import { z } from 'zod'
import { parseBrlToCents } from '@/lib/money'

export const kindOptions = [
  { value: 'FIXED_INCOME', label: 'Renda fixa' },
  { value: 'STOCK', label: 'Ações' },
  { value: 'FUND', label: 'Fundos' },
  { value: 'CRYPTO', label: 'Cripto' },
  { value: 'OTHER', label: 'Outros' },
] as const

export const kindLabels = Object.fromEntries(
  kindOptions.map((o) => [o.value, o.label]),
) as Record<(typeof kindOptions)[number]['value'], string>

export const investmentSchema = z
  .object({
    name: z.string().trim().min(1, 'Informe um nome.'),
    kind: z.enum(['FIXED_INCOME', 'STOCK', 'FUND', 'CRYPTO', 'OTHER'], {
      error: 'Escolha um tipo.',
    }),
    institution: z
      .string()
      .trim()
      .optional()
      .transform((value) => value || null),
    invested: z.string(),
    currentValue: z.string().default('0'),
  })
  .transform((data, ctx) => {
    const investedCents = parseBrlToCents(data.invested)
    const currentValueCents = parseBrlToCents(data.currentValue, {
      allowZero: true,
    })
    if (investedCents === null) {
      ctx.addIssue({
        code: 'custom',
        path: ['invested'],
        message: 'Informe um valor maior que zero.',
      })
    }
    if (currentValueCents === null) {
      ctx.addIssue({
        code: 'custom',
        path: ['currentValue'],
        message: 'Valor inválido.',
      })
    }
    if (investedCents === null || currentValueCents === null) return z.NEVER
    return {
      name: data.name,
      kind: data.kind,
      institution: data.institution,
      investedCents,
      currentValueCents,
    }
  })

export type InvestmentInput = z.input<typeof investmentSchema>
