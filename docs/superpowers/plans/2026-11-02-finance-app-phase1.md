# Finance App Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build phase 1 of the finance app: accounts, categories, and transactions with full CRUD, plus a dashboard, seeded with 6 months of data, tested, and documented for a portfolio.

**Architecture:** Next.js App Router with one folder per feature. Server actions validate input with Zod and write through Prisma to PostgreSQL. Server components read through each feature's `queries.ts`. Dashboard totals are aggregated in the database.

**Tech Stack:** Next.js (App Router), TypeScript, Prisma, PostgreSQL (Docker), Zod, react-hook-form, Tailwind CSS, shadcn/ui, Recharts, Vitest, Playwright, ESLint, Prettier, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-11-02-finance-app-design.md`

## Global Constraints

- Money is stored as integer cents (`Int`). Amounts are always positive; `type` gives the sign.
- A transaction date is stored at 12:00 UTC on the chosen day.
- Deleting an account or category that has transactions is blocked (`onDelete: Restrict`). It returns a message and never a 500.
- Lists paginate at 20 items per page.
- Filters and the dashboard period live in URL search params. The default period is the current month.
- Server actions return `ActionResult`. Business errors are returned, not thrown.
- UI copy is pt-BR. Code identifiers are English.
- No authentication in phase 1.

**Decisions made in planning** (the spec was silent on these):

- A category's `type` cannot change while it has transactions. The rule is `type` must match the transaction's type, so changing it would break existing data.
- The receita/despesa match rule needs the category's type from the database, so it is enforced in the transaction action, not in the Zod schema.
- An account's initial balance may be zero or negative (overdraft).

## Review Focus

1. Amount input such as `12,50`, `1.234,56`, `0`, `-5`, `12.50`, or `12.5.6` is parsed or rejected. It never becomes NaN or a negative transaction amount. Pinned in Task 2 and Task 5.
2. A transaction dated 31 Jan appears in January totals and the January chart bar, not February. Pinned in Task 9.
3. Deleting an account or category with transactions returns `{ ok: false }` with a message. Pinned in Task 6 and Task 7.
4. Editing or deleting an id that no longer exists returns "não encontrada" and does not crash. Pinned in Task 8.
5. Dashboard with zero transactions shows no NaN or division by zero. A malformed `?month=abc` falls back to the current month. Pinned in Task 9.

## Test Conventions

- Unit tests: `tests/unit/`. Integration tests: `tests/integration/`. End-to-end: `tests/e2e/`.
- Integration tests run against `TEST_DATABASE_URL`. `tests/setup.ts` copies it into `DATABASE_URL` before the app code loads.
- Integration tests run with `fileParallelism: false`. They share one database, so parallel files would clash. Ceiling: the suite gets slower as it grows. Upgrade path: one database per test file.
- Any test that imports an action mocks `next/cache`:
  `vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))`
- UI tasks have no unit tests. They are verified by typecheck, lint, and the end-to-end test in Task 16.

---

### Task 1: Scaffold the project and the local database

**Files:**
- Create: the Next.js project in `finance-app/` (`package.json`, `src/`, `tsconfig.json`, `.gitignore`, and so on)
- Create: `docker-compose.yml`, `docker/init.sql`, `.env.example`, `.prettierrc.json`, `vitest.config.ts`, `tests/setup.ts`

**Interfaces:**
- Produces: `npm run typecheck`, `npm run lint`, `npm run format`, `npm test`, `npm run test:e2e`, `npm run db:test:migrate`

- [ ] **Step 1: Scaffold the app**

Run from `C:\Users\tajra\Documents\Projetos\finance-app`:

```bash
npx create-next-app@latest . --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

If the CLI refuses because the folder is not empty, scaffold into a temporary folder, move the files in, and keep `docs/`.

- [ ] **Step 2: Initialize git**

Run: `git init` in `finance-app/`.
Expected: a `.git` folder exists. No commit yet; commits happen when the user asks.

- [ ] **Step 3: Add the local database**

`docker-compose.yml` runs `postgres:16` on port 5432 with user `finance`, password `finance`, and database `finance`. It mounts `docker/init.sql` into `/docker-entrypoint-initdb.d/`. That file runs `CREATE DATABASE finance_test;`.

- [ ] **Step 4: Add environment and tooling**

`.env.example` contains:

```
DATABASE_URL="postgresql://finance:finance@localhost:5432/finance"
TEST_DATABASE_URL="postgresql://finance:finance@localhost:5432/finance_test"
```

Copy it to `.env`. Install dev dependencies: `npm i -D vitest vite-tsconfig-paths prettier`.

`vitest.config.ts`: `environment: 'node'`, `vite-tsconfig-paths` plugin for the `@/` alias, `setupFiles: ['tests/setup.ts']`, `fileParallelism: false`, `include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts']`.

`tests/setup.ts` sets `process.env.DATABASE_URL = process.env.TEST_DATABASE_URL` when the test database URL is set.

Add scripts to `package.json`: `typecheck` (`tsc --noEmit`), `test` (`vitest run`), `format` (`prettier --write .`), `test:e2e` (`playwright test`).

- [ ] **Step 5: Verify**

Run: `docker compose up -d`, then `npm run typecheck` and `npm run lint`.
Expected: the container is running. Typecheck and lint exit with code 0.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js app and local PostgreSQL"
```

---

### Task 2: Money helpers

**Files:**
- Create: `src/lib/money.ts`
- Test: `tests/unit/money.test.ts`

**Interfaces:**
- Produces:
  - `parseBrlToCents(input: string, options?: { allowNegative?: boolean; allowZero?: boolean }): number | null`
  - `formatBrl(cents: number): string`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest'
import { formatBrl, parseBrlToCents } from '@/lib/money'

describe('parseBrlToCents', () => {
  it.each([
    ['12,50', 1250],
    ['1.234,56', 123456],
    ['1234,5', 123450],
    ['7', 700],
  ])('parses %s', (input, cents) => {
    expect(parseBrlToCents(input)).toBe(cents)
  })

  it.each(['', '0', '0,00', '-5', '12.50', '12.5.6', 'abc'])('rejects %s', (input) => {
    expect(parseBrlToCents(input)).toBeNull()
  })

  it('accepts negative and zero when allowed', () => {
    expect(parseBrlToCents('-50,00', { allowNegative: true })).toBe(-5000)
    expect(parseBrlToCents('0', { allowZero: true })).toBe(0)
  })
})

describe('formatBrl', () => {
  it('formats cents as BRL', () => {
    expect(formatBrl(123456)).toBe('R$\u00a01.234,56')
  })
})
```

Intl inserts a non-breaking space (`\u00a0`) after `R$`. The expected string must include it.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/unit/money.test.ts`
Expected: FAIL with "Failed to resolve import @/lib/money".

- [ ] **Step 3: Implement the module**

In `src/lib/money.ts`:
- `parseBrlToCents` matches the input against a pt-BR pattern with a regular expression: optional `-` (only if `allowNegative`), digits with dots as thousand separators only when they group in threes, and an optional comma with 1 or 2 decimals. Dots are not accepted as decimals, so `12.50` is rejected and cannot be misread as 1250. Then it converts to cents and rejects zero unless `allowZero`.
- `formatBrl` uses `new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/unit/money.test.ts`
Expected: PASS, all cases.

- [ ] **Step 5: Commit**

```bash
git add src/lib/money.ts tests/unit/money.test.ts
git commit -m "feat: add BRL money parsing and formatting"
```

---

### Task 3: Prisma schema, database client, and test helper

**Files:**
- Create: `prisma/schema.prisma`, `src/lib/db.ts`, `tests/helpers/db.ts`, `tests/integration/db.test.ts`
- Modify: `package.json` (scripts `db:migrate`, `db:test:migrate`)

**Interfaces:**
- Produces:
  - `db` from `@/lib/db`: a `PrismaClient` singleton. It is cached on `globalThis` in development so hot reload does not open new connections.
  - `resetDb(): Promise<void>` from `tests/helpers/db.ts`. It deletes transactions, then categories, then accounts.

- [ ] **Step 1: Write the failing test**

`tests/integration/db.test.ts`: create an account and a category, create a transaction that points to both, then try to delete the account. Assert that the delete throws Prisma error `P2003`. This pins decision 4 of the spec at the database level.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/integration/db.test.ts`
Expected: FAIL with "Cannot find module '@/lib/db'".

- [ ] **Step 3: Implement**

- Install: `npm i @prisma/client` and `npm i -D prisma`.
- `prisma/schema.prisma`: copy the model block from spec section 5 exactly.
- Run `npx prisma migrate dev --name init` against `DATABASE_URL`.
- Run `DATABASE_URL=$TEST_DATABASE_URL npx prisma migrate deploy` to migrate the test database. Add it as the `db:test:migrate` script.
- `src/lib/db.ts` exports `db` as described above.
- `tests/helpers/db.ts` exports `resetDb`. It must delete in the order listed, because of the foreign keys.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/integration/db.test.ts`
Expected: PASS. The delete throws `P2003`.

- [ ] **Step 5: Commit**

```bash
git add prisma src/lib/db.ts tests/helpers tests/integration/db.test.ts package.json
git commit -m "feat: add Prisma schema and database client"
```

---

### Task 4: Shared action result and account and category schemas

**Files:**
- Create: `src/lib/action-result.ts`, `src/features/accounts/schemas.ts`, `src/features/categories/schemas.ts`
- Test: `tests/unit/account-category-schemas.test.ts`

**Interfaces:**
- Produces:
  - `ActionResult<T = undefined>`: `{ ok: true; data?: T } | { ok: false; error: string; fieldErrors?: Record<string, string[]> }`
  - `fromError(err: unknown, known: Record<string, string>): ActionResult<never>`. It maps Prisma codes `P2003` and `P2025` to `known` messages. Any other error is logged with `console.error` and returns `'Algo deu errado. Tente novamente.'`.
  - `accountSchema`: `{ name, type: 'CHECKING' | 'WALLET' | 'SAVINGS', initialBalance: string }`. It transforms `initialBalance` into `initialBalanceCents`, using `parseBrlToCents(..., { allowNegative: true, allowZero: true })`. An unparseable value raises an issue on `initialBalance`. Input default for `initialBalance` is `'0'`.
  - `categorySchema`: `{ name, type: 'INCOME' | 'EXPENSE', color }`. Color must match `#RRGGBB`.

- [ ] **Step 1: Write the failing tests**

Cover these cases:
- Name `''` and `'   '` are rejected.
- Color `'red'` is rejected. Color `'#1A2B3C'` is accepted.
- `initialBalance: '-50,00'` parses to `initialBalanceCents: -5000`.
- `initialBalance: 'abc'` raises an issue on the `initialBalance` field.
- `fromError` with a `P2003` error returns the `known` message for that code.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/unit/account-category-schemas.test.ts`
Expected: FAIL with missing module errors.

- [ ] **Step 3: Implement**

Implement the three modules as described in Interfaces. `fromError` checks the error's `code` property, which is how Prisma exposes error codes.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/unit/account-category-schemas.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib src/features/accounts/schemas.ts src/features/categories/schemas.ts tests/unit
git commit -m "feat: add action result type and account and category schemas"
```

---

### Task 5: Transaction schema

**Files:**
- Create: `src/features/transactions/schemas.ts`
- Test: `tests/unit/transaction-schema.test.ts`

**Interfaces:**
- Produces:
  - `transactionSchema`: `{ description, amount: string, type: 'INCOME' | 'EXPENSE', date: string, accountId, categoryId }`. It transforms `amount` into `amountCents` (positive only, via `parseBrlToCents`) and `date` (`YYYY-MM-DD`) into a `Date` at 12:00 UTC.
  - `TransactionInput`: `z.infer<typeof transactionSchema>`, the output type.

This schema cannot check that the category's type matches. That check needs the database, so it lives in Task 8.

- [ ] **Step 1: Write the failing tests**

- `amount: '12,50'` → `amountCents: 1250`.
- `amount: '0'`, `amount: '-5'`, `amount: '12.50'` are rejected with an issue on `amount`.
- `date: '2026-01-31'` → `Date` equal to `new Date('2026-01-31T12:00:00.000Z')`.
- Empty `description` is rejected. Empty `accountId` is rejected.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/unit/transaction-schema.test.ts`
Expected: FAIL with a missing module error.

- [ ] **Step 3: Implement**

Implement `transactionSchema` as described in Interfaces.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/unit/transaction-schema.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/transactions/schemas.ts tests/unit/transaction-schema.test.ts
git commit -m "feat: add transaction schema"
```

---

### Task 6: Accounts actions and queries

**Files:**
- Create: `src/features/accounts/actions.ts`, `src/features/accounts/queries.ts`
- Test: `tests/integration/accounts.test.ts`

**Interfaces:**
- Consumes: `db` (Task 3), `resetDb` (Task 3), `accountSchema` and `fromError` (Task 4), `ActionResult` (Task 4)
- Produces:
  - `createAccount(input: unknown): Promise<ActionResult<{ id: string }>>`
  - `updateAccount(id: string, input: unknown): Promise<ActionResult>`
  - `deleteAccount(id: string): Promise<ActionResult>`
  - `listAccounts(): Promise<AccountWithBalance[]>`, where `AccountWithBalance = { id; name; type; balanceCents }`

`balanceCents` is the initial balance plus income minus expense. Read it with one query for accounts and one `groupBy` on transactions by `accountId` and `type`, then merge in memory.

Error messages for `fromError`:
- `P2003` (delete blocked): `'Esta conta tem transações. Exclua ou mova as transações antes.'`
- `P2025` (not found): `'Conta não encontrada.'`

Each action calls `revalidatePath('/accounts')` after a successful write.

- [ ] **Step 1: Write the failing tests**

Mock `next/cache` as described in Test Conventions. Cover:
- `createAccount` with valid input returns `{ ok: true }` with an id, and the row exists.
- `createAccount` with an empty name returns `ok: false` with `fieldErrors.name`, and the table is still empty.
- Fixture: initial `1000,00`, one income `500,00`, one expense `200,00`. `listAccounts` returns `balanceCents: 130000`. The fixture transactions need a category, so create one in the test.
- Deleting an account that has a transaction returns `ok: false`, the message contains "transações", and the account still exists. This pins Review Focus item 3.
- Deleting an id that does not exist returns `ok: false` with "não encontrada". This pins Review Focus item 4.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/integration/accounts.test.ts`
Expected: FAIL with a missing module error.

- [ ] **Step 3: Implement**

Each action follows this order: `safeParse` on the input, then return `fieldErrors` if it fails, then the write inside `try`, then `fromError` in `catch`, then `revalidatePath`. Actions must have the `'use server'` directive at the top of the file.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/integration/accounts.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/accounts tests/integration/accounts.test.ts
git commit -m "feat: add account actions and balance query"
```

---

### Task 7: Categories actions and queries

**Files:**
- Create: `src/features/categories/actions.ts`, `src/features/categories/queries.ts`
- Test: `tests/integration/categories.test.ts`

**Interfaces:**
- Consumes: the same as Task 6, with `categorySchema`
- Produces:
  - `createCategory`, `updateCategory`, `deleteCategory` (same signatures as Task 6)
  - `listCategories(type?: 'INCOME' | 'EXPENSE'): Promise<Category[]>`

Follow the Task 6 structure exactly. Do not extract a generic CRUD helper.

`updateCategory` also blocks a change of `type` when the category has transactions. Return `ok: false` with `fieldErrors.type` and the message `'Não é possível mudar o tipo de uma categoria que já tem transações.'`. This is decision 1 in Global Constraints.

Error messages for `fromError`:
- `P2003`: `'Esta categoria tem transações. Exclua ou mova as transações antes.'`
- `P2025`: `'Categoria não encontrada.'`

- [ ] **Step 1: Write the failing tests**

Cover these cases:
- Create works. Empty name is rejected.
- Deleting a category with transactions is blocked with a message. This pins Review Focus item 3.
- Changing the `type` of a category with transactions is blocked.
- Changing the `type` of a category without transactions works.
- Deleting or updating an unknown id returns "não encontrada". This pins Review Focus item 4.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/integration/categories.test.ts`
Expected: FAIL with a missing module error.

- [ ] **Step 3: Implement**

Implement as in Task 6, plus the `type` check described above.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/integration/categories.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/categories tests/integration/categories.test.ts
git commit -m "feat: add category actions and queries"
```

---

### Task 8: Transactions actions and queries

**Files:**
- Create: `src/features/transactions/actions.ts`, `src/features/transactions/queries.ts`
- Test: `tests/integration/transactions.test.ts`

**Interfaces:**
- Consumes: `db`, `resetDb`, `transactionSchema` and `TransactionInput` (Task 5), `ActionResult` and `fromError` (Task 4)
- Produces:
  - `createTransaction(input: unknown): Promise<ActionResult<{ id: string }>>`
  - `updateTransaction(id: string, input: unknown): Promise<ActionResult>`
  - `deleteTransaction(id: string): Promise<ActionResult>`
  - `listTransactions(filters: TransactionFilters): Promise<{ items: Transaction[]; total: number; page: number; pageSize: 20 }>`, where `TransactionFilters = { page?: number; accountId?: string; categoryId?: string; type?: 'INCOME' | 'EXPENSE'; from?: Date; to?: Date }`. `from` and `to` are inclusive on the calendar day.

**Category match rule:** before the write, load the category. If its `type` differs from the transaction's `type`, return `ok: false` with `fieldErrors.categoryId = ['Escolha uma categoria de receita.']` for income or `['Escolha uma categoria de despesa.']` for expense. A missing category returns the same kind of field error.

Error messages for `fromError` on update and delete:
- `P2025`: `'Transação não encontrada.'`

Pagination: `page` defaults to 1. Items are ordered by `date desc`, then `id`. Pages are 20 items.

- [ ] **Step 1: Write the failing tests**

Cover these cases:
- An INCOME transaction with an EXPENSE category returns `fieldErrors.categoryId`, and nothing is written.
- Creating a valid transaction returns `ok: true`.
- Fixture of 25 transactions: page 1 has 20 items and `total: 25`, page 2 has 5. This is the 20-per-page rule.
- The `type` filter returns only matching rows.
- `from`/`to` filters include both boundary days.
- Updating or deleting an unknown id returns "não encontrada". This pins Review Focus item 4.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/integration/transactions.test.ts`
Expected: FAIL with a missing module error.

- [ ] **Step 3: Implement**

Implement the actions in the same order as Task 6, with the category check before the write. Implement `listTransactions` with `findMany` and `count` in one `$transaction`, so the total matches the page.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/integration/transactions.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/transactions tests/integration/transactions.test.ts
git commit -m "feat: add transaction actions and paginated list"
```

---

### Task 9: Dashboard queries and period parsing

**Files:**
- Create: `src/features/dashboard/period.ts`, `src/features/dashboard/queries.ts`
- Test: `tests/unit/period.test.ts`, `tests/integration/dashboard.test.ts`

**Interfaces:**
- Consumes: `db`, `resetDb`
- Produces:
  - `parsePeriod(month: string | undefined, now?: Date): Period`, where `Period = { year: number; month: number; from: Date; to: Date }`. `month` has the format `YYYY-MM`. Anything else falls back to the month of `now`. `from` is the first day at 00:00 UTC and `to` is the first day of the next month. The range is `[from, to)`, half-open.
  - `getTotalBalance(): Promise<number>`: initial balances plus all incomes minus all expenses.
  - `getPeriodSummary(period: Period): Promise<{ incomeCents: number; expenseCents: number; balanceCents: number }>`
  - `getExpensesByCategory(period: Period): Promise<{ categoryId; name; color; totalCents }[]>`, sorted by total, descending.
  - `getMonthlySeries(end: Period, months?: 6): Promise<{ label: 'YYYY-MM'; incomeCents; expenseCents }[]>`. Zero-filled, so every month appears.
  - `getRecentTransactions(limit?: 5)`

Use `aggregate` and `groupBy` for totals. Do not load rows to sum them in JavaScript.

- [ ] **Step 1: Write the failing tests**

`tests/unit/period.test.ts`:
- `parsePeriod('2026-01')` returns `from` at `2026-01-01T00:00:00.000Z` and `to` at `2026-02-01T00:00:00.000Z`.
- `parsePeriod('abc', new Date('2026-03-10T12:00:00.000Z'))` returns March 2026. This pins Review Focus item 5.

`tests/integration/dashboard.test.ts`:
- Empty database: every summary value is `0`, no `NaN`. This pins Review Focus item 5.
- A transaction dated `2026-01-31` (stored at 12:00 UTC) counts in January and not in February. This pins Review Focus item 2.
- `getMonthlySeries` returns 6 entries, and a month with no data is `0`.
- `getExpensesByCategory` is sorted by total, descending.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run tests/unit/period.test.ts tests/integration/dashboard.test.ts`
Expected: FAIL with missing module errors.

- [ ] **Step 3: Implement**

Implement `parsePeriod` with a regular expression for `YYYY-MM` and a range check on the month (1 to 12). Implement the queries as described above.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run tests/unit/period.test.ts tests/integration/dashboard.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/dashboard tests/unit/period.test.ts tests/integration/dashboard.test.ts
git commit -m "feat: add dashboard queries and period parsing"
```

---

### Task 10: App shell and UI primitives

**Files:**
- Create: `src/app/(dashboard)/layout.tsx`, `src/components/app-nav.tsx`
- Generate: `src/components/ui/*` through the shadcn CLI

**Interfaces:**
- Produces: a layout with a nav that links to `/` (label "Painel"), `/transactions` ("Transações"), `/categories` ("Categorias"), and `/accounts` ("Contas").

Run `npx shadcn@latest init`, then `npx shadcn@latest add button input label dialog table select card form`.

- [ ] **Step 1: Initialize shadcn/ui and add the primitives**

Run the two commands above.
Expected: `src/components/ui/` contains the primitives.

- [ ] **Step 2: Build the layout and nav**

The layout wraps the children with the nav. The nav marks the current link as active.

- [ ] **Step 3: Verify**

Run: `npm run typecheck && npm run lint`
Expected: both exit with code 0. Then `npm run dev` and open `http://localhost:3000`. The four links are visible and each one opens (the pages can still be empty).

- [ ] **Step 4: Commit**

```bash
git add src/app src/components
git commit -m "feat: add app shell and shadcn/ui primitives"
```

---

### Task 11: Accounts screens

**Files:**
- Create: `src/app/(dashboard)/accounts/page.tsx`, `src/features/accounts/components/account-form.tsx`, `src/features/accounts/components/delete-account-button.tsx`

**Interfaces:**
- Consumes: `listAccounts`, `createAccount`, `updateAccount`, `deleteAccount` (Task 6), `accountSchema` (Task 4), `formatBrl` (Task 2)

The form uses react-hook-form with `zodResolver(accountSchema)`. Type the form values with `z.input<typeof accountSchema>`, because the input type of `initialBalance` is a string.

When an action returns `ok: false`, show `error`. Show `fieldErrors` next to each field.

- [ ] **Step 1: Build the page and the form dialog**

The page lists the accounts with `formatBrl(balanceCents)`. It has a button that opens the form. The form creates or edits an account.

- [ ] **Step 2: Build the delete button**

It asks for confirmation in a dialog. It shows the `error` from `deleteAccount` if the delete is blocked.

- [ ] **Step 3: Verify**

Run: `npm run typecheck && npm run lint`
Expected: both exit with code 0. Manual check: create an account, edit it, and try to delete one that has transactions. The blocked message appears. The end-to-end test in Task 16 covers the rest.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(dashboard\)/accounts src/features/accounts/components
git commit -m "feat: add accounts screens"
```

---

### Task 12: Categories screens

**Files:**
- Create: `src/app/(dashboard)/categories/page.tsx`, `src/features/categories/components/category-form.tsx`, `src/features/categories/components/delete-category-button.tsx`

**Interfaces:**
- Consumes: the Task 7 actions and `categorySchema` (Task 4)

Follow the Task 11 structure. Show the type field as a select with "Receita" and "Despesa". When the category has transactions, the type select is disabled in edit mode, with a hint that explains why.

- [ ] **Step 1: Build the page, the form, and the delete button**

- [ ] **Step 2: Verify**

Run: `npm run typecheck && npm run lint`
Expected: both exit with code 0.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(dashboard\)/categories src/features/categories/components
git commit -m "feat: add categories screens"
```

---

### Task 13: Transactions screens

**Files:**
- Create: `src/app/(dashboard)/transactions/page.tsx`, `src/features/transactions/components/transaction-form.tsx`, `src/features/transactions/components/transaction-filters.tsx`, `src/features/transactions/components/transaction-table.tsx`, `src/features/transactions/components/delete-transaction-button.tsx`

**Interfaces:**
- Consumes: `listTransactions` (Task 8), `listAccounts` (Task 6), `listCategories` (Task 7), the transaction actions (Task 8), `transactionSchema` (Task 5), `formatBrl` (Task 2)

Filters are selects and date inputs. They write to the URL search params (`type`, `accountId`, `categoryId`, `from`, `to`, `page`). The page reads them from `searchParams`.

The amount field is a text input that accepts `12,50`. The category select only lists categories of the chosen type.

- [ ] **Step 1: Build the filters, the table, and the pagination links**

- [ ] **Step 2: Build the form dialog and the delete button**

- [ ] **Step 3: Verify**

Run: `npm run typecheck && npm run lint`
Expected: both exit with code 0. Manual check: change a filter and confirm the URL changes and the list updates.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(dashboard\)/transactions src/features/transactions/components
git commit -m "feat: add transactions screens with URL filters"
```

---

### Task 14: Dashboard screen

**Files:**
- Create: `src/app/(dashboard)/page.tsx`, `src/features/dashboard/components/summary-cards.tsx`, `src/features/dashboard/components/expenses-by-category-chart.tsx`, `src/features/dashboard/components/monthly-chart.tsx`, `src/features/dashboard/components/period-picker.tsx`, `src/features/dashboard/components/recent-transactions.tsx`

**Interfaces:**
- Consumes: every query in Task 9, `parsePeriod` (Task 9), `formatBrl` (Task 2)

Charts use Recharts (`BarChart` for both). The period picker is a `type="month"` input that writes `?month=YYYY-MM`.

Empty state: when there are no transactions, show a message and a button to add the first one. Do not render empty charts.

- [ ] **Step 1: Build the summary cards and the period picker**

- [ ] **Step 2: Build the two charts and the recent list**

- [ ] **Step 3: Build the empty state**

- [ ] **Step 4: Verify**

Run: `npm run typecheck && npm run lint`
Expected: both exit with code 0. Manual check after Task 15 (with seed data): the cards, both charts, and the recent list show values.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(dashboard\)/page.tsx src/features/dashboard/components
git commit -m "feat: add dashboard screen"
```

---

### Task 15: Seed script

**Files:**
- Create: `prisma/seed.ts`
- Test: `tests/integration/seed.test.ts`
- Modify: `package.json` (`"prisma": { "seed": "tsx prisma/seed.ts" }` and script `db:seed`)

**Interfaces:**
- Consumes: `db` (Task 3), `resetDb` (Task 3)

The seed creates:
- 3 accounts: Nubank (checking), Carteira (wallet), Poupança (savings).
- 2 income categories: Salário, Freelas.
- 4 expense categories: Alimentação, Transporte, Moradia, Lazer.
- Transactions for the last 6 months, ending in the current month.

The data is deterministic. Use fixed amount arrays and index math, not `Math.random`, so screenshots and tests stay stable.

Install `tsx` as a dev dependency. Run the seed with `npm run db:seed`.

- [ ] **Step 1: Write the failing test**

`tests/integration/seed.test.ts`: run the seed function against the test database, then assert that `getMonthlySeries` returns 6 months, and that every month has `expenseCents > 0` and `incomeCents > 0`.

To make the seed callable from tests, export a `seed()` function from `prisma/seed.ts` and run it from the file's `main` block only.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/integration/seed.test.ts`
Expected: FAIL with a missing module error.

- [ ] **Step 3: Implement**

`seed()` calls `resetDb()` first, then inserts the rows described above.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/integration/seed.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add prisma/seed.ts tests/integration/seed.test.ts package.json package-lock.json
git commit -m "feat: add deterministic seed with six months of data"
```

---

### Task 16: End-to-end happy path

**Files:**
- Create: `playwright.config.ts`, `tests/e2e/happy-path.spec.ts`

**Interfaces:**
- Consumes: `resetDb` (Task 3)

The Playwright config starts `npm run dev` with `DATABASE_URL` set to `TEST_DATABASE_URL`. Install the browser with `npx playwright install chromium`.

- [ ] **Step 1: Write the failing test**

The spec does this in one flow:
1. `resetDb()` in a `beforeAll`.
2. Create an account "Conta teste".
3. Create an expense category "Mercado".
4. Create an expense of `150,00` named "Supermercado" in that account and category.
5. Open `/`. Assert that the expenses card shows `R$ 150,00`.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test:e2e`
Expected: FAIL. The app has no working flow yet.

- [ ] **Step 3: Implement the config**

Add the `webServer` block and the `env` override. The config does not change app code.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm run test:e2e`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add playwright.config.ts tests/e2e package.json package-lock.json
git commit -m "test: add end-to-end happy path"
```

---

### Task 17: CI

**Files:**
- Create: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: scripts `lint`, `typecheck`, `test`, `test:e2e`, `db:test:migrate`

The workflow:
- Runs on `push` and `pull_request`.
- Starts a `postgres:16` service with the database `finance_test`.
- Sets `TEST_DATABASE_URL` to the service and `DATABASE_URL` to the same value.
- Steps: checkout, setup Node 22 with npm cache, `npm ci`, `npm run db:test:migrate`, `npm run lint`, `npm run typecheck`, `npm test`, `npx playwright install --with-deps chromium`, `npm run test:e2e`.

- [ ] **Step 1: Write the workflow**

- [ ] **Step 2: Verify locally**

Run each step's command locally, in order, against the local Docker database.
Expected: each command exits with code 0.

Running the workflow on GitHub happens after the first push. Pushing is the user's call.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add lint, typecheck, unit, integration, and e2e pipeline"
```

---

### Task 18: README and portfolio polish

**Files:**
- Create: `README.md` (replace the scaffold README)
- Create: `docs/screenshots/dashboard.png`

**Interfaces:**
- Consumes: scripts from every earlier task, and the spec path

The README contains, in this order:
1. The dashboard screenshot at the top.
2. The CI badge: `![CI](https://github.com/<owner>/finance-app/actions/workflows/ci.yml/badge.svg)`. `<owner>` is the GitHub username and is filled in when the repository is created.
3. The stack, with one line of reasoning per choice.
4. Three commands to run: `docker compose up -d`, `npm run db:seed`, `npm run dev`.
5. A link to `docs/superpowers/specs/2026-11-02-finance-app-design.md`.
6. A link to `docs/superpowers/plans/2026-11-02-finance-app-phase1.md`.

To capture the screenshot: after `npm run db:seed` and `npm run dev`, run `npx playwright screenshot http://localhost:3000 docs/screenshots/dashboard.png`.

- [ ] **Step 1: Write the README**

- [ ] **Step 2: Capture the screenshot**

Expected: `docs/screenshots/dashboard.png` exists and shows the seeded dashboard.

- [ ] **Step 3: Verify the three-command setup from a clean state**

Run: `docker compose down -v`, then the three commands from the README.
Expected: the app runs at `http://localhost:3000` with seeded data.

- [ ] **Step 4: Commit**

```bash
git add README.md docs/screenshots
git commit -m "docs: add README and dashboard screenshot"
```
