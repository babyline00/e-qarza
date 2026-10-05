// Seed script: run with `bun run db:seed`
// Creates default loan plans, a bank detail, and an admin account.
import { db } from '../src/lib/db'
import { hashPassword } from '../src/lib/auth'

async function main() {
  // admin
  const existingAdmin = await db.user.findUnique({ where: { email: 'admin@loan.pk' } })
  if (!existingAdmin) {
    await db.user.create({
      data: {
        email: 'admin@loan.pk',
        name: 'Admin',
        role: 'admin',
        stage: 'active',
        passwordHash: hashPassword('admin123'),
      },
    })
    console.log('Created admin: admin@loan.pk / admin123')
  }

  // loan plans (amounts in paisa)
  const plans = [
    { name: 'Starter', amount: 10000 * 100, interestRate: 12, tenureMonths: 3, processingFee: 500 * 100, description: 'Quick small loan for urgent needs.' },
    { name: 'Essential', amount: 25000 * 100, interestRate: 14, tenureMonths: 6, processingFee: 1000 * 100, description: 'Balanced plan for everyday expenses.' },
    { name: 'Growth', amount: 50000 * 100, interestRate: 15, tenureMonths: 9, processingFee: 1750 * 100, description: 'Bigger ticket with comfortable tenure.' },
    { name: 'Premium', amount: 100000 * 100, interestRate: 16, tenureMonths: 12, processingFee: 3000 * 100, description: 'Maximum limit, longest repayment window.' },
  ]
  for (const p of plans) {
    const exists = await db.loanPlan.findFirst({ where: { name: p.name } })
    if (!exists) {
      await db.loanPlan.create({ data: p })
      console.log('Created plan:', p.name)
    }
  }

  // bank detail
  const bankExists = await db.bankDetail.findFirst()
  if (!bankExists) {
    await db.bankDetail.create({
      data: {
        bankName: 'HBL — Habib Bank Limited',
        accountTitle: 'LoanFast Pvt Ltd',
        accountNumber: '001122334567890',
        iban: 'PK36HABB0000011223345678',
        active: true,
      },
    })
    console.log('Created bank detail')
  }

  console.log('Seed complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
