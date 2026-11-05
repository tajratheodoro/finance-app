import type { AccountType } from '@/generated/prisma/client'
import { getBrandStyle, typeLabels } from '@/features/accounts/brands'
import { formatBrl } from '@/lib/money'
import { cn } from '@/lib/utils'

export type AccountCardData = {
  name: string
  type: AccountType
  institution: string | null
  balanceCents: number
}

// Card proportions follow a real bank card (85.6 x 54 mm). No card number on purpose.
export function AccountCard({
  account,
  className,
}: {
  account: AccountCardData
  className?: string
}) {
  const style = getBrandStyle(account.institution, account.type)

  return (
    <span
      className={cn(
        'flex aspect-[1.586] w-full flex-col justify-between rounded-3xl p-5 text-left',
        style.surface,
        className,
      )}
    >
      <span className="flex items-start justify-between gap-3">
        {style.wordmark ? (
          <span className={cn('truncate leading-none', style.wordmarkClass)}>
            {style.wordmark}
          </span>
        ) : (
          <span />
        )}
        <span className={cn('shrink-0 text-sm', style.muted)}>
          {typeLabels[account.type]}
        </span>
      </span>

      <span
        aria-hidden="true"
        className={cn('h-7 w-10 rounded-md', style.chip)}
      />

      <span className="flex min-w-0 flex-col gap-1">
        <span className={cn('truncate text-sm', style.muted)}>
          {account.name}
        </span>
        <span className="truncate text-2xl font-semibold tabular-nums">
          {formatBrl(account.balanceCents)}
        </span>
      </span>
    </span>
  )
}
