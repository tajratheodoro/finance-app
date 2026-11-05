import 'dotenv/config'
import { db } from '@/lib/db'

// Deterministic on purpose: the same run gives the same numbers every time,
// so screenshots and tests stay stable.
export async function seed() {
  await db.transaction.deleteMany()
  await db.category.deleteMany()
  await db.account.deleteMany()

  const nubank = await db.account.create({
    data: {
      name: 'Nubank',
      type: 'CHECKING',
      institution: 'Nubank',
      initialBalanceCents: 150000,
    },
  })
  const wallet = await db.account.create({
    data: { name: 'Carteira', type: 'WALLET', initialBalanceCents: 20000 },
  })
  await db.account.create({
    data: {
      name: 'Poupança',
      type: 'SAVINGS',
      institution: 'Caixa',
      initialBalanceCents: 500000,
    },
  })

  const salary = await db.category.create({
    data: { name: 'Salário', type: 'INCOME', color: '#16a34a' },
  })
  const freelance = await db.category.create({
    data: { name: 'Freelas', type: 'INCOME', color: '#0ea5e9' },
  })
  const food = await db.category.create({
    data: { name: 'Alimentação', type: 'EXPENSE', color: '#f97316' },
  })
  const transport = await db.category.create({
    data: { name: 'Transporte', type: 'EXPENSE', color: '#8b5cf6' },
  })
  const housing = await db.category.create({
    data: { name: 'Moradia', type: 'EXPENSE', color: '#ef4444' },
  })
  const leisure = await db.category.create({
    data: { name: 'Lazer', type: 'EXPENSE', color: '#eab308' },
  })

  const now = new Date()
  const rows = []

  // Six months ending in the current one. Month offsets roll over the year with Date.UTC.
  for (let back = 5; back >= 0; back--) {
    const k = 5 - back
    const at = (day: number) =>
      new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - back, day, 12),
      )

    rows.push(
      {
        description: 'Salário',
        amountCents: 500000 + k * 10000,
        type: 'INCOME' as const,
        date: at(1),
        accountId: nubank.id,
        categoryId: salary.id,
      },
      {
        description: 'Projeto freelance',
        amountCents: 80000 + ((k * 37) % 5) * 5000,
        type: 'INCOME' as const,
        date: at(12),
        accountId: wallet.id,
        categoryId: freelance.id,
      },
      {
        description: 'Aluguel',
        amountCents: 150000,
        type: 'EXPENSE' as const,
        date: at(5),
        accountId: nubank.id,
        categoryId: housing.id,
      },
      {
        description: 'Supermercado',
        amountCents: 60000 + k * 2300,
        type: 'EXPENSE' as const,
        date: at(8),
        accountId: nubank.id,
        categoryId: food.id,
      },
      {
        description: 'Transporte',
        amountCents: 25000 + k * 500,
        type: 'EXPENSE' as const,
        date: at(10),
        accountId: wallet.id,
        categoryId: transport.id,
      },
      {
        description: 'Cinema e jantar',
        amountCents: 18000 + ((k * 53) % 7) * 1000,
        type: 'EXPENSE' as const,
        date: at(15),
        accountId: wallet.id,
        categoryId: leisure.id,
      },
    )
  }

  await db.transaction.createMany({ data: rows })
}

if (process.argv[1]?.endsWith('seed.ts')) {
  seed()
    .then(() => console.log('Seed concluído.'))
    .finally(() => db.$disconnect())
}
