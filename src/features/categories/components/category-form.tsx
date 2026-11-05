'use client'

import { useId, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createCategory, updateCategory } from '@/features/categories/actions'
import {
  categorySchema,
  type CategoryInput,
} from '@/features/categories/schemas'

const TYPE_ITEMS = [
  { label: 'Receita', value: 'INCOME' },
  { label: 'Despesa', value: 'EXPENSE' },
]

type CategoryFormProps = {
  category?: {
    id: string
    name: string
    type: CategoryInput['type']
    color: string
  }
  // Set when the category has transactions. Disables the type select.
  typeLocked?: boolean
}

export function CategoryForm({
  category,
  typeLocked = false,
}: CategoryFormProps) {
  const [open, setOpen] = useState(false)
  const isEdit = category !== undefined

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          category ? (
            <Button
              variant="ghost"
              size="icon"
              className="size-11"
              aria-label={`Editar ${category.name}`}
            />
          ) : (
            <Button className="h-11 rounded-full px-5" />
          )
        }
      >
        {category ? <Pencil /> : 'Nova categoria'}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Editar categoria' : 'Nova categoria'}
          </DialogTitle>
        </DialogHeader>
        <CategoryFormBody
          category={category}
          typeLocked={typeLocked}
          onDone={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}

// Separate component so useForm starts fresh each time the dialog opens.
function CategoryFormBody({
  category,
  typeLocked,
  onDone,
}: CategoryFormProps & { onDone: () => void }) {
  const id = useId()
  const [formError, setFormError] = useState<string>()
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name ?? '',
      type: category?.type ?? 'EXPENSE',
      color: category?.color ?? '#64748b',
    },
  })

  async function onSubmit(values: CategoryInput) {
    setFormError(undefined)
    const result = category
      ? await updateCategory(category.id, values)
      : await createCategory(values)

    if (result.ok) {
      onDone()
      return
    }

    setFormError(result.error)
    for (const [field, messages] of Object.entries(result.fieldErrors ?? {})) {
      if (messages[0])
        setError(field as keyof CategoryInput, { message: messages[0] })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {formError && (
        <p role="alert" className="text-sm text-destructive">
          {formError}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor={`${id}-name`}>Nome</Label>
        <Input
          id={`${id}-name`}
          className="h-11"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? `${id}-name-error` : undefined}
          {...register('name')}
        />
        {errors.name && (
          <p id={`${id}-name-error`} className="text-sm text-destructive">
            {errors.name.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`${id}-type`}>Tipo</Label>
        <Controller
          name="type"
          control={control}
          render={({ field }) => (
            <Select
              items={TYPE_ITEMS}
              value={field.value}
              disabled={typeLocked}
              onValueChange={(value) => {
                if (value === 'INCOME' || value === 'EXPENSE')
                  field.onChange(value)
              }}
            >
              <SelectTrigger
                id={`${id}-type`}
                aria-invalid={!!errors.type}
                aria-describedby={typeLocked ? `${id}-type-hint` : undefined}
                className="h-11 w-full"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {TYPE_ITEMS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          )}
        />
        {typeLocked && (
          <p id={`${id}-type-hint`} className="text-sm text-muted-foreground">
            O tipo não pode mudar porque esta categoria já tem transações.
          </p>
        )}
        {errors.type && (
          <p className="text-sm text-destructive">{errors.type.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`${id}-color`}>Cor</Label>
        <Input
          id={`${id}-color`}
          type="color"
          className="h-11 w-16 p-1"
          aria-invalid={!!errors.color}
          aria-describedby={errors.color ? `${id}-color-error` : undefined}
          {...register('color')}
        />
        {errors.color && (
          <p id={`${id}-color-error`} className="text-sm text-destructive">
            {errors.color.message}
          </p>
        )}
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <DialogClose render={<Button variant="outline" className="h-11" />}>
          Cancelar
        </DialogClose>
        <Button type="submit" className="h-11" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </form>
  )
}
