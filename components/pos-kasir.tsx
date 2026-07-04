"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { checkout, type CartItemInput } from "@/app/actions/transactions"
import { formatNumber, formatRupiah } from "@/lib/format"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { QrisPaymentDialog } from "@/components/qris-payment-dialog"
import { Minus, Plus, Search, ShoppingCart, Trash2, X, Banknote, QrCode, Receipt } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"

type Product = {
  id: number
  name: string
  unit: string
  buyPrice: number
  sellPrice: number
  stock: string
}

type CartLine = {
  productId: number
  name: string
  unit: string
  buyPrice: number
  sellPrice: number
  stock: number
  qty: number
}

type Receipt = {
  invoiceNo: string
  total: number
  profit: number
  paymentMethod: string
  cashPaid?: number
  change?: number
  items: { name: string; unit: string; qty: number; sellPrice: number; subtotal: number }[]
  paidAt: Date
}

export function PosKasir({ products }: { products: Product[] }) {
  const [search, setSearch] = useState("")
  const [cart, setCart] = useState<CartLine[]>([])
  const [payOpen, setPayOpen] = useState(false)
  const [payMethod, setPayMethod] = useState<"qris" | "cash">("qris")
  const [processing, setProcessing] = useState(false)
  const [receipt, setReceipt] = useState<Receipt | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return products
    return products.filter((p) => p.name.toLowerCase().includes(q))
  }, [products, search])

  const total = cart.reduce((sum, l) => sum + l.sellPrice * l.qty, 0)
  const totalCost = cart.reduce((sum, l) => sum + l.buyPrice * l.qty, 0)
  const estProfit = total - totalCost

  const isWeight = (unit: string) => unit === "kg" || unit === "gram"

  function addToCart(p: Product) {
    setCart((prev) => {
      const existing = prev.find((l) => l.productId === p.id)
      const step = isWeight(p.unit) ? 0.5 : 1
      if (existing) {
        return prev.map((l) => (l.productId === p.id ? { ...l, qty: l.qty + step } : l))
      }
      return [
        ...prev,
        {
          productId: p.id,
          name: p.name,
          unit: p.unit,
          buyPrice: p.buyPrice,
          sellPrice: p.sellPrice,
          stock: Number(p.stock),
          qty: step,
        },
      ]
    })
  }

  function setQty(productId: number, qty: number) {
    setCart((prev) =>
      prev
        .map((l) => (l.productId === productId ? { ...l, qty: Math.max(0, qty) } : l))
        .filter((l) => l.qty > 0),
    )
  }

  function stepQty(productId: number, dir: 1 | -1) {
    setCart((prev) =>
      prev
        .map((l) => {
          if (l.productId !== productId) return l
          const step = isWeight(l.unit) ? 0.5 : 1
          return { ...l, qty: Math.max(0, +(l.qty + dir * step).toFixed(2)) }
        })
        .filter((l) => l.qty > 0),
    )
  }

  function removeLine(productId: number) {
    setCart((prev) => prev.filter((l) => l.productId !== productId))
  }

  async function doCheckout(method: "qris" | "cash", cashPaid?: number) {
    setProcessing(true)
    try {
      const items: CartItemInput[] = cart.map((l) => ({
        productId: l.productId,
        productName: l.name,
        unit: l.unit,
        quantity: l.qty,
        buyPrice: l.buyPrice,
        sellPrice: l.sellPrice,
      }))
      const res = await checkout(items, method)

      const newReceipt: Receipt = {
        invoiceNo: res.invoiceNo,
        total: res.total,
        profit: res.profit,
        paymentMethod: method,
        cashPaid: cashPaid,
        change: cashPaid != null ? cashPaid - res.total : undefined,
        items: cart.map((l) => ({
          name: l.name,
          unit: l.unit,
          qty: l.qty,
          sellPrice: l.sellPrice,
          subtotal: l.sellPrice * l.qty,
        })),
        paidAt: new Date(),
      }

      toast.success("Transaksi berhasil", {
        description: `${res.invoiceNo} • ${formatRupiah(res.total)} • Laba ${formatRupiah(res.profit)}`,
      })
      setCart([])
      setPayOpen(false)
      setReceipt(newReceipt)
    } catch (e) {
      toast.error("Gagal menyimpan transaksi", {
        description: e instanceof Error ? e.message : undefined,
      })
    } finally {
      setProcessing(false)
    }
  }

  // Called by QRIS dialog after payment confirmed
  async function handleQrisConfirmed() {
    await doCheckout("qris")
  }

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 md:p-6">
      {/* Product catalog */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="mb-4">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Kasir</h1>
          <p className="text-sm text-muted-foreground">Pilih produk untuk ditambahkan ke keranjang</p>
        </div>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari sayur..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {products.length === 0 ? (
          <Card className="flex flex-col items-center justify-center gap-2 p-10 text-center">
            <p className="font-medium text-foreground">Belum ada produk</p>
            <p className="text-sm text-muted-foreground text-balance">
              Tambahkan produk sayur di menu Produk terlebih dahulu.
            </p>
          </Card>
        ) : filtered.length === 0 ? (
          <Card className="flex flex-col items-center justify-center gap-2 p-10 text-center">
            <p className="font-medium text-foreground">Produk tidak ditemukan</p>
            <p className="text-sm text-muted-foreground">Coba kata kunci lain.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map((p) => {
              const margin = p.sellPrice - p.buyPrice
              const lowStock = Number(p.stock) <= 0
              const inCart = cart.find((l) => l.productId === p.id)
              return (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  disabled={lowStock}
                  className="group text-left rounded-xl border bg-card p-3 transition-colors hover:border-primary hover:bg-secondary/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed relative"
                >
                  {inCart && (
                    <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      {inCart.qty}
                    </span>
                  )}
                  <div className="flex items-start justify-between gap-2 pr-6">
                    <p className="font-medium text-card-foreground leading-tight text-balance">{p.name}</p>
                    <Badge variant="secondary" className="shrink-0 text-xs">
                      /{p.unit}
                    </Badge>
                  </div>
                  <p className="mt-2 text-lg font-semibold text-foreground">{formatRupiah(p.sellPrice)}</p>
                  <div className="mt-1 flex items-center justify-between text-xs">
                    <span className={lowStock ? "text-destructive font-medium" : "text-muted-foreground"}>
                      {lowStock ? "Habis" : `Stok ${formatNumber(Number(p.stock))}`}
                    </span>
                    <span className="text-primary font-medium">+{formatRupiah(margin)}</span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Cart */}
      <div className="lg:w-96 shrink-0">
        <Card className="lg:sticky lg:top-6 flex flex-col p-0 overflow-hidden">
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <ShoppingCart className="h-4 w-4 text-primary" />
            <span className="font-medium text-card-foreground">Keranjang</span>
            {cart.length > 0 && <Badge className="ml-auto">{cart.length} item</Badge>}
          </div>

          {cart.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Keranjang masih kosong</div>
          ) : (
            <div className="max-h-[45vh] overflow-y-auto divide-y">
              {cart.map((l) => (
                <div key={l.productId} className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-card-foreground truncate">{l.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatRupiah(l.sellPrice)} / {l.unit}
                      </p>
                    </div>
                    <button
                      onClick={() => removeLine(l.productId)}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label={`Hapus ${l.name}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 bg-transparent"
                        onClick={() => stepQty(l.productId, -1)}
                        aria-label="Kurangi"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Input
                        type="number"
                        inputMode="decimal"
                        value={l.qty}
                        onChange={(e) => setQty(l.productId, Number(e.target.value))}
                        className="h-8 w-16 text-center"
                        step={l.unit === "kg" || l.unit === "gram" ? 0.1 : 1}
                        min={0}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 bg-transparent"
                        onClick={() => stepQty(l.productId, 1)}
                        aria-label="Tambah"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <span className="font-semibold text-card-foreground">
                      {formatRupiah(l.sellPrice * l.qty)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="border-t p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Estimasi Laba</span>
              <span className="font-medium text-primary">{formatRupiah(estProfit)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-card-foreground">Total</span>
              <span className="text-2xl font-bold text-foreground">{formatRupiah(total)}</span>
            </div>

            {/* Payment method selector */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setPayMethod("qris")}
                className={`flex items-center justify-center gap-2 rounded-lg border py-2 text-sm font-medium transition-colors ${
                  payMethod === "qris"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-card-foreground hover:bg-secondary"
                }`}
              >
                <QrCode className="h-4 w-4" />
                QRIS
              </button>
              <button
                onClick={() => setPayMethod("cash")}
                className={`flex items-center justify-center gap-2 rounded-lg border py-2 text-sm font-medium transition-colors ${
                  payMethod === "cash"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-card-foreground hover:bg-secondary"
                }`}
              >
                <Banknote className="h-4 w-4" />
                Tunai
              </button>
            </div>

            <div className="flex gap-2">
              {cart.length > 0 && (
                <Button variant="outline" size="icon" onClick={() => setCart([])} aria-label="Kosongkan keranjang">
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <Button
                className="flex-1"
                size="lg"
                disabled={cart.length === 0}
                onClick={() => setPayOpen(true)}
              >
                {payMethod === "qris" ? (
                  <><QrCode className="h-4 w-4 mr-2" />Bayar QRIS</>
                ) : (
                  <><Banknote className="h-4 w-4 mr-2" />Bayar Tunai</>
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* QRIS dialog */}
      {payMethod === "qris" && (
        <QrisPaymentDialog
          open={payOpen}
          onOpenChange={setPayOpen}
          amount={total}
          invoiceHint={`CART-${cart.length}`}
          onConfirmed={handleQrisConfirmed}
          processing={processing}
        />
      )}

      {/* Cash payment dialog */}
      {payMethod === "cash" && (
        <CashPaymentDialog
          open={payOpen}
          onOpenChange={setPayOpen}
          total={total}
          processing={processing}
          onConfirmed={(cashPaid) => doCheckout("cash", cashPaid)}
        />
      )}

      {/* Receipt dialog */}
      {receipt && (
        <ReceiptDialog
          receipt={receipt}
          onClose={() => setReceipt(null)}
        />
      )}
    </div>
  )
}

// ─── Cash Payment Dialog ────────────────────────────────────────────────────

function CashPaymentDialog({
  open,
  onOpenChange,
  total,
  processing,
  onConfirmed,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  total: number
  processing: boolean
  onConfirmed: (cashPaid: number) => void
}) {
  const [cashPaid, setCashPaid] = useState<number>(0)

  // Reset when dialog opens
  const change = cashPaid >= total ? cashPaid - total : null
  const isValid = cashPaid >= total

  // Quick-fill shortcuts: round up to nearest 5k/10k/50k
  const quickAmounts = useMemo(() => {
    const amounts: number[] = []
    for (const denom of [1000, 2000, 5000, 10000, 20000, 50000, 100000]) {
      const rounded = Math.ceil(total / denom) * denom
      if (!amounts.includes(rounded) && amounts.length < 4) amounts.push(rounded)
    }
    return amounts.slice(0, 4)
  }, [total])

  return (
    <Dialog open={open} onOpenChange={processing ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5 text-primary" />
            Pembayaran Tunai
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <div className="rounded-lg bg-secondary p-3 flex items-center justify-between">
            <span className="text-sm text-secondary-foreground">Total Tagihan</span>
            <span className="text-xl font-bold text-foreground">{formatRupiah(total)}</span>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-foreground">Uang Diterima</span>
            <Input
              type="number"
              inputMode="numeric"
              value={cashPaid || ""}
              onChange={(e) => setCashPaid(Number(e.target.value))}
              placeholder="Masukkan nominal..."
              className="text-lg h-12"
              min={0}
            />
            <div className="grid grid-cols-4 gap-1.5">
              {quickAmounts.map((amt) => (
                <button
                  key={amt}
                  onClick={() => setCashPaid(amt)}
                  className="rounded-md border bg-card px-2 py-1.5 text-xs font-medium text-card-foreground hover:bg-secondary transition-colors"
                >
                  {formatRupiah(amt)}
                </button>
              ))}
            </div>
          </div>

          {change !== null && (
            <div className="rounded-lg border-2 border-primary bg-primary/5 p-3 flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Kembalian</span>
              <span className="text-2xl font-bold text-primary">{formatRupiah(change)}</span>
            </div>
          )}

          {cashPaid > 0 && cashPaid < total && (
            <p className="text-sm text-destructive text-center">
              Kurang {formatRupiah(total - cashPaid)}
            </p>
          )}

          <Button
            size="lg"
            className="w-full"
            disabled={!isValid || processing}
            onClick={() => onConfirmed(cashPaid)}
          >
            {processing ? "Memproses..." : "Konfirmasi Pembayaran"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Receipt Dialog ─────────────────────────────────────────────────────────

function ReceiptDialog({
  receipt,
  onClose,
}: {
  receipt: Receipt
  onClose: () => void
}) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Struk Transaksi
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-1">
          {/* Invoice info */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{receipt.invoiceNo}</span>
            <span>
              {receipt.paidAt.toLocaleDateString("id-ID", {
                day: "numeric", month: "short", year: "numeric",
              })}{" "}
              {receipt.paidAt.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>

          <Separator />

          {/* Items */}
          <div className="flex flex-col gap-1.5">
            {receipt.items.map((it, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-foreground">
                  {it.name}
                  <span className="text-muted-foreground">
                    {" "}× {formatNumber(it.qty)} {it.unit}
                  </span>
                </span>
                <span className="text-foreground font-medium">{formatRupiah(it.subtotal)}</span>
              </div>
            ))}
          </div>

          <Separator />

          {/* Totals */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between font-semibold">
              <span className="text-foreground">Total</span>
              <span className="text-foreground text-lg">{formatRupiah(receipt.total)}</span>
            </div>
            {receipt.paymentMethod === "cash" && receipt.cashPaid != null && (
              <>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Dibayar</span>
                  <span>{formatRupiah(receipt.cashPaid)}</span>
                </div>
                <div className="flex items-center justify-between text-sm font-medium">
                  <span className="text-foreground">Kembalian</span>
                  <span className="text-primary">{formatRupiah(receipt.change ?? 0)}</span>
                </div>
              </>
            )}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Metode</span>
              <Badge variant="secondary" className="uppercase">{receipt.paymentMethod}</Badge>
            </div>
          </div>

          <Separator />

          <p className="text-center text-xs text-primary font-medium">
            Laba transaksi: {formatRupiah(receipt.profit)}
          </p>

          <Button className="w-full" onClick={onClose}>
            Selesai
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
