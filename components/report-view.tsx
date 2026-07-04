"use client"

import { Card } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { formatRupiah } from "@/lib/format"
import { TrendingUp, Wallet, Receipt, Coins } from "lucide-react"

type Summary = {
  allTime: { revenue: number; cost: number; profit: number; count: number }
  today: { revenue: number; profit: number; count: number }
  month: { revenue: number; profit: number; count: number }
  daily: { day: string; revenue: number; profit: number }[]
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string
  value: string
  sub?: string
  icon: React.ElementType
  accent?: boolean
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${
            accent ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
          }`}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </Card>
  )
}

export function ReportView({ summary }: { summary: Summary }) {
  const chartData = summary.daily.map((d) => ({
    day: new Date(d.day).toLocaleDateString("id-ID", { weekday: "short", day: "numeric" }),
    Omzet: d.revenue,
    Laba: d.profit,
  }))

  const margin =
    summary.allTime.revenue > 0 ? (summary.allTime.profit / summary.allTime.revenue) * 100 : 0

  return (
    <div className="flex-1 p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Laporan</h1>
        <p className="text-sm text-muted-foreground">Ringkasan penjualan, margin, dan laba</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Omzet Hari Ini"
          value={formatRupiah(summary.today.revenue)}
          sub={`${summary.today.count} transaksi`}
          icon={Wallet}
          accent
        />
        <StatCard
          label="Laba Hari Ini"
          value={formatRupiah(summary.today.profit)}
          sub="Margin bersih"
          icon={TrendingUp}
        />
        <StatCard
          label="Omzet Bulan Ini"
          value={formatRupiah(summary.month.revenue)}
          sub={`${summary.month.count} transaksi`}
          icon={Receipt}
        />
        <StatCard
          label="Laba Bulan Ini"
          value={formatRupiah(summary.month.profit)}
          sub="Margin bersih"
          icon={Coins}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 p-4">
          <div className="mb-4">
            <h2 className="font-medium text-card-foreground">Tren 7 Hari Terakhir</h2>
            <p className="text-sm text-muted-foreground">Perbandingan omzet dan laba harian</p>
          </div>
          {chartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
              Belum ada data transaksi
            </div>
          ) : (
            <ChartContainer
              config={{
                Omzet: { label: "Omzet", color: "var(--chart-1)" },
                Laba: { label: "Laba", color: "var(--chart-2)" },
              }}
              className="h-64 w-full"
            >
              <BarChart data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={70}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}rb`}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="Omzet" fill="var(--color-Omzet)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Laba" fill="var(--color-Laba)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          )}
        </Card>

        <Card className="p-4 flex flex-col gap-4">
          <h2 className="font-medium text-card-foreground">Total Keseluruhan</h2>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Omzet</span>
              <span className="font-semibold text-foreground">{formatRupiah(summary.allTime.revenue)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Modal (HPP)</span>
              <span className="font-semibold text-foreground">{formatRupiah(summary.allTime.cost)}</span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Laba</span>
              <span className="text-xl font-bold text-primary">{formatRupiah(summary.allTime.profit)}</span>
            </div>
            <div className="rounded-lg bg-secondary p-3 flex items-center justify-between">
              <span className="text-sm text-secondary-foreground">Margin Rata-rata</span>
              <span className="font-semibold text-primary">{margin.toFixed(1)}%</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {summary.allTime.count} transaksi tercatat sejak awal.
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
