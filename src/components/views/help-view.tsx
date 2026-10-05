'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'
import {
  LifeBuoy, MessageSquare, Mail, Phone, Clock, MapPin, ChevronDown, Loader2, Send, CheckCircle2,
} from 'lucide-react'

const FAQS = [
  {
    q: 'How long does KYC verification take?',
    a: 'KYC is usually reviewed within a few minutes during business hours. You will receive a notification as soon as it is approved or rejected. If rejected, you can update your details and resubmit.',
  },
  {
    q: 'Why do I need to pay a processing fee?',
    a: 'The one-time processing fee covers account setup and bank verification. It is required before your loan is activated. The fee depends on the plan you selected and is non-refundable.',
  },
  {
    q: 'How are installments calculated?',
    a: 'Interest is charged on a flat annual basis over your tenure. Monthly installment = (principal + total interest) ÷ tenure months. You can see the exact breakdown on your loan agreement.',
  },
  {
    q: 'What happens if I miss a payment?',
    a: 'Installments past their due date are automatically marked as overdue. This may affect your ability to apply for future loans. Please pay overdue installments as soon as possible.',
  },
  {
    q: 'Can I pay off my loan early?',
    a: 'Yes! Use the "Settle Early" button on your dashboard. You will receive a 50% rebate on the remaining interest portion, saving you money.',
  },
  {
    q: 'How do I upload payment proof?',
    a: 'After transferring to our bank account (shown on the payment screen), take a clear screenshot showing the amount, date, and transaction reference. Upload it along with the reference number.',
  },
  {
    q: 'Is my data secure?',
    a: 'Yes. We use bank-grade encryption for all data. Your CNIC images and personal information are stored securely and only used for verification. We never share your data with third parties.',
  },
  {
    q: 'What payment methods are accepted?',
    a: 'Currently we accept bank transfers to our designated account. JazzCash, EasyPaisa, and other mobile wallet options are coming soon.',
  },
]

export function HelpView() {
  const [subject, setSubject] = useState('')
  const [category, setCategory] = useState('general')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!subject.trim() || !message.trim()) {
      toast.error('Please fill in subject and message')
      return
    }
    setLoading(true)
    try {
      await api('/api/support', {
        method: 'POST',
        body: JSON.stringify({ subject, category, message }),
      })
      toast.success('Support ticket submitted! We will get back to you.')
      setSubject('')
      setMessage('')
      setSent(true)
      setTimeout(() => setSent(false), 5000)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-xl bg-brand-gradient text-white shadow-sm">
          <LifeBuoy className="size-6" />
        </span>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Help & Support</h1>
          <p className="text-sm text-muted-foreground">Find answers or reach out to our team.</p>
        </div>
      </div>

      {/* Contact cards */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Card className="rounded-2xl">
          <CardContent className="p-4 flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary shrink-0"><Mail className="size-5" /></span>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-sm font-medium truncate">help@e-qarza.pk</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-4 flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary shrink-0"><Phone className="size-5" /></span>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Phone</p>
              <p className="text-sm font-medium truncate">021-111-327-892</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="p-4 flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary shrink-0"><Clock className="size-5" /></span>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Hours</p>
              <p className="text-sm font-medium truncate">9am–8pm, Mon–Sat</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FAQs */}
      <Card className="mt-5 rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base"><ChevronDown className="size-4 text-primary" /> Frequently Asked Questions</CardTitle>
          <CardDescription>Quick answers to common questions.</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {FAQS.map((f, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-sm font-medium hover:no-underline py-3.5">{f.q}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Contact form */}
      <Card className="mt-5 rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base"><MessageSquare className="size-4 text-primary" /> Contact Support</CardTitle>
          <CardDescription>Can’t find an answer? Send us a message.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="cat">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="cat"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General inquiry</SelectItem>
                    <SelectItem value="kyc">KYC / Verification</SelectItem>
                    <SelectItem value="loan">Loan application</SelectItem>
                    <SelectItem value="payment">Payment issue</SelectItem>
                    <SelectItem value="account">Account / Login</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="subj">Subject</Label>
                <Input id="subj" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Brief summary" maxLength={120} required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="msg">Message</Label>
              <Textarea id="msg" value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="Describe your issue in detail…" maxLength={2000} required />
              <p className="text-xs text-muted-foreground text-right">{message.length}/2000</p>
            </div>
            <Button type="submit" className="w-full bg-brand-gradient text-white hover:opacity-90" disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : sent ? <><CheckCircle2 className="size-4" /> Sent</> : <><Send className="size-4" /> Send Message</>}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="mt-4 flex items-start gap-2 rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
        <MapPin className="size-4 shrink-0 mt-0.5" />
        <p>E-Qarza Pvt Ltd, Plot 12, I.I. Chundrigar Road, Karachi, Pakistan. This is a demonstration app — support responses are not monitored in real time.</p>
      </div>
    </div>
  )
}
