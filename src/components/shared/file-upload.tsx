'use client'

import { useRef, useState, useCallback } from 'react'
import { Camera, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  label: string
  hint?: string
  onChange: (file: File | null) => void
  value?: File | null
  preview?: string
  compact?: boolean
}

export function FileUpload({ label, hint, onChange, value, preview, compact }: FileUploadProps) {
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
          'relative cursor-pointer rounded-xl border-2 border-dashed transition-colors flex flex-col items-center justify-center text-center bg-muted/40 hover:bg-accent/60',
          drag ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
          value && 'border-primary/40',
          compact ? 'min-h-28 p-3' : 'min-h-36 p-4'
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
            <img src={shown} alt={label} className={cn('mx-auto rounded-lg object-contain', compact ? 'max-h-24' : 'max-h-32')} />
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
            <span className="grid size-10 place-items-center rounded-full bg-primary/10 text-primary mb-2">
              <Camera className="size-5" />
            </span>
            <p className="text-sm font-medium">Tap to upload</p>
            <p className="text-xs text-muted-foreground mt-0.5">{hint || 'JPG, PNG, WEBP — max 5MB'}</p>
          </>
        )}
      </div>
    </div>
  )
}
