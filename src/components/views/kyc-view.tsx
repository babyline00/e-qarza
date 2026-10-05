'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Stepper } from '@/components/shared/stepper'
import { FileUpload } from '@/components/shared/file-upload'
import { PageHeader } from '@/components/shared/page-header'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'
import { useAppStore } from '@/lib/store'
import {
  Loader2, ArrowRight, ArrowLeft, UserRound, Briefcase, Users, AlertCircle, ShieldCheck,
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
  const { kyc } = useAppStore()
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

  const steps = ['Identity', 'Financial', 'References']

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
      fd.append('phoneNumber', phoneNumber)
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
        body: JSON.stringify({ referenceName, referencePhone, referenceRelation }),
      })
      toast.success('KYC submitted for verification!')
      onDone()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <PageHeader
        title={wasRejected ? 'Update your KYC' : 'Complete your KYC'}
        description="Verify your identity to unlock loan applications. Your information is encrypted and secure."
        icon={ShieldCheck}
      />

      {wasRejected && kyc?.rejectReason && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="size-4" />
          <AlertTitle>Your previous KYC was rejected</AlertTitle>
          <AlertDescription>{kyc.rejectReason}. Please update your details and resubmit.</AlertDescription>
        </Alert>
      )}

      <div className="mt-6 mb-8">
        <Stepper steps={steps} current={step} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            {step === 0 && <><UserRound className="size-5" /> Identity & Documents</>}
            {step === 1 && <><Briefcase className="size-5" /> Financial & Employment</>}
            {step === 2 && <><Users className="size-5" /> Personal References</>}
          </CardTitle>
          <CardDescription>
            {step === 0 && 'Enter the exact name printed on your CNIC and upload clear photos.'}
            {step === 1 && 'Tell us about your work and income so we can assess your loan eligibility.'}
            {step === 2 && 'Provide a reference we can contact if needed.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* STEP 1 */}
          {step === 0 && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="cnicName">Name (as on CNIC)</Label>
                  <Input id="cnicName" value={cnicName} onChange={(e) => setCnicName(e.target.value)} placeholder="Muhammad Ahmed Khan" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fatherName">Father / Husband Name</Label>
                  <Input id="fatherName" value={fatherName} onChange={(e) => setFatherName(e.target.value)} placeholder="Abdul Khan" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input id="dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} max={new Date().toISOString().slice(0, 10)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="03001234567" inputMode="numeric" maxLength={11} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3 pt-2">
                <FileUpload label="CNIC Front" hint="Front side photo" onChange={setCnicFront} value={cnicFront} />
                <FileUpload label="CNIC Back" hint="Back side photo" onChange={setCnicBack} value={cnicBack} />
                <FileUpload label="Selfie" hint="Clear face photo" onChange={setSelfie} value={selfie} />
              </div>

              <div className="flex justify-end pt-2">
                <Button onClick={submitStep1} disabled={loading}>
                  {loading ? <Loader2 className="size-4 animate-spin" /> : <>Continue <ArrowRight className="size-4" /></>}
                </Button>
              </div>
            </>
          )}

          {/* STEP 2 */}
          {step === 1 && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Education</Label>
                  <Select value={education} onValueChange={setEducation}>
                    <SelectTrigger><SelectValue placeholder="Select education" /></SelectTrigger>
                    <SelectContent>
                      {['Matriculation', 'Intermediate', 'Bachelor\'s', 'Master\'s', 'MPhil / PhD', 'Other'].map((e) => (
                        <SelectItem key={e} value={e}>{e}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Marital Status</Label>
                  <Select value={maritalStatus} onValueChange={setMaritalStatus}>
                    <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                    <SelectContent>
                      {['Single', 'Married', 'Divorced', 'Widowed'].map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Gender</Label>
                  <RadioGroup value={gender} onValueChange={setGender} className="flex gap-4 pt-2">
                    {['Male', 'Female', 'Other'].map((g) => (
                      <div key={g} className="flex items-center gap-2">
                        <RadioGroupItem id={`g-${g}`} value={g} />
                        <Label htmlFor={`g-${g}`} className="font-normal cursor-pointer">{g}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
                <div className="space-y-1.5">
                  <Label>City</Label>
                  <Select value={city} onValueChange={setCity}>
                    <SelectTrigger><SelectValue placeholder="Select city" /></SelectTrigger>
                    <SelectContent className="max-h-72">
                      {PAKISTANI_CITIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="address">Residential Address</Label>
                  <Textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="House #, Street, Area, Town" rows={2} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="occupation">Occupation</Label>
                  <Input id="occupation" value={occupation} onChange={(e) => setOccupation(e.target.value)} placeholder="e.g. Teacher, Driver, Shopkeeper" />
                </div>
                <div className="space-y-1.5">
                  <Label>Employment Type</Label>
                  <Select value={employment} onValueChange={setEmployment}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {['Employed', 'Self-employed', 'Business', 'Student', 'Unemployed'].map((e) => (
                        <SelectItem key={e} value={e}>{e}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="income">Monthly Income (Rs)</Label>
                  <Input id="income" type="number" min={0} value={monthlyIncome} onChange={(e) => setMonthlyIncome(e.target.value)} placeholder="e.g. 45000" inputMode="numeric" />
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setStep(0)} disabled={loading}>
                  <ArrowLeft className="size-4" /> Back
                </Button>
                <Button onClick={submitStep2} disabled={loading}>
                  {loading ? <Loader2 className="size-4 animate-spin" /> : <>Continue <ArrowRight className="size-4" /></>}
                </Button>
              </div>
            </>
          )}

          {/* STEP 3 */}
          {step === 2 && (
            <>
              <Alert>
                <Users className="size-4" />
                <AlertTitle>Reference contact</AlertTitle>
                <AlertDescription>
                  Provide one person who knows you well. We only contact them if we cannot reach you.
                </AlertDescription>
              </Alert>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="refName">Reference Name</Label>
                  <Input id="refName" value={referenceName} onChange={(e) => setReferenceName(e.target.value)} placeholder="e.g. Bilal Ahmed" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="refPhone">Reference Phone</Label>
                  <Input id="refPhone" value={referencePhone} onChange={(e) => setReferencePhone(e.target.value)} placeholder="03001234567" inputMode="numeric" maxLength={11} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="refRel">Relationship</Label>
                  <Select value={referenceRelation} onValueChange={setReferenceRelation}>
                    <SelectTrigger><SelectValue placeholder="Select relationship" /></SelectTrigger>
                    <SelectContent>
                      {['Father', 'Mother', 'Brother', 'Sister', 'Spouse', 'Friend', 'Colleague', 'Relative', 'Other'].map((r) => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setStep(1)} disabled={loading}>
                  <ArrowLeft className="size-4" /> Back
                </Button>
                <Button onClick={submitStep3} disabled={loading}>
                  {loading ? <Loader2 className="size-4 animate-spin" /> : <>Submit for Verification <ShieldCheck className="size-4" /></>}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
