'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { deleteCategory } from '@/features/categories/actions'

type DeleteCategoryButtonProps = {
  id: string
  name: string
}

export function DeleteCategoryButton({ id, name }: DeleteCategoryButtonProps) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string>()
  const [isPending, startTransition] = useTransition()

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) setError(undefined)
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteCategory(id)
      if (result.ok) {
        setOpen(false)
        return
      }
      setError(result.error)
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="sm" className="text-destructive" />
        }
      >
        Excluir
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir categoria</DialogTitle>
          <DialogDescription>
            Tem certeza que quer excluir {name}? Esta ação não pode ser
            desfeita.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Cancelar
          </DialogClose>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            Excluir categoria
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
