"use client"

import { useState } from "react"
import { toast } from "sonner"
import {
  createProduct,
  deleteProduct,
  updateProduct,
  type ProductInput,
} from "@/app/actions/products"
import { formatNumber, formatRupiah, UNITS } from "@/lib/format"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Pencil, Plus, Trash2, PackageSearch, TrendingUp, TrendingDown, Minus } from "lucide-react"

type Product = {
  id: number
  name: string
  unit: string
  buyPrice: number
  sellPrice: number
  stock: string
}

const empty: ProductInput = { name: "", unit: "kg", buyPrice: 0, sellPrice: 0, stock: 0 }

/** Returns colour class + icon based on margin percentage */
function MarginIndicator({ buyPrice, sellPrice }: { buyPrice: number; sellPrice: number }) {
  const margin = sellPrice - buyPrice
  const pct = buyPrice > 0 ? (margin / buyPrice) * 100 : 0

  let colorClass: string
  let Icon: React.ElementType
  let label: string

  if (margin < 0) {
    colorClass = "text-destructive"
    Icon = TrendingDown
    label = "Rugi"
  } else if (pct === 0) {
    colorClass = "text-muted-foreground"
    Icon = Minus
    label = "BEP"
  } else if (pct < 10) {
    colorClass = "text-amber-600"
    Icon = TrendingUp
    label = `${pct.toFixed(0)}%`
  } else if (pct < 25) {
    colorClass = "text-yellow-600"
    Icon = TrendingUp
    label = `${pct.toFixed(0)}%`
  } else {
    colorClass = "text-primary"
    Icon = TrendingUp
    label = `${pct.toFixed(0)}%`
  }

  return (
    <div className={`flex items-center gap-1 font-medium ${colorClass}`}>
      <Icon className="h-3.5 w-3.5" />
      <span className="text-sm">{formatRupiah(margin)}</span>
      <span className="text-xs opacity-75">({label})</span>
    </div>
  )
}

/** Inline margin preview shown inside the form dialog */
function MarginPreview({ buyPrice, sellPrice, unit }: { buyPrice: number; sellPrice: number; unit: string }) {
  const margin = sellPrice - buyPrice
  const pct = buyPrice > 0 ? (margin / buyPrice) * 100 : 0

  const bg =
    margin < 0
      ? "bg-destructive/10 border-destructive/30"
      : pct < 10
        ? "bg-amber-50 border-amber-200"
        : "bg-secondary border-border"

  const textColor =
    margin < 0 ? "text-destructive" : pct < 10 ? "text-amber-600" : "text-primary"

  return (
    <div className={`rounded-lg border p-3 flex items-center justify-between ${bg}`}>
      <div className="text-sm text-secondary-foreground">
        <span>Margin per {unit}</span>
        {margin < 0 && (
          <span className="ml-2 text-xs text-destructive font-medium">⚠ Harga jual lebih kecil dari harga beli</span>
        )}
      </div>
      <div className="text-right">
        <span className={`font-semibold ${textColor}`}>{formatRupiah(margin)}</span>
        <span className="text-xs text-muted-foreground ml-2">({pct.toFixed(0)}%)</span>
      </div>
    </div>
  )
}

export function ProductManager({ products }: { products: Product[] }) {
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState<ProductInput>(empty)
  const [saving, setSaving] = useState(false)

  function openCreate() {
    setEditId(null)
    setForm(empty)
    setOpen(true)
  }

  function openEdit(p: Product) {
    setEditId(p.id)
    setForm({
      name: p.name,
      unit: p.unit,
      buyPrice: p.buyPrice,
      sellPrice: p.sellPrice,
      stock: Number(p.stock),
    })
    setOpen(true)
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error("Nama produk wajib diisi")
      return
    }
    if (form.sellPrice < form.buyPrice) {
      toast.warning("Harga jual lebih kecil dari harga beli", {
        description: "Margin akan negatif (rugi). Lanjutkan jika memang disengaja.",
      })
    }
    setSaving(true)
    try {
      if (editId != null) {
        await updateProduct(editId, form)
        toast.success("Produk diperbarui")
      } else {
        await createProduct(form)
        toast.success("Produk ditambahkan")
      }
      setOpen(false)
    } catch (e) {
      toast.error("Gagal menyimpan", { description: e instanceof Error ? e.message : undefined })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Hapus produk "${name}"?`)) return
    try {
      await deleteProduct(id)
      toast.success("Produk dihapus")
    } catch (e) {
      toast.error("Gagal menghapus", { description: e instanceof Error ? e.message : undefined })
    }
  }

  return (
    <div className="flex-1 p-4 md:p-6">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Produk & Stok</h1>
          <p className="text-sm text-muted-foreground">Kelola sayur, harga beli, harga jual, dan stok</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Tambah Produk</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editId != null ? "Edit Produk" : "Tambah Produk"}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Nama Produk</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Bayam Hijau"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="unit">Satuan</Label>
                  <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                    <SelectTrigger id="unit">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNITS.map((u) => (
                        <SelectItem key={u} value={u}>
                          {u}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="stock">Stok ({form.unit})</Label>
                  <Input
                    id="stock"
                    type="number"
                    inputMode="decimal"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                    min={0}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="buy">Harga Beli</Label>
                  <Input
                    id="buy"
                    type="number"
                    inputMode="numeric"
                    value={form.buyPrice}
                    onChange={(e) => setForm({ ...form, buyPrice: Number(e.target.value) })}
                    min={0}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="sell">Harga Jual</Label>
                  <Input
                    id="sell"
                    type="number"
                    inputMode="numeric"
                    value={form.sellPrice}
                    onChange={(e) => setForm({ ...form, sellPrice: Number(e.target.value) })}
                    min={0}
                  />
                </div>
              </div>

              <MarginPreview
                buyPrice={form.buyPrice}
                sellPrice={form.sellPrice}
                unit={form.unit}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Menyimpan..." : "Simpan"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {products.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
          <PackageSearch className="h-10 w-10 text-muted-foreground" />
          <div>
            <p className="font-medium text-foreground">Belum ada produk</p>
            <p className="text-sm text-muted-foreground">Tambahkan produk sayur pertamamu.</p>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Tambah Produk
          </Button>
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produk</TableHead>
                  <TableHead className="text-right">Harga Beli</TableHead>
                  <TableHead className="text-right">Harga Jual</TableHead>
                  <TableHead className="text-right">Margin</TableHead>
                  <TableHead className="text-right">Stok</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => {
                  const stock = Number(p.stock)
                  const lowStock = stock <= 0
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{p.name}</span>
                          <Badge variant="secondary">/{p.unit}</Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatRupiah(p.buyPrice)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-foreground">
                        {formatRupiah(p.sellPrice)}
                      </TableCell>
                      <TableCell className="text-right">
                        <MarginIndicator buyPrice={p.buyPrice} sellPrice={p.sellPrice} />
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={lowStock ? "text-destructive font-medium" : "text-foreground"}>
                          {formatNumber(stock)} {p.unit}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEdit(p)}
                            aria-label={`Edit ${p.name}`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDelete(p.id, p.name)}
                            aria-label={`Hapus ${p.name}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  )
}
