import { expect, test } from '@playwright/test'

// Same local-date format the transaction form uses for its default.
function todayIso(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

test('criar conta, categoria e despesa, e ver o total no painel', async ({
  page,
}) => {
  await test.step('cria a conta', async () => {
    await page.goto('/accounts')
    await page.getByRole('button', { name: 'Nova conta' }).click()

    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('Nome').fill('Conta teste')
    await dialog.getByRole('combobox', { name: 'Tipo' }).click()
    await page.getByRole('option', { name: 'Conta corrente' }).click()
    await dialog.getByRole('button', { name: 'Salvar' }).click()

    await expect(dialog).toBeHidden()
    await expect(
      page.getByRole('table', { name: 'Contas cadastradas' }),
    ).toContainText('Conta teste')
  })

  await test.step('cria a categoria de despesa', async () => {
    await page.goto('/categories')
    await page.getByRole('button', { name: 'Nova categoria' }).click()

    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('Nome').fill('Mercado')
    await dialog.getByRole('combobox', { name: 'Tipo' }).click()
    await page.getByRole('option', { name: 'Despesa' }).click()
    await dialog.getByRole('button', { name: 'Salvar' }).click()

    await expect(dialog).toBeHidden()
    await expect(page.getByText('Mercado', { exact: true })).toBeVisible()
  })

  await test.step('cria a despesa de R$ 150,00', async () => {
    await page.goto('/transactions')
    await page.getByRole('button', { name: 'Nova transação' }).click()

    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('Descrição').fill('Supermercado')
    await dialog.getByRole('combobox', { name: 'Tipo' }).click()
    await page.getByRole('option', { name: 'Despesa' }).click()
    await dialog.getByLabel('Valor (R$)').fill('150,00')
    await dialog.getByLabel('Data').fill(todayIso())
    await dialog.getByRole('combobox', { name: 'Conta' }).click()
    await page.getByRole('option', { name: 'Conta teste' }).click()
    await dialog.getByRole('combobox', { name: 'Categoria' }).click()
    await page.getByRole('option', { name: 'Mercado' }).click()
    await dialog.getByRole('button', { name: 'Salvar' }).click()

    await expect(dialog).toBeHidden()
    await expect(page.getByText('Supermercado', { exact: true })).toBeVisible()
  })

  await test.step('mostra o total de despesas no painel', async () => {
    await page.goto('/')
    const expensesCard = page
      .locator('[data-slot="card"]')
      .filter({ hasText: 'Despesas do período' })
    // Intl puts a non-breaking space after "R$"; \s matches it.
    await expect(expensesCard.getByText(/^R\$\s150,00$/)).toBeVisible()
  })
})
