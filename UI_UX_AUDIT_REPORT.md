# 🎨 UI/UX AUDIT REPORT — POSGO

Tanggal  : 2026-05-09
Auditor  : Antigravity (Senior AI Software Engineer)
Scope    : Halaman Kasir (`page.tsx`), `BillingSection.tsx`, `Navbar.tsx`
Platform : Semua (Fokus Mobile via Capacitor)

## Ringkasan Skor

| Dimensi                  | Skor (1–10) | Status |
| ------------------------ | ----------- | ------ |
| Konsistensi Visual       | 8 / 10      | Baik   |
| Usability                | 8 / 10      | Baik   |
| Responsivitas            | 7 / 10      | Baik   |
| Aksesibilitas            | 6 / 10      | Perlu Perbaikan |
| Alur Pengguna            | 8 / 10      | Baik   |
| Micro-interactions       | 7 / 10      | Baik   |
| Performa Persepsi        | 8 / 10      | Baik   |
| **Rata-rata**            | **7.4**     | **BAIK** |

Keterangan skor: 9–10 Sangat Baik | 7–8 Baik | 5–6 Perlu Perbaikan | < 5 Kritis

---

## Temuan Detail

### [UIUX-001] Kurangnya Aria-Label pada Tombol Ikon

- **Dimensi**   : Aksesibilitas (A11y)
- **Severity**  : MEDIUM
- **Komponen**  : `src/app/kasirgo/components/Navbar.tsx`
- **Platform**  : Semua
- **Masalah**   : Tombol kembali dan tombol pengaturan hanya berisi ikon `ArrowLeft` dan `Settings` tanpa teks pendukung atau `aria-label`. Screen reader tidak akan bisa membacanya dengan baik.
- **Dampak**    : Pengguna dengan keterbatasan penglihatan akan kesulitan mengetahui fungsi tombol.
- **Rekomendasi**: Tambahkan `aria-label` pada tombol yang hanya berisi ikon.
- **Contoh Implementasi**:

```tsx
// Sebelum
<button onClick={onBack} className="...">
  <ArrowLeft size={20} />
</button>

// Sesudah
<button onClick={onBack} className="..." aria-label="Kembali ke halaman sebelumnya">
  <ArrowLeft size={20} />
</button>
```

### [UIUX-002] Penggunaan Font Courier Hanya pada Struk

- **Dimensi**   : Konsistensi Visual
- **Severity**  : LOW
- **Komponen**  : `src/app/kasirgo/kasirgo.css`
- **Platform**  : Semua
- **Masalah**   : Sesuai permintaan user, font struk diubah menjadi Courier. Namun elemen aplikasi lainnya menggunakan font default (Geist atau Sans). Ini wajar untuk struk fisik, namun pastikan tidak bocor ke elemen UI kasir lainnya.
- **Dampak**    : Estetika struk sudah sesuai (retro/printer thermal), namun UI utama harus tetap modern.
- **Rekomendasi**: Pertahankan kondisi saat ini karena ini adalah fitur "Printer Emulation" yang bagus untuk struk.

### [UIUX-003] Touch Target Tombol Metode Pembayaran

- **Dimensi**   : Usability
- **Severity**  : LOW
- **Komponen**  : `src/app/kasirgo/components/BillingSection.tsx`
- **Platform**  : Mobile
- **Masalah**   : Tombol metode pembayaran memiliki tinggi `min-h-[40px]`. Standar WCAG menyarankan minimal `44px` untuk area sentuh jempol.
- **Dampak**    : Potensi salah pencet (fat finger) pada layar kecil.
- **Rekomendasi**: Ubah `min-h-[40px]` menjadi `min-h-[44px]` atau `min-h-[48px]`.
- **Contoh Implementasi**:

```tsx
className={`min-h-[44px] md:min-h-[50px] ...`}
```

---

## Prioritas Perbaikan

| # | Temuan | Severity | Estimasi Upaya |
| - | ------ | -------- | -------------- |
| 1 | [UIUX-001] Tambahkan Aria-Label pada tombol ikon | MEDIUM | Kecil |
| 2 | [UIUX-003] Perbesar min-height tombol pembayaran | LOW | Kecil |

## Rekomendasi Jangka Panjang

Untuk menjaga performa persepsi tetap tinggi, pertimbangkan untuk menerapkan **Optimistic UI** pada saat pencatatan transaksi (mengurangi stok secara lokal sebelum respon Supabase selesai) agar kasir tidak merasakan jeda tunggu sama sekali saat melayani pelanggan yang mengantre.
