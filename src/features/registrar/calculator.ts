import { parseBrlToCents } from '@/lib/money'

// Expressions are plain strings of digits, "," and the operators below, e.g. "75+50×2".
export const OPERATORS = ['+', '−', '×', '÷'] as const
export type Operator = (typeof OPERATORS)[number]
export type Key =
  | Operator
  | ','
  | 'back'
  | 'clear'
  | '0'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'

export type Evaluation =
  { ok: true; cents: number } | { ok: false; error: string }

const MAX_INTEGER_DIGITS = 9

const isOperator = (char: string | undefined): char is Operator =>
  OPERATORS.includes(char as Operator)

// The number being typed: everything after the last operator.
function currentNumber(expression: string): string {
  const parts = expression.split(/[+−×÷]/)
  return parts[parts.length - 1]
}

export function pressKey(expression: string, key: string): string {
  if (key === 'clear') return '0'
  if (key === 'back') return expression.slice(0, -1) || '0'

  if (isOperator(key)) {
    if (!expression) return expression
    // A second operator replaces the first; a dangling comma is dropped.
    return expression.replace(/[+−×÷,]+$/, '') + key
  }

  const number = currentNumber(expression)

  if (key === ',') {
    if (number.includes(',')) return expression
    return expression + (number ? ',' : '0,')
  }

  if (!/^\d$/.test(key)) return expression

  const [integer, decimals] = number.split(',')
  if (decimals !== undefined) {
    return decimals.length >= 2 ? expression : expression + key
  }
  // One leading zero at most: "0" followed by a digit becomes that digit.
  if (integer === '0') return expression.slice(0, -1) + key
  if (integer.length >= MAX_INTEGER_DIGITS) return expression
  return expression + key
}

function toCents(number: string): number | null {
  return parseBrlToCents(number.replace(/,$/, ''), { allowZero: true })
}

// Integer cents throughout, so 0,1 + 0,2 is exactly 0,30. × and ÷ round to the cent.
export function evaluate(expression: string): Evaluation {
  const tokens = expression.replace(/\s/g, '').split(/([+−×÷])/)
  if (tokens.length === 1 && tokens[0] === '') {
    return { ok: false, error: 'Digite um valor.' }
  }

  // Tokens alternate number, operator, number...
  const numbers: number[] = []
  const operators: Operator[] = []
  for (const [index, token] of tokens.entries()) {
    if (index % 2 === 1) {
      operators.push(token as Operator)
      continue
    }
    const cents = toCents(token)
    if (cents === null) return { ok: false, error: 'Expressão incompleta.' }
    numbers.push(cents)
  }

  // First pass: × and ÷. Second pass: + and −.
  const terms = [numbers[0]]
  const additive: Operator[] = []
  for (const [index, operator] of operators.entries()) {
    const right = numbers[index + 1]
    if (operator === '×' || operator === '÷') {
      const left = terms.pop()!
      if (operator === '÷' && right === 0) {
        return { ok: false, error: 'Não é possível dividir por zero.' }
      }
      terms.push(
        operator === '×'
          ? Math.round((left * right) / 100)
          : Math.round((left * 100) / right),
      )
    } else {
      additive.push(operator)
      terms.push(right)
    }
  }

  const cents = additive.reduce(
    (total, operator, index) =>
      operator === '+' ? total + terms[index + 1] : total - terms[index + 1],
    terms[0],
  )
  return { ok: true, cents }
}
