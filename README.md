# Zimeira Hijab Store

Demo custom ecommerce website bertema hijab untuk tahap fondasi. Project ini memakai Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, Prisma ORM, PostgreSQL, dan Auth.js / NextAuth.

## Fitur Saat Ini

- Customer pages: Beranda, Katalog Produk, Detail Produk, Keranjang, Checkout, Tentang, Kontak, Login/Register, Akun Saya, Riwayat Pesanan.
- Admin pages: Login Admin, Dashboard, Kelola Produk, Kategori, Varian Produk, Pesanan, Customer, Voucher, Banner Promo, Pengaturan Toko.
- Product foundation: nama, slug, kategori, deskripsi, harga normal/diskon, foto placeholder, variasi warna, bahan, stok, label, status aktif.
- Prisma schema awal: User, Product, ProductCategory, ProductImage, ProductVariant, Cart, CartItem, Order, OrderItem, Payment, ShippingAddress, Coupon, Banner, Review, Wishlist, StoreSetting.
- Auth.js / NextAuth credentials login untuk admin dan Google/Gmail verified login untuk customer jika env Google diisi.
- Register customer real ke database, dengan validasi awal agar email testing/disposable ditolak.
- Checkout customer mewajibkan nomor HP terverifikasi; mode demo OTP tersedia di halaman Akun dan siap diganti provider SMS/WhatsApp real.
- Proteksi route admin berdasarkan role `ADMIN`.
- Katalog, akun, pesanan, dan admin dashboard membaca Prisma jika database aktif, dengan fallback dummy untuk mode demo.
- CRUD dasar admin: kategori, produk, varian, voucher, banner promo, dan pengaturan toko.
- Admin dapat edit produk, kategori, varian, voucher, banner, status pesanan, status pembayaran, dan data resi/tracking.
- Cart database untuk user/session, termasuk tambah produk, update qty, dan hapus item.
- Wishlist tersimpan untuk user login.
- Detail produk mendukung pembelian beberapa varian sekaligus dengan dua aksi berbeda: `Masukkan Keranjang` dan `Beli Sekarang`.
- Checkout database membuat ShippingAddress, Order, OrderItem, Payment, memilih jasa kirim, memilih metode pembayaran, lalu mengosongkan cart.
- Checkout mendukung voucher aktif, validasi minimum belanja, pencatatan diskon, dan pengurangan stok varian otomatis.
- Halaman sukses checkout menampilkan instruksi pembayaran, ringkasan order, dan detail pengiriman.
- Admin dapat update status order, status payment, jasa kirim, estimasi, dan nomor resi.
- Customer dapat melihat detail pesanan, item, payment status, alamat, dan resi pengiriman.
- Cart dan checkout memvalidasi stok agar quantity tidak melebihi stok varian.
- UI form penting memiliki loading state, dan aksi hapus CMS/pesanan/keranjang memakai konfirmasi agar tidak mudah salah klik.
- Inventory log mencatat stok keluar, stok kembali, dan adjustment stok admin melalui `StockMovement`.
- Admin dapat melihat riwayat inventory di `/admin/inventory`.
- Admin dapat membuka detail order dari `/admin/pesanan/[orderNumber]`.
- Admin dapat melihat laporan penjualan mingguan, bulanan, dan tahunan di `/admin/laporan`.
- Admin dapat export data penjualan CSV melalui endpoint admin-only `/api/admin/reports/sales/export`.
- Mode demo payment/shipping aktif: manual transfer dan fallback ongkir courier demo. Midtrans Snap akan membuat transaksi real jika env key diisi.
- Webhook Midtrans memvalidasi signature dan mengubah status payment/order otomatis.
- Halaman sukses checkout dapat menampilkan link konfirmasi WhatsApp jika nomor toko sudah diisi.
- Upload gambar produk admin siap Cloudinary melalui route `/api/admin/upload/image`; jika env Cloudinary belum diisi, form tetap dapat memakai URL gambar manual.
- Halaman pengaturan admin menampilkan status integrasi Midtrans, RajaOngkir/Biteship, dan Cloudinary.
- Dummy data untuk kategori hijab, produk, varian, cart, order, dashboard, dan akun demo.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- Prisma ORM
- PostgreSQL
- NextAuth credentials provider untuk admin/customer demo dan Google provider untuk customer production

## Instalasi

```bash
npm install
```

Salin environment example:

```bash
copy .env.example .env
```

Isi `DATABASE_URL` dengan koneksi PostgreSQL lokal atau hosted. Ganti `NEXTAUTH_SECRET` dengan string acak yang panjang sebelum production.

Untuk login Google/Gmail customer, isi `GOOGLE_CLIENT_ID` dan `GOOGLE_CLIENT_SECRET` dari Google Cloud Console. Jika kosong, tombol Google otomatis disembunyikan dan login manual tetap berjalan.

Nomor HP customer harus diverifikasi sebelum checkout. Jika `FONNTE_API_KEY` kosong, OTP tampil lewat toast demo; jika key diisi, OTP dikirim melalui provider.

## Setup Database

Project ini dapat memakai PostgreSQL lokal. Pada setup saat ini database berjalan melalui Docker container:

```bash
docker start zimeira-postgres
```

Koneksi lokal yang dipakai di `.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/zimeira_hijab_store?schema=public"
```

Generate Prisma Client:

```bash
npm run prisma:generate
```

Push schema ke database:

```bash
npm run db:push
```

Isi dummy data:

```bash
npm run db:seed
```

Jika ingin menghentikan database lokal:

```bash
docker stop zimeira-postgres
```

Akun demo setelah seed:

- Admin: `admin@zimeirahijab.test` / `password123`
- Customer: `customer@zimeirahijab.test` / `password123`

## Menjalankan Project

```bash
npm run dev
```

Buka `http://localhost:3000`.

## Alur Admin

1. Jalankan setup database dan seed.
2. Buka `/admin/login`.
3. Login dengan `admin@zimeirahijab.test` / `password123`.
4. Kelola kategori, produk, varian, voucher, banner, dan pengaturan toko dari admin panel.

Tanpa login admin, route `/admin` akan diarahkan ke `/admin/login`.

## Struktur Folder Penting

- `src/app` berisi route App Router customer, admin, dan API Auth.
- `src/components/layout` berisi header dan footer customer.
- `src/components/product` berisi card produk dan filter katalog.
- `src/components/checkout` berisi checkout form interaktif untuk pilihan ongkir/pembayaran dan total order live.
- `src/components/admin` berisi shell admin dan stat card.
- `src/components/auth` berisi form login customer/admin.
- `src/components/ui` berisi komponen shadcn/ui.
- `src/components/ui/submit-button.tsx` berisi tombol submit dengan loading dan konfirmasi aksi.
- `src/lib/data.ts` berisi dummy data untuk UI tahap pertama.
- `src/lib/store-data.ts` berisi data access katalog dengan fallback dummy.
- `src/lib/admin-data.ts` berisi data access admin dengan fallback dummy.
- `src/lib/sales-report.ts` berisi data laporan penjualan dan export CSV.
- `src/lib/notifications.ts` berisi helper link WhatsApp order.
- `src/lib/customer-data.ts` berisi data access akun dan pesanan customer.
- `src/lib/cart.ts` berisi cart session dan cart item data access.
- `src/lib/integrations` berisi adapter awal payment, shipping, dan upload.
- `src/app/api/admin/upload/image/route.ts` berisi upload gambar admin ke Cloudinary.
- `src/app/api/admin/reports/sales/export/route.ts` berisi export CSV laporan penjualan admin.
- `src/lib/auth.ts` berisi konfigurasi NextAuth.
- `src/lib/admin.ts` berisi guard role admin.
- `src/lib/prisma.ts` berisi lazy Prisma Client.
- `src/app/admin/actions.ts` berisi Server Actions admin.
- `src/app/(shop)/pesanan/[orderNumber]` berisi detail pesanan customer.
- `src/app/(shop)/checkout/actions.ts` berisi Server Action checkout.
- `src/app/(shop)/keranjang/actions.ts` berisi Server Actions cart.
- `src/app/(shop)/wishlist/actions.ts` berisi Server Action wishlist.
- `src/app/api/webhooks/midtrans/route.ts` berisi webhook Midtrans dengan validasi signature dan update status payment/order.
- `src/app/admin/inventory` berisi riwayat pergerakan stok.
- `src/app/admin/pesanan/[orderNumber]` berisi detail order admin.
- `prisma/schema.prisma` berisi schema database.
- `prisma/seed.js` berisi dummy seed database.
- `public/images/products` berisi placeholder image produk.

## Rencana Pengembangan Berikutnya

- Integrasi Midtrans Snap/Core API real dan redirect ke payment URL.
- Validasi signature webhook Midtrans dan update status otomatis.
- Kalkulasi ongkir real RajaOngkir atau Biteship berdasarkan kota, berat, dan layanan kurir.
- Tracking pengiriman real dari provider kurir dan notifikasi status pesanan untuk customer.
- Optimasi gambar produk, multi-image gallery, dan hapus asset Cloudinary saat produk dihapus/nonaktif.
- Email notifikasi pesanan.
- Review produk dan rating customer.
- Audit keamanan, rate limiting form, dan hardening sebelum production.

## Checklist Sebelum Deploy

1. Pastikan `npm run lint`, `npx tsc --noEmit`, dan `npm run build` lolos.
2. Buat database PostgreSQL production, misalnya Neon, Supabase, Railway, atau provider lain.
3. Isi environment production:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL`
   - `FONNTE_API_KEY`
   - `MIDTRANS_SERVER_KEY`
   - `MIDTRANS_CLIENT_KEY`
   - `RAJAONGKIR_API_KEY` atau `BITESHIP_API_KEY`
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
4. Jalankan `npm run prisma:generate`, `npm run db:push`, lalu seed awal jika masih perlu data demo.
5. Ganti password akun admin demo atau buat admin production baru.
6. Test ulang flow customer: register, login, wishlist, cart, checkout, payment, dan riwayat pesanan.
7. Test ulang flow admin: CRUD produk/kategori/varian/voucher/banner, update order, export laporan, dan upload gambar.
8. Set webhook Midtrans production ke `/api/webhooks/midtrans`.
9. Deploy ke Vercel atau platform Next.js lain.
10. Setelah deploy, cek halaman publik, admin login, database production, dan export CSV dari URL production.
