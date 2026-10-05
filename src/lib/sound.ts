'use client'

// Play a notification sound using Web Audio API (no external file needed)
let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    } catch {
      return null
    }
  }
  return audioCtx
}

// Play a short pleasant notification beep
export function playNotificationSound() {
  const ctx = getAudioContext()
  if (!ctx) return

  try {
    // Resume context if suspended (browser autoplay policy)
    if (ctx.state === 'suspended') ctx.resume()

    const now = ctx.currentTime

    // Two-tone ascending beep (C5 → E5)
    const notes = [
      { freq: 523.25, start: 0, duration: 0.12 },    // C5
      { freq: 659.25, start: 0.10, duration: 0.15 },  // E5
    ]

    for (const note of notes) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.value = note.freq

      gain.gain.setValueAtTime(0, now + note.start)
      gain.gain.linearRampToValueAtTime(0.3, now + note.start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, now + note.start + note.duration)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now + note.start)
      osc.stop(now + note.start + note.duration)
    }
  } catch {
    // ignore audio errors
  }
}

// Play a success sound (three-tone ascending: C5 → E5 → G5)
export function playSuccessSound() {
  const ctx = getAudioContext()
  if (!ctx) return

  try {
    if (ctx.state === 'suspended') ctx.resume()

    const now = ctx.currentTime
    const notes = [
      { freq: 523.25, start: 0, duration: 0.10 },    // C5
      { freq: 659.25, start: 0.08, duration: 0.10 },  // E5
      { freq: 783.99, start: 0.16, duration: 0.18 },  // G5
    ]

    for (const note of notes) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.value = note.freq

      gain.gain.setValueAtTime(0, now + note.start)
      gain.gain.linearRampToValueAtTime(0.25, now + note.start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, now + note.start + note.duration)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now + note.start)
      osc.stop(now + note.start + note.duration)
    }
  } catch {
    // ignore
  }
}
