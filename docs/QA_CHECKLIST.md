# Zimeira Hijab Store QA Checklist

Gunakan checklist ini sebelum staging dan sebelum production deploy.

## Customer End-to-End

- [ ] Login/register customer via Google jika `GOOGLE_CLIENT_ID` dan `GOOGLE_CLIENT_SECRET` tersedia.
- [ ] Register akun customer manual di `/auth/login?mode=register` jika mode demo/manual masih aktif.
- [ ] Reset password manual di `/auth/reset-password`, cek kode email atau kode development.
- [ ] Verifikasi nomor HP di `/akun`; checkout harus tertahan jika nomor belum diverifikasi.
- [ ] Buka katalog `/produk`.
- [ ] Cari dan filter produk.
- [ ] Tambahkan produk ke wishlist dan pastikan indikator berubah.
- [ ] Tambahkan produk ke keranjang tanpa pindah tab.
- [ ] Tambahkan minimal 2 varian dari produk yang sama.
- [ ] Buka keranjang dan cek quantity, subtotal, serta stok.
- [ ] Checkout tanpa login harus redirect ke login.
- [ ] Checkout setelah login harus membuka form alamat.
- [ ] Isi provinsi, kota, kecamatan, kode pos, alamat, dan nomor HP valid.
- [ ] Klik cek ongkir dan pilih kurir.
- [ ] Pilih manual transfer.
- [ ] Buat order dan pastikan cart kosong.
- [ ] Lihat order di `/pesanan`.
- [ ] Pindah halaman setelah order belum dibayar, lalu pastikan tombol bayar tetap ada di `/lacak`, `/pesanan`, dan `/pesanan/[orderNumber]`.
- [ ] Buka detail order dan cek payment, shipping, tracking, invoice.
- [ ] Cetak invoice ke PDF lewat halaman invoice.
- [ ] Jika Midtrans key tersedia, pilih Midtrans dan cek redirect/payment URL.

## Admin End-to-End

- [ ] Login admin di `/admin/login`.
- [ ] Dashboard menampilkan statistik, grafik penjualan, dan low-stock alert.
- [ ] CRUD kategori.
- [ ] CRUD produk.
- [ ] Buka `/admin/produk/[id]` dan edit gambar, label, status, harga.
- [ ] CRUD varian dan pastikan stok masuk log inventory.
- [ ] CRUD voucher.
- [ ] CRUD banner.
- [ ] Filter produk aktif/nonaktif.
- [ ] Filter order berdasarkan status, payment, tanggal, dan keyword.
- [ ] Update status order dan payment.
- [ ] Tambahkan resi dan cek detail order customer.
- [ ] Kirim notifikasi WhatsApp manual dari detail order admin.
- [ ] Hapus order bermasalah dan pastikan stok dikembalikan.
- [ ] Buka detail customer dan cek order, alamat, wishlist.
- [ ] Export laporan penjualan CSV mingguan/bulanan/tahunan.
- [ ] Upload gambar produk setelah Cloudinary env tersedia.

## Production Integration

- [ ] `NEXTAUTH_SECRET` kuat dan berbeda dari demo.
- [ ] Password admin demo diganti.
- [ ] `DATABASE_URL` production aktif.
- [ ] `CLOUDINARY_*` aktif dan upload berhasil.
- [ ] `BITESHIP_API_KEY` atau `RAJAONGKIR_API_KEY` aktif dan ongkir real berhasil.
- [ ] `FONNTE_API_KEY` aktif dan OTP nomor HP tidak lagi tampil via toast development.
- [ ] `RESEND_FROM_EMAIL` memakai domain toko yang sudah diverifikasi, bukan `onboarding@resend.dev`.
- [ ] `MIDTRANS_*` sandbox aktif.
- [ ] Midtrans webhook sukses, expired, failed, refund sudah diuji.
- [ ] Backup database diuji minimal sekali.
- [ ] Rate limit login/register/checkout/upload/shipping/webhook aktif.
