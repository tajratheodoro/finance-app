export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> }

const GENERIC_ERROR = 'Algo deu errado. Tente novamente.'

// Maps known Prisma error codes to user-facing messages. Anything else is logged.
export function fromError(
  err: unknown,
  known: Record<string, string>,
): ActionResult<never> {
  const code =
    typeof err === 'object' && err !== null && 'code' in err
      ? String(err.code)
      : undefined
  if (code && known[code]) return { ok: false, error: known[code] }

  console.error(err)
  return { ok: false, error: GENERIC_ERROR }
}
