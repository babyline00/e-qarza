// Phone formatting: 03001234567 → 0300-1234567
export function formatPhone(value: string): string {
  const digits = value.replace(/[^0-9]/g, '')
  if (digits.length <= 4) return digits
  return `${digits.slice(0, 4)}-${digits.slice(4, 11)}`
}

// Strip formatting: 0300-1234567 → 03001234567
export function stripPhone(value: string): string {
  return value.replace(/[^0-9]/g, '')
}

// Validate: must be 11 digits starting with 03
export function isValidPhone(value: string): boolean {
  const digits = stripPhone(value)
  return /^03\d{9}$/.test(digits)
}

// CNIC formatting: 3520212345671 → 35202-1234567-1
export function formatCNIC(value: string): string {
  const digits = value.replace(/[^0-9]/g, '')
  if (digits.length <= 5) return digits
  if (digits.length <= 12) return `${digits.slice(0, 5)}-${digits.slice(5)}`
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12, 13)}`
}

// Strip CNIC formatting
export function stripCNIC(value: string): string {
  return value.replace(/[^0-9]/g, '')
}

// Validate CNIC: must be 13 digits
export function isValidCNIC(value: string): boolean {
  const digits = stripCNIC(value)
  return /^\d{13}$/.test(digits)
}

// Format phone for display: 03001234567 → 0300-1234567
export function displayPhone(phone: string): string {
  return formatPhone(phone)
}
