export type Period = { year: number; month: number; from: Date; to: Date }

const MONTH_PATTERN = /^(\d{4})-(\d{2})$/

// Half-open range: `from` is inclusive, `to` is exclusive. monthIndex may be out of range
// (e.g. -1 is December of the previous year); Date.UTC normalizes it.
export function periodOf(year: number, monthIndex: number): Period {
  const from = new Date(Date.UTC(year, monthIndex, 1))
  const to = new Date(Date.UTC(year, monthIndex + 1, 1))
  return {
    year: from.getUTCFullYear(),
    month: from.getUTCMonth() + 1,
    from,
    to,
  }
}

export function parsePeriod(
  month: string | undefined,
  now: Date = new Date(),
): Period {
  const match = MONTH_PATTERN.exec(month ?? '')
  const monthNumber = Number(match?.[2])
  if (!match || monthNumber < 1 || monthNumber > 12) {
    return periodOf(now.getUTCFullYear(), now.getUTCMonth())
  }
  return periodOf(Number(match[1]), monthNumber - 1)
}
