import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { getProducts } from "@/app/actions/products"
import { AppShell } from "@/components/app-shell"
import { PosKasir } from "@/components/pos-kasir"

export default async function KasirPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect("/sign-in")

  const products = await getProducts()

  return (
    <AppShell userName={session.user.name}>
      <PosKasir products={products} />
    </AppShell>
  )
}
