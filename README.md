# SayurKasir

Aplikasi kasir sayur dengan pembayaran QRIS & Tunai, manajemen stok, tracking margin harga beli/jual, dan laporan laba.

## Fitur

- **Kasir POS** — grid produk, keranjang, qty decimal (kg/gram), badge stok habis
- **QRIS Payment** — simulasi QR code dengan 3 tahap (tampil QR → verifikasi → sukses)
- **Tunai Payment** — kalkulator kembalian dengan tombol nominal cepat
- **Struk digital** — muncul otomatis setelah tiap transaksi
- **Manajemen Produk** — CRUD produk dengan indikator margin berwarna (hijau/kuning/merah)
- **Riwayat Transaksi** — filter by tanggal, pencarian invoice, detail item per transaksi, total laba per transaksi
- **Laporan** — omzet & laba hari ini / bulan ini / all-time, grafik 7 hari (bar chart), margin rata-rata
- **Auth** — email + password via Better Auth, session 7 hari, per-user data isolation

## Stack

| Layer | Teknologi |
|-------|-----------|
| Framework | Next.js 16 (App Router, RSC) |
| Database | PostgreSQL + Drizzle ORM |
| Auth | Better Auth |
| UI | shadcn/ui + Tailwind CSS v4 |
| Charts | Recharts |
| QR Code | qrcode.react |

## Setup Lokal

### 1. Install dependencies

```bash
pnpm install
```

### 2. Buat file `.env.local`

Salin dari contoh:

```bash
cp .env.example .env.local
```

Isi nilai berikut:

```env
DATABASE_URL=postgres://user:password@host:5432/dbname?sslmode=require
BETTER_AUTH_SECRET=isi-dengan-string-acak-minimal-32-karakter
BETTER_AUTH_URL=http://localhost:3000
```

Generate `BETTER_AUTH_SECRET`:
```bash
openssl rand -base64 32
```

### 3. Push schema ke database

```bash
pnpm db:push
```

Perintah ini akan membuat semua tabel yang dibutuhkan di database PostgreSQL kamu.

### 4. Jalankan dev server

```bash
pnpm dev
```

Buka [http://localhost:3000](http://localhost:3000), daftar akun, dan mulai pakai.

---

## Deploy ke Vercel

### 1. Push ke GitHub

```bash
git init
git add .
git commit -m "init: sayurkasir app"
git remote add origin https://github.com/username/sayurkasir.git
git push -u origin main
```

### 2. Import project di Vercel

Buka [vercel.com/new](https://vercel.com/new), import repo GitHub, dan set environment variables:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Connection string PostgreSQL kamu (Neon/Supabase/Railway/dll) |
| `BETTER_AUTH_SECRET` | String acak panjang |
| `BETTER_AUTH_URL` | URL production kamu, misal `https://sayurkasir.vercel.app` |

### 3. Push schema ke production database

Setelah deploy pertama, jalankan dari lokal (arahkan ke DATABASE_URL production):

```bash
DATABASE_URL="postgres://..." pnpm db:push
```

Atau gunakan Drizzle Studio untuk verifikasi:

```bash
pnpm db:studio
```

### Rekomendasi Database Gratis

- **[Neon](https://neon.tech)** — PostgreSQL serverless, free tier tersedia
- **[Supabase](https://supabase.com)** — PostgreSQL + dashboard, free tier tersedia

---

## Struktur Proyek

```
├── app/
│   ├── actions/          # Server Actions (products, transactions)
│   ├── api/auth/         # Better Auth handler
│   ├── laporan/          # Halaman laporan
│   ├── produk/           # Halaman manajemen produk
│   ├── riwayat/          # Halaman riwayat transaksi
│   ├── sign-in/          # Halaman login
│   └── sign-up/          # Halaman daftar
├── components/
│   ├── ui/               # shadcn/ui components
│   ├── app-shell.tsx     # Layout sidebar + mobile nav
│   ├── auth-form.tsx     # Form login/daftar
│   ├── history-view.tsx  # Riwayat transaksi
│   ├── pos-kasir.tsx     # POS utama + cash dialog + struk
│   ├── product-manager.tsx # CRUD produk
│   ├── qris-payment-dialog.tsx # Dialog QRIS
│   └── report-view.tsx   # Dashboard laporan
├── lib/
│   ├── auth.ts           # Better Auth server config
│   ├── auth-client.ts    # Better Auth client
│   ├── db/
│   │   ├── index.ts      # Drizzle instance
│   │   └── schema.ts     # Database schema
│   └── format.ts         # Helper format rupiah, angka, tanggal
├── middleware.ts          # Route protection (redirect ke /sign-in)
├── drizzle.config.ts      # Drizzle Kit config
└── .env.example           # Contoh environment variables
```

## Catatan QRIS

Implementasi QRIS saat ini adalah **simulasi** — QR code dibuat dari data JSON lokal, bukan dari gateway payment asli. Untuk integrasi QRIS sungguhan, kamu perlu mendaftar ke salah satu Payment Gateway seperti Midtrans, Xendit, atau DOKU dan mengganti logika di `qris-payment-dialog.tsx` dan `app/actions/transactions.ts`.
