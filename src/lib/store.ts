'use client'

import { create } from 'zustand'

export type View =
  | 'auth'
  | 'kyc'
  | 'kyc_pending'
  | 'loan_select'
  | 'fee_payment'
  | 'fee_pending'
  | 'active'
  | 'dashboard'
  | 'profile'
  | 'my_loans'
  | 'notifications'
  | 'help'
  | 'transactions'

export interface KycData {
  status: string
  cnicName?: string | null
  fatherName?: string | null
  dob?: string | null
  phoneNumber?: string | null
  education?: string | null
  maritalStatus?: string | null
  gender?: string | null
  city?: string | null
  address?: string | null
  occupation?: string | null
  monthlyIncome?: number | null
  employment?: string | null
  referenceName?: string | null
  referencePhone?: string | null
  referenceRelation?: string | null
  rejectReason?: string | null
}

export interface AppData {
  id: string
  planName: string
  amount: number
  interestRate: number
  tenureMonths: number
  processingFee: number
  status: string
  rejectReason?: string | null
  appliedAt: string
  activatedAt?: string | null
  installments: {
    id: string
    number: number
    dueDate: string
    amount: number
    status: string
    paidAt?: string | null
    paymentId?: string | null
  }[]
  feePayment?: {
    id: string
    type: string
    amount: number
    status: string
    txnRef: string | null
    proofPath: string | null
    createdAt: string
  } | null
}

export interface NotificationData {
  id: string
  title: string
  message: string
  type: string
  channel?: string
  deliveryStatus?: string
  read: boolean
  createdAt: string
}

export interface BankDetailData {
  id: string
  bankName: string
  accountTitle: string
  accountNumber: string
  iban: string
}

export interface LoanPlanData {
  id: string
  name: string
  amount: number
  interestRate: number
  tenureMonths: number
  processingFee: number
  description?: string | null
}

export interface UserData {
  id: string
  email: string
  name: string | null
  phone: string | null
  role: string
  stage: string
  avatarPath?: string | null
  kyc?: KycData | null
}

interface AppState {
  user: UserData | null
  kyc: KycData | null
  applications: AppData[]
  notifications: NotificationData[]
  bankDetails: BankDetailData[]
  plans: LoanPlanData[]
  activeView: View
  loading: boolean

  setUser: (u: UserData | null) => void
  setKyc: (k: KycData | null) => void
  setApplications: (a: AppData[]) => void
  setNotifications: (n: NotificationData[]) => void
  setBankDetails: (b: BankDetailData[]) => void
  setPlans: (p: LoanPlanData[]) => void
  setView: (v: View) => void
  setLoading: (l: boolean) => void
  logout: () => void
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  kyc: null,
  applications: [],
  notifications: [],
  bankDetails: [],
  plans: [],
  activeView: 'auth',
  loading: true,

  setUser: (u) => set({ user: u }),
  setKyc: (k) => set({ kyc: k }),
  setApplications: (a) => set({ applications: a }),
  setNotifications: (n) => set({ notifications: n }),
  setBankDetails: (b) => set({ bankDetails: b }),
  setPlans: (p) => set({ plans: p }),
  setView: (v) => set({ activeView: v }),
  setLoading: (l) => set({ loading: l }),
  logout: () =>
    set({
      user: null,
      kyc: null,
      applications: [],
      notifications: [],
      bankDetails: [],
      plans: [],
      activeView: 'auth',
      loading: false,
    }),
}))
