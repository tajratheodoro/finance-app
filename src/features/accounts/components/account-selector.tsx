'use client'

import { Check } from 'lucide-react'
import {
  AccountCard,
  type AccountCardData,
} from '@/features/accounts/components/account-card'
import { cn } from '@/lib/utils'

type SelectorAccount = AccountCardData & { id: string }

// Shared with /registrar: keep the props ({ accounts, value, onChange }) stable.
export function AccountSelector({
  accounts,
  value,
  onChange,
}: {
  accounts: SelectorAccount[]
  value: string | null | undefined
  onChange: (id: string) => void
}) {
  return (
    <div
      role="group"
      aria-label="Escolha a conta"
      className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 py-2 sm:flex-wrap sm:overflow-visible"
    >
      {accounts.map((account) => {
        const selected = account.id === value
        return (
          <button
            key={account.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(account.id)}
            className={cn(
              'relative w-56 shrink-0 snap-start rounded-3xl outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring',
              selected &&
                'ring-2 ring-ring ring-offset-2 ring-offset-background',
            )}
          >
            <AccountCard account={account} />
            {selected && (
              <span className="absolute top-1/2 right-5 flex -translate-y-1/2 size-6 items-center justify-center rounded-full bg-background text-foreground">
                <Check aria-hidden="true" className="size-4" />
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
