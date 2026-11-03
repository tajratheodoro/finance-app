import { z } from 'zod'

export const categorySchema = z.object({
  name: z.string().trim().min(1, 'Informe um nome.'),
  type: z.enum(['INCOME', 'EXPENSE'], { error: 'Escolha um tipo.' }),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Use uma cor no formato #RRGGBB.'),
})

export type CategoryInput = z.input<typeof categorySchema>
