'use client'

import { useState, useTransition } from 'react'
import { Trash2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { deleteTransaction } from '../actions'

export function DeleteTransactionButton({
  id,
  description,
}: {
  id: string
  description: string
}) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string>()
  const [pending, startTransition] = useTransition()

  function handleDelete() {
    setError(undefined)
    startTransition(async () => {
      const result = await deleteTransaction(id)
      if (result.ok) setOpen(false)
      else setError(result.error)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="destructive"
            size="sm"
            className="min-h-11 rounded-full px-4 sm:min-h-8"
          />
        }
      >
        <Trash2Icon data-icon="inline-start" />
        Excluir
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Excluir transação</DialogTitle>
          <DialogDescription>
            Excluir &ldquo;{description}&rdquo;? Essa ação não pode ser
            desfeita.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <DialogClose
            render={
              <Button variant="outline" className="min-h-11 rounded-full" />
            }
          >
            Cancelar
          </DialogClose>
          <Button
            variant="destructive"
            className="min-h-11 rounded-full"
            onClick={handleDelete}
            disabled={pending}
          >
            {pending ? 'Excluindo...' : 'Excluir'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
