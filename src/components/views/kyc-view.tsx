'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { FileUpload } from '@/components/shared/file-upload'
import { KycHeader } from '@/components/shared/kyc-header'
import { InfoBox } from '@/components/shared/info-box'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'
import { formatPhone, stripPhone } from '@/lib/phone-format'
import { useAppStore } from '@/lib/store'
import {
  Loader2, ArrowRight, ArrowLeft, AlertCircle, ShieldCheck,
} from 'lucide-react'

interface Props {
  onDone: () => void
}

const PAKISTANI_CITIES = [
  'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan',
  'Peshawar', 'Quetta', 'Hyderabad', 'Sialkot', 'Gujranwala', 'Bahawalpur',
  'Sargodha', 'Sukkur', 'Abbottabad', 'Mardan', 'Other',
]

export function KycView({ onDone }: Props) {
  const { kyc, logout } = useAppStore()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const wasRejected = kyc?.status === 'rejected'

  // Step 1 state
  const [cnicName, setCnicName] = useState(kyc?.cnicName || '')
  const [fatherName, setFatherName] = useState(kyc?.fatherName || '')
  const [dob, setDob] = useState(kyc?.dob || '')
  const [phoneNumber, setPhoneNumber] = useState(kyc?.phoneNumber || '')
  const [cnicFront, setCnicFront] = useState<File | null>(null)
  const [cnicBack, setCnicBack] = useState<File | null>(null)
  const [selfie, setSelfie] = useState<File | null>(null)

  // Step 2 state
  const [education, setEducation] = useState(kyc?.education || '')
  const [maritalStatus, setMaritalStatus] = useState(kyc?.maritalStatus || '')
  const [gender, setGender] = useState(kyc?.gender || '')
  const [city, setCity] = useState(kyc?.city || '')
  const [address, setAddress] = useState(kyc?.address || '')
  const [occupation, setOccupation] = useState(kyc?.occupation || '')
  const [monthlyIncome, setMonthlyIncome] = useState(kyc?.monthlyIncome != null ? String(kyc.monthlyIncome / 100) : '')
  const [employment, setEmployment] = useState(kyc?.employment || '')

  // Step 3 state
  const [referenceName, setReferenceName] = useState(kyc?.referenceName || '')
  const [referencePhone, setReferencePhone] = useState(kyc?.referencePhone || '')
  const [referenceRelation, setReferenceRelation] = useState(kyc?.referenceRelation || '')

  async function submitStep1() {
    if (!cnicName || !fatherName || !dob || !phoneNumber) {
      toast.error('Please fill all identity fields')
      return
    }
    if (!cnicFront || !cnicBack || !selfie) {
      toast.error('Please upload all three images')
      return
    }
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('cnicName', cnicName)
      fd.append('fatherName', fatherName)
      fd.append('dob', dob)
      fd.append('phoneNumber', stripPhone(phoneNumber))
      fd.append('cnicFrontImage', cnicFront)
      fd.append('cnicBackImage', cnicBack)
      fd.append('selfieImage', selfie)
      const res = await fetch('/api/kyc/step1', { method: 'POST', body: fd, credentials: 'same-origin' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Failed to save step 1')
      toast.success('Identity details saved')
      setStep(1)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function submitStep2() {
    if (!education || !maritalStatus || !gender || !city || !address || !occupation || !employment || !monthlyIncome) {
      toast.error('Please complete all fields')
      return
    }
    setLoading(true)
    try {
      await api('/api/kyc/step2', {
        method: 'POST',
        body: JSON.stringify({ education, maritalStatus, gender, city, address, occupation, employment, monthlyIncome: Number(monthlyIncome) }),
      })
      toast.success('Financial details saved')
      setStep(2)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function submitStep3() {
    if (!referenceName || !referencePhone || !referenceRelation) {
      toast.error('Please complete all reference fields')
      return
    }
    setLoading(true)
    try {
      await api('/api/kyc/step3', {
        method: 'POST',
        body: JSON.stringify({ referenceName, referencePhone: stripPhone(referencePhone), referenceRelation }),
      })
      toast.success('KYC submitted for verification!')
      onDone()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const headerTitles = [
    { title: 'Basic Information', subtitle: 'Please enter details as per your CNIC' },
    { title: 'Additional Information', subtitle: 'Help us know you better' },
    { title: 'Reference Information', subtitle: 'Please provide a reference person' },
  ]

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-0 sm:px-4 sm:py-6">
      <KycHeader
        step={step}
        total={3}
        title={headerTitles[step].title}
        subtitle={headerTitles[step].subtitle}
        onBack={step === 0 ? logout : () => setStep(step - 1)}
      />

      {/* Overlapping white card */}
      <div className="-mt-4 rounded-t-3xl bg-background sm:rounded-3xl sm:shadow-lg sm:border sm:border-border/60">
        <div className="p-5 sm:p-7">
          {wasRejected && kyc?.rejectReason && (
            <Alert variant="destructive" className="mb-5 rounded-lg">
              <AlertCircle className="size-4" />
              <AlertTitle>Your previous KYC was rejected</AlertTitle>
              <AlertDescription>{kyc.rejectReason}. Please update your details and resubmit.</AlertDescription>
            </Alert>
          )}

          {/* Section title */}
          <div className="mb-5">
            <h2 className="text-lg font-bold tracking-tight text-foreground">{headerTitles[step].title}</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">{headerTitles[step].subtitle}</p>
          </div>

          {/* STEP 1 */}
          {step === 0 && (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="cnicName" className="text-sm font-medium">Name (as per CNIC)</Label>
                  <Input
                    id="cnicName"
                    className="rounded-lg"
                    value={cnicName}
                    onChange={(e) => setCnicName(e.target.value)}
                    placeholder="Muhammad Ahmed Khan"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fatherName" className="text-sm font-medium">Father&apos;s Name</Label>
                  <Input
                    id="fatherName"
                    className="rounded-lg"
                    value={fatherName}
                    onChange={(e) => setFatherName(e.target.value)}
                    placeholder="Abdul Khan"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dob" className="text-sm font-medium">Date of Birth</Label>
                  <Input
                    id="dob"
                    type="date"
                    className="rounded-lg"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    max={new Date().toISOString().slice(0, 10)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                  <Input
                    id="phone"
                    className="rounded-lg"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(formatPhone(e.target.value))}
                    placeholder="0300-1234567"
                    inputMode="numeric"
                    maxLength={12}
                  />
                </div>
              </div>

              <div className="pt-1">
                <h3 className="text-sm font-semibold text-foreground mb-3">CNIC Images</h3>
                <div className="grid grid-cols-2 gap-3">
                  <FileUpload label="CNIC Front" hint="Front side" onChange={setCnicFront} value={cnicFront} compact />
                  <FileUpload label="CNIC Back" hint="Back side" onChange={setCnicBack} value={cnicBack} compact />
                </div>
                <div className="mt-3">
                  <FileUpload label="Selfie" hint="Clear face photo" onChange={setSelfie} value={selfie} compact />
                </div>
              </div>

              <Button
                onClick={submitStep1}
                disabled={loading}
                className="w-full rounded-lg bg-brand-gradient text-white font-semibold hover:opacity-90"
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : <>Next <ArrowRight className="size-4" /></>}
              </Button>
            </div>
          )}

          {/* STEP 2 */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Education</Label>
                  <Select value={education} onValueChange={setEducation}>
                    <SelectTrigger className="rounded-lg"><SelectValue placeholder="Select education" /></SelectTrigger>
                    <SelectContent>
                      {['Matriculation', 'Intermediate', 'Bachelor\'s', 'Master\'s', 'MPhil / PhD', 'Other'].map((e) => (
                        <SelectItem key={e} value={e}>{e}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Marital Status</Label>
                  <Select value={maritalStatus} onValueChange={setMaritalStatus}>
                    <SelectTrigger className="rounded-lg"><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      {['Single', 'Married', 'Divorced', 'Widowed'].map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Gender</Label>
                <RadioGroup value={gender} onValueChange={setGender} className="flex flex-wrap gap-2 pt-1">
                  {['Male', 'Female', 'Other'].map((g) => (
                    <Label
                      key={g}
                      htmlFor={`g-${g}`}
                      className="cursor-pointer"
                    >
                      <RadioGroupItem id={`g-${g}`} value={g} className="peer sr-only" />
                      <span className="inline-flex min-w-20 items-center justify-center rounded-full border border-input bg-background px-4 py-2 text-sm font-medium transition-colors peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:text-primary">
                        {g}
                      </span>
                    </Label>
                  ))}
                </RadioGroup>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">City</Label>
                  <Select value={city} onValueChange={setCity}>
                    <SelectTrigger className="rounded-lg"><SelectValue placeholder="Select city" /></SelectTrigger>
                    <SelectContent className="max-h-72">
                      {PAKISTANI_CITIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Occupation</Label>
                  <Input
                    id="occupation"
                    className="rounded-lg"
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    placeholder="e.g. Teacher, Driver"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="address" className="text-sm font-medium">Residential Address</Label>
                <Textarea
                  id="address"
                  className="rounded-lg"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="House #, Street, Area, Town"
                  rows={2}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Employment Status</Label>
                  <Select value={employment} onValueChange={setEmployment}>
                    <SelectTrigger className="rounded-lg"><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {['Employed', 'Self-employed', 'Business', 'Student', 'Unemployed'].map((e) => (
                        <SelectItem key={e} value={e}>{e}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="income" className="text-sm font-medium">Monthly Income (PKR)</Label>
                  <Input
                    id="income"
                    type="number"
                    min={0}
                    className="rounded-lg"
                    value={monthlyIncome}
                    onChange={(e) => setMonthlyIncome(e.target.value)}
                    placeholder="e.g. 45000"
                    inputMode="numeric"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <Button
                  variant="outline"
                  onClick={() => setStep(0)}
                  disabled={loading}
                  className="flex-1 rounded-lg"
                >
                  <ArrowLeft className="size-4" /> Back
                </Button>
                <Button
                  onClick={submitStep2}
                  disabled={loading}
                  className="flex-[2] rounded-lg bg-brand-gradient text-white font-semibold hover:opacity-90"
                >
                  {loading ? <Loader2 className="size-4 animate-spin" /> : <>Next <ArrowRight className="size-4" /></>}
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 2 && (
            <div className="space-y-5">
              <InfoBox>
                Provide one person who knows you well. We only contact them if we cannot reach you.
              </InfoBox>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="refName" className="text-sm font-medium">Reference Name</Label>
                  <Input
                    id="refName"
                    className="rounded-lg"
                    value={referenceName}
                    onChange={(e) => setReferenceName(e.target.value)}
                    placeholder="e.g. Bilal Ahmed"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="refPhone" className="text-sm font-medium">Reference Phone</Label>
                  <Input
                    id="refPhone"
                    className="rounded-lg"
                    value={referencePhone}
                    onChange={(e) => setReferencePhone(formatPhone(e.target.value))}
                    placeholder="0300-1234567"
                    inputMode="numeric"
                    maxLength={12}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-sm font-medium">Relation</Label>
                  <Select value={referenceRelation} onValueChange={setReferenceRelation}>
                    <SelectTrigger className="rounded-lg"><SelectValue placeholder="Select relationship" /></SelectTrigger>
                    <SelectContent>
                      {['Father', 'Mother', 'Brother', 'Sister', 'Spouse', 'Friend', 'Colleague', 'Relative', 'Other'].map((r) => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  disabled={loading}
                  className="flex-1 rounded-lg"
                >
                  <ArrowLeft className="size-4" /> Back
                </Button>
                <Button
                  onClick={submitStep3}
                  disabled={loading}
                  className="flex-[2] rounded-lg bg-brand-gradient text-white font-semibold hover:opacity-90"
                >
                  {loading ? <Loader2 className="size-4 animate-spin" /> : <><ShieldCheck className="size-4" /> Submit for Verification</>}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
