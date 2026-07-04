"use client"

import { useEffect, useState } from "react"
import { QRCodeSVG } from "qrcode.react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { formatRupiah } from "@/lib/format"
import { CheckCircle2, Loader2, QrCode } from "lucide-react"

type Stage = "show-qr" | "waiting" | "success"

export function QrisPaymentDialog({
  open,
  onOpenChange,
  amount,
  invoiceHint,
  onConfirmed,
  processing,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  amount: number
  invoiceHint: string
  onConfirmed: () => Promise<void> | void
  processing: boolean
}) {
  const [stage, setStage] = useState<Stage>("show-qr")

  // Reset stage each time the dialog opens
  useEffect(() => {
    if (open) setStage("show-qr")
  }, [open])

  // Build a QRIS-like payload string (simulated).
  const qrPayload = JSON.stringify({
    merchant: "SayurKasir",
    invoice: invoiceHint,
    amount,
    ts: Date.now(),
  })

  const handlePaid = async () => {
    // Simulate gateway confirming the payment
    setStage("waiting")
    await new Promise((r) => setTimeout(r, 1500))
    setStage("success")
    await new Promise((r) => setTimeout(r, 900))
    await onConfirmed()
  }

  return (
    <Dialog open={open} onOpenChange={processing ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" />
            Pembayaran QRIS
          </DialogTitle>
          <DialogDescription>
            Pelanggan memindai QR untuk membayar {formatRupiah(amount)}
          </DialogDescription>
        </DialogHeader>

        {stage === "show-qr" && (
          <div className="flex flex-col items-center gap-4 py-2">
            <div className="rounded-xl border bg-card p-4">
              <QRCodeSVG value={qrPayload} size={220} level="M" />
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Tagihan</p>
              <p className="text-3xl font-bold text-foreground">{formatRupiah(amount)}</p>
            </div>
            <p className="text-xs text-muted-foreground text-center text-balance">
              Mode simulasi QRIS. Setelah pelanggan membayar lewat aplikasi
              e-wallet/mobile banking, tekan tombol di bawah untuk mengonfirmasi.
            </p>
            <Button className="w-full" size="lg" onClick={handlePaid}>
              Konfirmasi Pembayaran Diterima
            </Button>
          </div>
        )}

        {stage === "waiting" && (
          <div className="flex flex-col items-center gap-4 py-10">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Memverifikasi pembayaran...</p>
          </div>
        )}

        {stage === "success" && (
          <div className="flex flex-col items-center gap-4 py-10">
            <CheckCircle2 className="h-16 w-16 text-primary" />
            <div className="text-center">
              <p className="text-lg font-semibold text-foreground">Pembayaran Berhasil</p>
              <p className="text-sm text-muted-foreground">
                {formatRupiah(amount)} diterima
              </p>
            </div>
            {processing && (
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                Menyimpan transaksi...
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
