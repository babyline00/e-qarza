'use client'

import { useState, useRef } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'
import { Camera, Loader2 } from 'lucide-react'

interface Props {
  size?: 'sm' | 'md' | 'lg'
  onUploaded?: () => void
}

export function AvatarUpload({ size = 'lg', onUploaded }: Props) {
  const { user } = useAppStore()
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  if (!user) return null

  const sizeCls = size === 'lg' ? 'size-20' : size === 'md' ? 'size-16' : 'size-10'
  const iconCls = size === 'lg' ? 'size-7' : 'size-5'
  const initials = (user.name || user.email).slice(0, 2).toUpperCase()
  const shown = preview || user.avatarPath

  async function handleFile(file: File | null) {
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image too large (max 2MB)')
      return
    }
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Only JPG, PNG, WEBP allowed')
      return
    }
    setPreview(URL.createObjectURL(file))
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('avatar', file)
      const res = await fetch('/api/auth/avatar', { method: 'POST', body: fd, credentials: 'same-origin' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Upload failed')
      toast.success('Profile photo updated')
      onUploaded?.()
    } catch (err) {
      toast.error((err as Error).message)
      setPreview(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="group relative block"
        title="Change profile photo"
      >
        <Avatar className={`${sizeCls} border-2 border-white/40 shadow-md`}>
          {shown ? <AvatarImage src={shown} alt={user.name || 'Avatar'} /> : null}
          <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
        {/* camera overlay */}
        <span className="absolute inset-0 grid place-items-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
          {loading ? <Loader2 className={`${iconCls} animate-spin text-white`} /> : <Camera className={`${iconCls} text-white`} />}
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0] || null)}
      />
    </div>
  )
}
