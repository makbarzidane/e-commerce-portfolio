# Zimeira Hijab Store Operations

## Database Migration

Setelah perubahan `prisma/schema.prisma`, jalankan:

```bash
npm run prisma:generate
npm run db:push
node prisma/seed.js
```

`node prisma/seed.js` bisa dipakai bila Prisma CLI seed tertahan download engine di environment lokal.

## Backup Database

Backup PostgreSQL membutuhkan `pg_dump` tersedia di PATH.

```powershell
.\scripts\backup-postgres.ps1
```

Output backup tersimpan ke folder `backups/`.

## Setelah Listrik Mati / Restart Mesin

Pastikan database dan web server hidup kembali:

```powershell
docker start zimeira-postgres
npm run dev
```

Cek cepat:

```powershell
Invoke-WebRequest http://localhost:3000
```

## Restore Database

Restore dilakukan manual dengan `psql`:

```bash
psql "$DATABASE_URL" < backups/nama-file.sql
```

Jalankan restore hanya pada database staging atau database yang memang siap ditimpa.

## Notification Flow

WhatsApp link manual tersedia dari detail order admin. Email otomatis via Resend juga sudah disiapkan untuk:

- order dibuat
- payment sukses
- pesanan dikirim
- pesanan selesai

Isi env berikut untuk mengaktifkan email real:

```bash
RESEND_API_KEY="..."
RESEND_FROM_EMAIL="Zimeira Hijab Store <noreply@domainanda.com>"
```

Jika `RESEND_API_KEY` belum diisi, sistem tetap mencatat log notifikasi sebagai pending.

Jika API key pernah terlihat di file contoh, chat, atau screenshot, buat key baru di Resend lalu revoke key lama.

## OTP Nomor HP

OTP nomor HP memakai `FONNTE_API_KEY` jika tersedia. Jika key kosong, kode hanya tampil sebagai toast development dan log tersimpan sebagai pending.

```bash
FONNTE_API_KEY="..."
```

Untuk production, pastikan kode OTP tidak tampil di UI dan hanya dikirim ke nomor customer.

## Integrasi Real

Urutan test yang disarankan:

1. Isi `RESEND_API_KEY` dan sender domain terverifikasi.
2. Isi `FONNTE_API_KEY`, test OTP nomor HP.
3. Isi `MIDTRANS_*`, test Snap dan webhook simulator.
4. Isi `BITESHIP_API_KEY` atau `RAJAONGKIR_API_KEY`, test ongkir real.
5. Isi `CLOUDINARY_*`, test upload gambar produk dari admin.
6. Buka `/admin/pengaturan` dan pastikan semua status integrasi berubah menjadi `Siap`.

## Return / Refund

Schema dan UI dasar `ReturnRequest` sudah disiapkan:

- customer mengajukan retur
- admin approve/reject
- admin input nominal refund
- stok dikembalikan bila barang diterima
- payment status berubah menjadi `REFUNDED`

Untuk production, lengkapi SOP manual toko: syarat retur, batas hari pengajuan, dan bukti foto/video barang.
