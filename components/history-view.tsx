"use client"

import { useState, useMemo } from "react"
import { getTransactionItems } from "@/app/actions/transactions"
import { formatDateTime, formatNumber, formatRupiah } from "@/lib/format"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronRight, ScrollText, Loader2, Search, X } from "lucide-react"

type Transaction = {
  id: number
  invoiceNo: string
  total: number
  totalCost: number
  profit: number
  paymentMethod: string
  status: string
  createdAt: string | Date
}

type Item = {
  id: number
  productName: string
  unit: string
  quantity: string
  buyPrice: number
  sellPrice: number
  subtotal: number
}

function TransactionRow({ trx }: { trx: Transaction }) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Item[] | null>(null)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    const next = !open
    setOpen(next)
    if (next && items === null) {
      setLoading(true)
      try {
        const data = await getTransactionItems(trx.id)
        setItems(data as unknown as Item[])
      } finally {
        setLoading(false)
      }
    }
  }

  const marginPct =
    trx.total > 0 ? ((trx.profit / trx.total) * 100).toFixed(0) : "0"

  return (
    <div className="border-b last:border-b-0">
      <button
        onClick={toggle}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-secondary/50 transition-colors"
      >
        {open ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-foreground truncate">{trx.invoiceNo}</span>
            <Badge variant="secondary" className="uppercase text-xs">
              {trx.paymentMethod}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">{formatDateTime(trx.createdAt)}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-semibold text-foreground">{formatRupiah(trx.total)}</p>
          <p className="text-xs text-primary">
            Laba {formatRupiah(trx.profit)}{" "}
            <span className="text-muted-foreground">({marginPct}%)</span>
          </p>
        </div>
      </button>

      {open && (
        <div className="bg-secondary/30 px-4 py-3">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Memuat detail...
            </div>
          ) : items && items.length > 0 ? (
            <div className="flex flex-col gap-2">
              {items.map((it) => (
                <div key={it.id} className="flex items-center justify-between text-sm">
                  <span className="text-foreground">
                    {it.productName}
                    <span className="text-muted-foreground">
                      {" "}× {formatNumber(Number(it.quantity))} {it.unit}
                    </span>
                  </span>
                  <span className="text-muted-foreground">{formatRupiah(it.subtotal)}</span>
                </div>
              ))}
              {/* Cost & margin breakdown */}
              <div className="mt-2 pt-2 border-t border-border/60 flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Modal (HPP)</span>
                  <span>{formatRupiah(trx.totalCost ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-medium text-primary">
                  <span>Laba bersih</span>
                  <span>{formatRupiah(trx.profit)}</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-2">Tidak ada detail item.</p>
          )}
        </div>
      )}
    </div>
  )
}

export function HistoryView({ transactions }: { transactions: Transaction[] }) {
  const [search, setSearch] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  const filtered = useMemo(() => {
    let list = transactions
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (t) =>
          t.invoiceNo.toLowerCase().includes(q) ||
          t.paymentMethod.toLowerCase().includes(q),
      )
    }
    if (dateFrom) {
      const from = new Date(dateFrom)
      from.setHours(0, 0, 0, 0)
      list = list.filter((t) => new Date(t.createdAt) >= from)
    }
    if (dateTo) {
      const to = new Date(dateTo)
      to.setHours(23, 59, 59, 999)
      list = list.filter((t) => new Date(t.createdAt) <= to)
    }
    return list
  }, [transactions, search, dateFrom, dateTo])

  const totalRevenue = filtered.reduce((s, t) => s + t.total, 0)
  const totalProfit = filtered.reduce((s, t) => s + t.profit, 0)

  const hasFilter = search || dateFrom || dateTo

  function clearFilters() {
    setSearch("")
    setDateFrom("")
    setDateTo("")
  }

  return (
    <div className="flex-1 p-4 md:p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Riwayat Transaksi</h1>
        <p className="text-sm text-muted-foreground">Semua penjualan yang sudah dibayar</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari invoice atau metode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="sm:w-44"
          aria-label="Dari tanggal"
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="sm:w-44"
          aria-label="Sampai tanggal"
        />
        {hasFilter && (
          <Button variant="ghost" size="icon" onClick={clearFilters} aria-label="Hapus filter">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Summary bar */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          <Card className="p-3 flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">Transaksi</span>
            <span className="font-semibold text-foreground">{filtered.length}</span>
          </Card>
          <Card className="p-3 flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">Total Omzet</span>
            <span className="font-semibold text-foreground">{formatRupiah(totalRevenue)}</span>
          </Card>
          <Card className="p-3 flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">Total Laba</span>
            <span className="font-semibold text-primary">{formatRupiah(totalProfit)}</span>
          </Card>
        </div>
      )}

      {transactions.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
          <ScrollText className="h-10 w-10 text-muted-foreground" />
          <div>
            <p className="font-medium text-foreground">Belum ada transaksi</p>
            <p className="text-sm text-muted-foreground">Transaksi akan muncul di sini setelah pembayaran.</p>
          </div>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
          <Search className="h-10 w-10 text-muted-foreground" />
          <div>
            <p className="font-medium text-foreground">Tidak ada hasil</p>
            <p className="text-sm text-muted-foreground">Coba ubah filter pencarian atau rentang tanggal.</p>
          </div>
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          {filtered.map((trx) => (
            <TransactionRow key={trx.id} trx={trx} />
          ))}
        </Card>
      )}
    </div>
  )
}
