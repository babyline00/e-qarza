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

  // also generate due-soon reminders for installments due within 3 days
  await generateDueReminders(today)

  return result.count
}

// Generate "payment due soon" reminder notifications for installments due within 3 days.
// Uses AdminSetting to track which reminders have been sent (key: reminder-<installmentId>).
async function generateDueReminders(today: string): Promise<void> {
  const todayDate = new Date(today + 'T00:00:00')
  const threeDaysLater = new Date(todayDate)
  threeDaysLater.setDate(threeDaysLater.getDate() + 3)
  const dueSoonDate = threeDaysLater.toISOString().slice(0, 10)

  // find pending installments due within 3 days
  const dueSoon = await db.installment.findMany({
    where: {
      status: 'pending',
      dueDate: { gte: today, lte: dueSoonDate },
    },
    include: { application: { include: { user: true } } },
  })

  for (const inst of dueSoon) {
    // check if we already sent a reminder for this installment
    const reminderKey = `reminder-${inst.id}`
    const existing = await db.adminSetting.findUnique({ where: { key: reminderKey } })
    if (existing) continue

    // create reminder notification
    await db.notification.create({
      data: {
        userId: inst.application.userId,
        title: `Installment #${inst.number} Due Soon`,
        message: `Your installment of Rs ${(inst.amount / 100).toLocaleString('en-PK')} is due on ${new Date(inst.dueDate + 'T00:00:00').toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}. Please pay on time to avoid late fees.`,
        type: 'warning',
      },
    })

    // mark as sent
    await db.adminSetting.create({ data: { key: reminderKey, value: 'sent' } })
  }

  // also generate overdue reminders (once) for newly-overdue installments
  const overdue = await db.installment.findMany({
    where: { status: 'overdue' },
    include: { application: { include: { user: true } } },
  })

  for (const inst of overdue) {
    const overdueKey = `overdue-${inst.id}`
    const existing = await db.adminSetting.findUnique({ where: { key: overdueKey } })
    if (existing) continue

    await db.notification.create({
      data: {
        userId: inst.application.userId,
        title: `Installment #${inst.number} Overdue`,
        message: `Your installment of Rs ${(inst.amount / 100).toLocaleString('en-PK')} is overdue. Please pay immediately to avoid further penalties and protect your credit standing.`,
        type: 'error',
      },
    })

    await db.adminSetting.create({ data: { key: overdueKey, value: 'sent' } })
  }
}

