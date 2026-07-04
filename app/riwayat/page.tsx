import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { getTransactions } from "@/app/actions/transactions"
import { AppShell } from "@/components/app-shell"
import { HistoryView } from "@/components/history-view"

export default async function RiwayatPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect("/sign-in")

  const transactions = await getTransactions()

  return (
    <AppShell userName={session.user.name}>
      <HistoryView transactions={transactions} />
    </AppShell>
  )
}
