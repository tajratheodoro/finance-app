import { Client } from 'pg'

// Empties the E2E database once, before the run. Plain SQL on purpose: the Prisma CLI
// refuses to reset when it detects an agent, and Playwright cannot load the ESM Prisma client.
export default async function globalSetup() {
  const client = new Client({ connectionString: process.env.TEST_DATABASE_URL })
  await client.connect()
  try {
    await client.query('TRUNCATE "Transaction", "Category", "Account" CASCADE')
  } finally {
    await client.end()
  }
}
