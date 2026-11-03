// pt-BR amounts only: comma for decimals, dots for thousands.
// "12.50" is rejected so it can't be misread as 1250.
const PATTERN = /^(-)?(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d{1,2}))?$/

type ParseOptions = { allowNegative?: boolean; allowZero?: boolean }

export function parseBrlToCents(
  input: string,
  { allowNegative = false, allowZero = false }: ParseOptions = {},
): number | null {
  const match = PATTERN.exec(input.trim())
  if (!match) return null

  const [, sign, reais, centavos = ''] = match
  if (sign && !allowNegative) return null

  const cents =
    Number(reais.replaceAll('.', '')) * 100 + Number(centavos.padEnd(2, '0'))
  const signed = sign ? -cents : cents
  if (signed === 0 && !allowZero) return null

  return signed
}

const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export function formatBrl(cents: number): string {
  return brl.format(cents / 100)
}

// Plain pt-BR text for an input, e.g. -5000 -> "-50,00". parseBrlToCents reads it back.
export function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',')
}
