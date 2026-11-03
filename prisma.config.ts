import 'dotenv/config'
import { defineConfig } from 'prisma/config'

// PRISMA_TEST=1 points the Prisma CLI at the test database (used by db:test:migrate).
const url = process.env.PRISMA_TEST
  ? process.env.TEST_DATABASE_URL
  : process.env.DATABASE_URL

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url,
  },
})
