import { db } from './db'

// Wallet helper functions — ensures atomic balance updates with transaction records

// Get or create a wallet for a user
export async function getOrCreateWallet(userId: string) {
  let wallet = await db.wallet.findUnique({ where: { userId } })
  if (!wallet) {
    wallet = await db.wallet.create({ data: { userId, balance: 0 } })
  }
  return wallet
}

// Credit wallet (e.g., loan disbursement) — creates a transaction + updates balance
export async function creditWallet(
  userId: string,
  amount: number,
  type: string,
  description?: string,
  referenceId?: string
) {
  const wallet = await getOrCreateWallet(userId)
  await db.$transaction([
    db.wallet.update({
      where: { id: wallet.id },
      data: { balance: { increment: amount } },
    }),
    db.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type,
        amount, // positive
        description,
        referenceId,
      },
    }),
  ])
  return wallet.id
}

// Debit wallet (e.g., withdrawal) — creates a transaction + updates balance
export async function debitWallet(
  userId: string,
  amount: number,
  type: string,
  description?: string,
  referenceId?: string
) {
  const wallet = await getOrCreateWallet(userId)
  if (wallet.balance < amount) {
    throw new Error('Insufficient wallet balance')
  }
  await db.$transaction([
    db.wallet.update({
      where: { id: wallet.id },
      data: { balance: { decrement: amount } },
    }),
    db.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type,
        amount: -amount, // negative
        description,
        referenceId,
      },
    }),
  ])
  return wallet.id
}

// Get wallet balance
export async function getWalletBalance(userId: string): Promise<number> {
  const wallet = await getOrCreateWallet(userId)
  return wallet.balance
}
