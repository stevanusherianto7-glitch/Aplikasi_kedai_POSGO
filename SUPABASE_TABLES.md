# 🗃️ DAFTAR TABEL SUPABASE — POSGO (FULL AUDIT)

Dokumen ini mencatat SELURUH tabel yang ada di database Supabase berdasarkan screenshot Table Editor dan skema SQL yang Anda berikan. Ini akan menjadi referensi utama bagi Antigravity.

---

## 📊 Daftar Lengkap Tabel (Total: 25 Tabel)

| No | Nama Tabel | Deskripsi | Kolom yang Diketahui |
|---|---|---|---|
| 1 | `absensi` | Data absensi karyawan (Bahasa Indonesia). | |
| 2 | `app_config` | Konfigurasi aplikasi (misal: tema, dll). | `id`, `value` |
| 3 | `attendances` | Data absensi karyawan (Bahasa Inggris). | |
| 4 | `cash_payment_methods` | Metode pembayaran tunai. | |
| 5 | `cash_sessions` | Sesi kasir (Buka/Tutup Kas). | |
| 6 | `daily_incomes` | Rekap pendapatan harian. | `id`, `date`, `amount` |
| 7 | `employees` | Data karyawan. | `id`, `name`, `role`, `salary` |
| 8 | `expenses` | Data pengeluaran operasional. | `id`, `description`, `amount`, `date` |
| 9 | `hpp_recipes` | Data resep dan perhitungan HPP. | `id`, `name`, `selling_price`, `markup_percent`, etc. |
| 10 | `incomes` | Data pendapatan (umum). | |
| 11 | `ingredients` | Data stok bahan baku. | `id`, `name`, `stock_quantity`, `purchase_price`, etc. |
| 12 | `kedai_assets` | Data aset fisik kedai. | `id`, `name`, `value`, `condition` |
| 13 | `maintenance_logs` | Log perawatan aset. | `id`, `asset_id`, `date`, `description` |
| 14 | `nomor_transactions_bill` | Riwayat transaksi penjualan (Billing). | `id`, `transaction_code`, `total`, `payment_method`, `items` (JSON) |
| 15 | `omset_harian` | Rekap omset harian. | |
| 16 | `order_items` | Detail item per pesanan. | |
| 17 | `orders` | Data pesanan (Orders). | |
| 18 | `products` | Data menu makanan/minuman yang dijual. | `id`, `name`, `category`, `price`, `is_active` |
| 19 | `promo_events` | Data event promo dan diskon. | `id`, `name`, `discount_percent`, `starts_at`, `ends_at`, `is_active` |
| 20 | `receipt_print_jobs` | Antrean cetak struk (PENTING untuk Printer!). | `id`, `receipt_id`, `job_status`, `queued_at`, `attempts`, `payload` |
| 21 | `receipts` | Data struk yang dicetak. | `id`, `source_type`, `source_id`, `print_status`, `printed_at`, `created_at` |
| 22 | `recipe_items` | Bahan baku per resep. | `id`, `recipe_id`, `ingredient_id`, `quantity_needed` |
| 23 | `recipes` | Data resep (mungkin versi lain dari hpp_recipes). | |
| 24 | `shift_patterns` | Pola shift kerja karyawan. | |
| 25 | `shifts` | Data shift kerja. | `id`, `name`, `start_time`, `end_time` |

---

*Catatan: Dokumen ini telah diperbarui secara lengkap pada tanggal 2026-05-08 berdasarkan bukti visual dan skema SQL dari user.*
