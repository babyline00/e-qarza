'use client'

import { useRef, useState, useCallback } from 'react'
import { UploadCloud, X, ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  label: string
  hint?: string
  onChange: (file: File | null) => void
  value?: File | null
  preview?: string
}

export function FileUpload({ label, hint, onChange, value, preview }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)
  const [localPreview, setLocalPreview] = useState<string | null>(null)

  const handleFile = useCallback(
    (file: File | null) => {
      onChange(file)
      if (file) {
        const url = URL.createObjectURL(file)
        setLocalPreview(url)
      } else {
        setLocalPreview(null)
      }
    },
    [onChange]
  )

  const shown = localPreview || preview

  return (
    <div>
      <label className="text-sm font-medium mb-1.5 block">{label}</label>
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDrag(true)
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDrag(false)
          const f = e.dataTransfer.files?.[0]
          if (f) handleFile(f)
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'relative cursor-pointer rounded-lg border-2 border-dashed p-4 transition-colors flex flex-col items-center justify-center text-center min-h-32',
          drag ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/50',
          value && 'border-primary/40'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] || null)}
        />
        {shown ? (
          <div className="relative w-full">
            <img src={shown} alt={label} className="mx-auto max-h-32 rounded-md object-contain" />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleFile(null)
                if (inputRef.current) inputRef.current.value = ''
              }}
              className="absolute -top-2 -right-2 grid size-6 place-items-center rounded-full bg-destructive text-white shadow"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ) : (
          <>
            <UploadCloud className="size-7 text-muted-foreground mb-2" />
            <p className="text-sm font-medium">Click or drag to upload</p>
            <p className="text-xs text-muted-foreground mt-1">{hint || 'JPG, PNG, WEBP — max 5MB'}</p>
          </>
        )}
      </div>
      {value && (
        <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
          <ImageIcon className="size-3" /> {value.name}
        </p>
      )}
    </div>
  )
}
