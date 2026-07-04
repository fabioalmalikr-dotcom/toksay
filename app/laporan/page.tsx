import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { getReportSummary } from "@/app/actions/transactions"
import { AppShell } from "@/components/app-shell"
import { ReportView } from "@/components/report-view"

export default async function LaporanPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect("/sign-in")

  const summary = await getReportSummary()

  return (
    <AppShell userName={session.user.name}>
      <ReportView summary={summary} />
    </AppShell>
  )
}
