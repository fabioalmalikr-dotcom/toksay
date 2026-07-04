"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { products } from "@/lib/db/schema"
import { and, asc, eq } from "drizzle-orm"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error("Unauthorized")
  return session.user.id
}

export async function getProducts() {
  const userId = await getUserId()
  return db.select().from(products).where(eq(products.userId, userId)).orderBy(asc(products.name))
}

export type ProductInput = {
  name: string
  unit: string
  buyPrice: number
  sellPrice: number
  stock: number
}

export async function createProduct(input: ProductInput) {
  const userId = await getUserId()
  await db.insert(products).values({
    userId,
    name: input.name.trim(),
    unit: input.unit,
    buyPrice: Math.round(input.buyPrice),
    sellPrice: Math.round(input.sellPrice),
    stock: String(input.stock),
  })
  revalidatePath("/produk")
  revalidatePath("/")
}

export async function updateProduct(id: number, input: ProductInput) {
  const userId = await getUserId()
  await db
    .update(products)
    .set({
      name: input.name.trim(),
      unit: input.unit,
      buyPrice: Math.round(input.buyPrice),
      sellPrice: Math.round(input.sellPrice),
      stock: String(input.stock),
      updatedAt: new Date(),
    })
    .where(and(eq(products.id, id), eq(products.userId, userId)))
  revalidatePath("/produk")
  revalidatePath("/")
}

export async function deleteProduct(id: number) {
  const userId = await getUserId()
  await db.delete(products).where(and(eq(products.id, id), eq(products.userId, userId)))
  revalidatePath("/produk")
  revalidatePath("/")
}
