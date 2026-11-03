'use client'

import { useState, useTransition } from 'react'
import { Trash2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { deleteTransaction } from '../actions'

export function DeleteTransactionButton({
  id,
  description,
}: {
  id: string
  description: string
}) {
  const [error, setError] = useState<string>()
  const [pending, startTransition] = useTransition()

  function handleDelete() {
    if (!window.confirm(`Excluir a transação "${description}"?`)) return

    setError(undefined)
    startTransition(async () => {
      const result = await deleteTransaction(id)
      if (!result.ok) setError(result.error)
    })
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="destructive"
        size="sm"
        onClick={handleDelete}
        disabled={pending}
      >
        <Trash2Icon data-icon="inline-start" />
        Excluir
      </Button>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
