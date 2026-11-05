import { expect, test } from '@playwright/test'

// Independent of happy-path.spec.ts: creates its own account and income category.
test('registrar um depósito pela calculadora e vê-lo na lista', async ({
  page,
}) => {
  await test.step('cria a conta do depósito', async () => {
    await page.goto('/accounts')
    await page.getByRole('button', { name: 'Nova conta' }).click()

    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('Nome').fill('Carteira depósito')
    await dialog.getByRole('combobox', { name: 'Tipo' }).click()
    await page.getByRole('option', { name: 'Carteira' }).click()
    await dialog.getByRole('button', { name: 'Salvar' }).click()

    await expect(dialog).toBeHidden()
  })

  await test.step('cria a categoria de receita', async () => {
    await page.goto('/categories')
    await page.getByRole('button', { name: 'Nova categoria' }).click()

    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('Nome').fill('Depósitos')
    await dialog.getByRole('combobox', { name: 'Tipo' }).click()
    await page.getByRole('option', { name: 'Receita' }).click()
    await dialog.getByRole('button', { name: 'Salvar' }).click()

    await expect(dialog).toBeHidden()
  })

  await test.step('registra R$ 125,00 de depósito pelo teclado', async () => {
    await page.goto('/registrar')
    // The radio input is visually hidden; click the visible label text instead.
    await page.getByText('Depósito', { exact: true }).first().click()

    await page.getByRole('button', { name: '7', exact: true }).click()
    await page.getByRole('button', { name: '5', exact: true }).click()
    await page.getByRole('button', { name: 'Somar', exact: true }).click()
    await page.getByRole('button', { name: '5', exact: true }).click()
    await page.getByRole('button', { name: '0', exact: true }).click()
    await page.getByRole('button', { name: 'Calcular', exact: true }).click()

    await page.getByRole('button', { name: /Carteira depósito/ }).click()
    await page.getByRole('combobox', { name: 'Categoria' }).click()
    await page.getByRole('option', { name: 'Depósitos' }).click()
    await page.getByRole('button', { name: 'Salvar registro' }).click()

    // Intl puts a non-breaking space after "R$"; \s matches it.
    await expect(
      page.getByText(
        /Registro salvo: Depósito de R\$\s125,00 em Carteira depósito/,
      ),
    ).toBeVisible()
  })

  await test.step('o depósito aparece na lista de transações', async () => {
    await page.goto('/transactions')
    await expect(
      page.getByText('Depósito', { exact: true }).first(),
    ).toBeVisible()
  })
})
