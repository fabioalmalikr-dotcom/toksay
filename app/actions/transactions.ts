"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { products, transactionItems, transactions } from "@/lib/db/schema"
import { and, desc, eq, gte, sql } from "drizzle-orm"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error("Unauthorized")
  return session.user.id
}

export type CartItemInput = {
  productId: number | null
  productName: string
  unit: string
  quantity: number
  buyPrice: number
  sellPrice: number
}

export async function checkout(items: CartItemInput[], paymentMethod = "qris") {
  const userId = await getUserId()
  if (!items.length) throw new Error("Keranjang kosong")

  const total = items.reduce((sum, it) => sum + it.sellPrice * it.quantity, 0)
  const totalCost = items.reduce((sum, it) => sum + it.buyPrice * it.quantity, 0)
  const profit = total - totalCost
  const invoiceNo = `INV-${Date.now()}`

  const [trx] = await db
    .insert(transactions)
    .values({
      userId,
      invoiceNo,
      total: Math.round(total),
      totalCost: Math.round(totalCost),
      profit: Math.round(profit),
      paymentMethod,
      status: "paid",
    })
    .returning()

  await db.insert(transactionItems).values(
    items.map((it) => ({
      transactionId: trx.id,
      userId,
      productId: it.productId,
      productName: it.productName,
      unit: it.unit,
      quantity: String(it.quantity),
      buyPrice: Math.round(it.buyPrice),
      sellPrice: Math.round(it.sellPrice),
      subtotal: Math.round(it.sellPrice * it.quantity),
    })),
  )

  // Decrement stock for tracked products (never below zero)
  for (const it of items) {
    if (it.productId != null) {
      await db
        .update(products)
        .set({
          stock: sql`GREATEST(${products.stock} - ${it.quantity}, 0)`,
          updatedAt: new Date(),
        })
        .where(and(eq(products.id, it.productId), eq(products.userId, userId)))
    }
  }

  revalidatePath("/")
  revalidatePath("/produk")
  revalidatePath("/riwayat")
  revalidatePath("/laporan")

  return { invoiceNo, total, profit }
}

export async function getTransactions(limit = 100) {
  const userId = await getUserId()
  return db
    .select()
    .from(transactions)
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.createdAt))
    .limit(limit)
}

export async function getTransactionItems(transactionId: number) {
  const userId = await getUserId()
  return db
    .select()
    .from(transactionItems)
    .where(and(eq(transactionItems.transactionId, transactionId), eq(transactionItems.userId, userId)))
}

export async function getReportSummary() {
  const userId = await getUserId()

  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [allTime] = await db
    .select({
      revenue: sql<number>`COALESCE(SUM(${transactions.total}), 0)`,
      cost: sql<number>`COALESCE(SUM(${transactions.totalCost}), 0)`,
      profit: sql<number>`COALESCE(SUM(${transactions.profit}), 0)`,
      count: sql<number>`COUNT(*)`,
    })
    .from(transactions)
    .where(eq(transactions.userId, userId))

  const [today] = await db
    .select({
      revenue: sql<number>`COALESCE(SUM(${transactions.total}), 0)`,
      profit: sql<number>`COALESCE(SUM(${transactions.profit}), 0)`,
      count: sql<number>`COUNT(*)`,
    })
    .from(transactions)
    .where(and(eq(transactions.userId, userId), gte(transactions.createdAt, startOfDay)))

  const [month] = await db
    .select({
      revenue: sql<number>`COALESCE(SUM(${transactions.total}), 0)`,
      profit: sql<number>`COALESCE(SUM(${transactions.profit}), 0)`,
      count: sql<number>`COUNT(*)`,
    })
    .from(transactions)
    .where(and(eq(transactions.userId, userId), gte(transactions.createdAt, startOfMonth)))

  // Last 7 days revenue & profit grouped by day
  const daily = await db
    .select({
      day: sql<string>`TO_CHAR(${transactions.createdAt}, 'YYYY-MM-DD')`,
      revenue: sql<number>`COALESCE(SUM(${transactions.total}), 0)`,
      profit: sql<number>`COALESCE(SUM(${transactions.profit}), 0)`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        gte(transactions.createdAt, new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000)),
      ),
    )
    .groupBy(sql`TO_CHAR(${transactions.createdAt}, 'YYYY-MM-DD')`)
    .orderBy(sql`TO_CHAR(${transactions.createdAt}, 'YYYY-MM-DD')`)

  return {
    allTime: {
      revenue: Number(allTime?.revenue ?? 0),
      cost: Number(allTime?.cost ?? 0),
      profit: Number(allTime?.profit ?? 0),
      count: Number(allTime?.count ?? 0),
    },
    today: {
      revenue: Number(today?.revenue ?? 0),
      profit: Number(today?.profit ?? 0),
      count: Number(today?.count ?? 0),
    },
    month: {
      revenue: Number(month?.revenue ?? 0),
      profit: Number(month?.profit ?? 0),
      count: Number(month?.count ?? 0),
    },
    daily: daily.map((d) => ({
      day: d.day,
      revenue: Number(d.revenue),
      profit: Number(d.profit),
    })),
  }
}
