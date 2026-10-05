import { db } from './db'

// Mark installments as overdue when their due date has passed and they're still pending.
// Called lazily from data-loading endpoints so the DB stays consistent without a cron.
export async function syncOverdueStatus(): Promise<number> {
  const today = new Date().toISOString().slice(0, 10)
  const result = await db.installment.updateMany({
    where: {
      status: 'pending',
      dueDate: { lt: today },
    },
    data: { status: 'overdue' },
  })
  return result.count
}
