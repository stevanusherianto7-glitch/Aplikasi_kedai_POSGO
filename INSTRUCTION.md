# 📋 INSTRUCTION.md — POSGO

> **Dokumen wajib baca sebelum menyentuh kode apapun.**
> Berlaku untuk semua kontributor: manusia maupun agen AI.

---

## 🧭 Ringkasan Proyek

**POSGO** adalah aplikasi Point of Sale (POS) modern untuk UMKM Warung Makan yang dibangun di atas **Capacitor** — framework hybrid yang memungkinkan satu codebase web (React + Vite) dikompilasi menjadi aplikasi **Android**, **iOS**, maupun **PWA/Web**. Sistem ini dirancang sebagai *single-tenant SPA* yang mencakup manajemen bahan baku, penghitungan HPP (Harga Pokok Penjualan), kasir, SDM (Sumber Daya Manusia), dan laporan keuangan sederhana.

| Atribut | Detail |
|---|---|
| **Nama Proyek** | POSGO |
| **Versi** | 1.0.1 |
| **Framework Hybrid** | **Capacitor** (Ionic) |
| **Target Platform** | Android · iOS · PWA / Web |
| **Target Pengguna** | UMKM Warung Makan (single outlet) |
| **Deployment Web** | Vercel (SPA) |
| **Deployment Mobile** | Android APK / iOS IPA via Capacitor |
| **Bahasa UI** | Bahasa Indonesia |
| **Mode Tenant** | Single-tenant (satu `TENANT_ID` tetap, tanpa auth) |

---

## 🗺️ Diagram Alur Arsitektur

Berikut adalah gambaran visual alur data dan hubungan antar layer dalam aplikasi POSGO:

```
┌─────────────────────────────────────────────────────────┐
│                 Pengguna (Kasir / Admin)                 │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│             Browser / PWA                               │
│    React 19 · TypeScript · Vite · Tailwind · shadcn/ui  │
└────────────────────────┬────────────────────────────────┘
                         │
              ┌──────────▼──────────┐
              │      App.tsx        │
              │ ErrorBoundary · tab │
              │ routing · Provider  │
              └──────────┬──────────┘
                         │
              ┌──────────▼──────────────────┐
              │     useAppState (Hook)       │
              │  Global state · CRUD Supabase│
              │  mapping row ↔ TypeScript    │
              └──────────┬──────────────────┘
                         │
              ┌──────────▼──────────┐
              │     Layout.tsx       │
              │ Sidebar · Bottom Nav │
              └──┬──┬────────┬──┬───┘
                 │  │        │  │
    ┌────────────┘  │        │  └────────────┐
    │           ┌───┘        └───┐           │
    ▼           ▼                ▼           ▼
┌───────┐ ┌──────────┐  ┌──────────┐ ┌────────────┐
│ Home  │ │  Bahan   │  │HPP/Resep │ │    SDM     │
│Engine │ │  Baku    │  │ Recipe   │ │ Karyawan   │
│Dashbd │ │ Manager  │  │ Manager  │ │ Absensi    │
│+Sales │ │          │  │          │ │ Shift      │
│ Sync  │ │          │  │          │ │            │
└───┬───┘ └──────────┘  └──────────┘ └────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│               SERVICES & HOOKS LAYER                    │
├──────────────────┬─────────────────────┬────────────────┤
│  pdfService.ts   │thermalPrinterService│useThermalPrint │
│  jsPDF · canvas  │Web Bluetooth·ESC/POS│Status · Config │
└──────┬───────────┴──────────┬──────────┴────┬───────────┘
       │                      │               │
┌──────▼───────────────────┐  │    ┌──────────▼───────────┐
│   Supabase (PostgreSQL)  │  │    │     localStorage      │
│ ingredients · recipes    │  │    │  tema · shift pattern │
│ employees · transactions │  │    │  printer config       │
│ attendances · expenses   │  │    └──────────────────────┘
└──────────────────────────┘  │
                              ▼
                   ┌─────────────────────┐
                   │  Bluetooth Thermal   │
                   │  Printer             │
                   │  Epson/SUNMI/Xprinter│
                   └─────────────────────┘

DEPLOYMENT:
  Kode → Vercel (SPA) → Browser
  Env vars: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, GEMINI_API_KEY
```

### Penjelasan Alur Data

**Alur Baca (Read):**
`Komponen` → `useAppState` → `supabase.from('tabel').select()` → `rowToX()` → `React State` → `Render`

**Alur Tulis (Write):**
`Komponen` → fungsi `handle*` di `useAppState` → `xToRow()` → `supabase.from('tabel').insert/update()` → update `React State`

**Alur Cetak Struk:**
`SalesSync` → `onPrintTransaction()` → `useThermalPrinter` → `thermalPrinterService` → `Web Bluetooth API` → `ESC/POS bytes` → `Printer`

**Alur Export PDF:**
`Komponen` → `pdfService.ts` → `jsPDF` + `html2canvas` → file `.pdf` di browser

---

## 🏗️ Arsitektur Proyek

```
posgo/
├── src/
│   ├── App.tsx                    # Root komponen, routing tab, global state consumer
│   ├── main.tsx                   # Entry point React
│   ├── index.css                  # Global CSS (Tailwind base, custom variables)
│   ├── types.ts                   # Semua TypeScript interface & type global
│   ├── constants.ts               # Konstanta statis (CATEGORIES, UNITS, SOP markdown)
│   ├── schedulerConstants.ts      # Konstanta untuk fitur jadwal shift
│   │
│   ├── lib/
│   │   ├── supabase.ts            # Inisialisasi Supabase client (singleton)
│   │   └── utils.ts               # Helper: cn(), formatCurrency()
│   │
│   ├── hooks/
│   │   ├── useAppState.ts         # 🔑 Master state hook — CRUD ke Supabase
│   │   ├── useThermalPrinter.ts   # Hook manajemen printer Bluetooth thermal
│   │   └── usePWAInstall.ts       # Hook PWA install prompt
│   │
│   ├── services/
│   │   ├── pdfService.ts          # Export PDF (jsPDF + autotable + html2canvas)
│   │   └── thermalPrinterService.ts # Web Bluetooth API + ESC/POS protocol
│   │
│   └── components/
│       ├── Layout.tsx             # Shell UI: sidebar desktop + bottom nav mobile
│       ├── Logo.tsx               # SVG logo POSGO
│       ├── PriceInput.tsx         # Input harga dengan format Rupiah
│       ├── VarianceReport.tsx     # Laporan varians stok
│       │
│       ├── EngineDashboard.tsx    # Tab Home: ringkasan omzet, stok, kasir
│       ├── SalesSync.tsx          # Dialog kasir: keranjang belanja & transaksi
│       ├── BahanManager.tsx       # Tab Bahan Baku: CRUD stok bahan
│       ├── RecipeManager.tsx      # Tab HPP: kalkulasi harga pokok resep
│       ├── StorageManager.tsx     # Manajemen gudang & stok opname
│       ├── HistoryManager.tsx     # Riwayat transaksi
│       ├── PettyCashManager.tsx   # Kas kecil & pengeluaran
│       ├── Dashboard.tsx          # Dashboard laporan (omzet, laba, grafik)
│       ├── PrinterSettingsDialog.tsx # Dialog konfigurasi printer thermal
│       ├── JobdeskManager.tsx     # Tab SDM > Jobdesk & SOP
│       │
│       ├── sdm/
│       │   ├── AttendanceGrid.tsx # Grid absensi karyawan
│       │   └── ShiftCheatSheet.tsx # Ringkasan jadwal shift
│       │
│       ├── scheduler/
│       │   ├── SchedulerHeader.tsx # Header jadwal
│       │   ├── ScheduleGrid.tsx    # Grid jadwal shift
│       │   ├── PatternManager.tsx  # Manajemen pola shift
│       │   └── GlossyButton.tsx    # Tombol custom scheduler
│       │
│       └── ui/                    # shadcn/ui components (jangan dimodifikasi manual)
│           ├── button.tsx
│           ├── card.tsx
│           ├── dialog.tsx
│           ├── input.tsx
│           └── ... (dan lainnya)
│
├── supabase_schema.sql            # DDL lengkap semua tabel Supabase
├── vite.config.ts                 # Konfigurasi Vite + alias @/
├── vercel.json                    # Konfigurasi deploy Vercel (SPA rewrite)
├── components.json                # Konfigurasi shadcn/ui
├── .env.example                   # Template environment variables
└── package.json                   # Dependencies & scripts
```

---

## ⚙️ Tech Stack

### Frontend Core
| Library | Versi | Kegunaan |
|---|---|---|
| **React** | ^19.0.0 | UI framework utama |
| **TypeScript** | ~5.8.2 | Type safety |
| **Vite** | ^6.2.0 | Build tool & dev server |
| **Tailwind CSS** | ^4.1.14 | Styling utility-first |

### UI & Komponen
| Library | Versi | Kegunaan |
|---|---|---|
| **shadcn/ui** | ^4.2.0 | Komponen UI siap pakai |
| **Lucide React** | ^0.546.0 | Icon library |
| **Motion (Framer)** | ^12.23.24 | Animasi |
| **@base-ui/react** | ^1.3.0 | Primitive UI headless |
| **Vaul** | ^1.1.2 | Drawer/bottom sheet |

### Backend & Database
| Library | Versi | Kegunaan |
|---|---|---|
| **Supabase JS** | ^2.103.0 | Database client (PostgreSQL) |

### Fitur Khusus
| Library | Versi | Kegunaan |
|---|---|---|
| **jsPDF** | ^4.2.1 | Generate PDF laporan |
| **jsPDF-autotable** | ^5.0.7 | Tabel otomatis di PDF |
| **html2canvas** | ^1.4.1 | Screenshot DOM ke canvas |
| **html-to-image** | ^1.11.13 | Export HTML sebagai gambar |
| **docx** | ^9.6.1 | Export dokumen Word |
| **@google/genai** | ^1.29.0 | Gemini AI API (opsional) |

### Fonts & Style
| Library | Kegunaan |
|---|---|
| **@fontsource-variable/geist** | Font utama (Geist Variable) |
| **@tailwindcss/typography** | Styling konten markdown |

---

## 🗄️ Skema Database (Supabase / PostgreSQL)

Semua tabel menggunakan kolom `user_id UUID` sebagai **soft tenant filter**. Nilai `TENANT_ID` bersifat tetap (hardcoded) di `useAppState.ts`.

```
TENANT_ID = 'e57a0505-1234-5678-90ab-c0de57f17ac1'
```

### Tabel-Tabel Utama

| Tabel | Fungsi |
|---|---|
| `ingredients` | Stok bahan baku (nama, kategori, harga beli, unit, konversi, stok) |
| `recipes` | Resep & kalkulasi HPP (harga jual, markup, biaya tenaga, overhead, susut) |
| `recipe_items` | BOM (Bill of Materials) — relasi resep ke bahan baku |
| `employees` | Data karyawan (nama, jabatan, gaji) |
| `transactions` | Riwayat transaksi penjualan |
| `shifts` | Jadwal shift per karyawan per tanggal |
| `shift_patterns` | Pola shift mingguan karyawan (JSONB) |
| `attendances` | Data absensi harian karyawan |
| `expenses` | Pengeluaran & kas kecil |
| `app_config` | Konfigurasi aplikasi (misal: saldo petty cash) |

### Row Level Security (RLS)
- **Semua tabel** menggunakan RLS dengan policy `Public manage by tenant id`.
- Query hanya lolos jika `user_id = TENANT_ID`.
- **Tidak ada autentikasi pengguna** — aplikasi bersifat open single-tenant.

---

## 🔄 Pola State Management

State global dikelola sepenuhnya oleh hook `useAppState` di `src/hooks/useAppState.ts`.

```
useAppState()
  ├── State: ingredients, recipes, employees, transactions, attendances, expenses, pettyCash
  ├── State lokal (localStorage): theme, shifts, weeklyPattern, printer config
  └── CRUD functions: handleAddIngredient, handleSaveEmployee, deleteIngredient, dst.
```

**Alur data:**
1. Komponen memanggil fungsi dari `useAppState`
2. `useAppState` melakukan operasi ke Supabase
3. State di-update → React re-render otomatis

**Data yang disimpan di `localStorage` (bukan Supabase):**
- `resto-theme` — preferensi tema terang/gelap
- `resto-shift-data` — data jadwal shift
- `resto-shift-pattern` — pola shift mingguan
- `posgo-printer-config` — konfigurasi printer thermal
- `posgo-auto-print` — status auto-print

---

## 🖨️ Integrasi Printer Thermal

POSGO mendukung cetak struk via **Web Bluetooth API** dengan protokol **ESC/POS**.

- **Service**: `thermalPrinterService.ts` — koneksi, encoding, perintah ESC/POS
- **Hook**: `useThermalPrinter.ts` — state printer, config toko, auto-print
- **UI**: `PrinterSettingsDialog.tsx` — dialog pengaturan printer
- Kompatibel dengan: Epson TM, SUNMI, Gainscha, iDPRT, Xprinter, RPP series
- Mendukung dua BLE profile: **Printer Service UUID** & **Nordic UART Service**

---

## 🌐 Routing & Navigasi

Aplikasi menggunakan **tab-based routing** (bukan React Router). State `activeTab` dikelola di `App.tsx`.

| Tab ID | Komponen | Deskripsi |
|---|---|---|
| `home` | `EngineDashboard` | Dashboard kasir & ringkasan |
| `bahan` | `BahanManager` | Manajemen bahan baku |
| `resep` | `RecipeManager` | Kalkulasi HPP |
| `karyawan` | (inline di App.tsx) | SDM, jobdesk, absensi, shift |

---

## 🚀 Deployment

### Web (Vercel)
- **Platform**: Vercel
- **Build command**: `vite build`
- **Output**: `dist/`
- `vercel.json` mengkonfigurasi SPA rewrite: semua path → `/index.html`
- Environment variables di-set langsung di dashboard Vercel

### Mobile (Capacitor)
POSGO adalah **proyek Capacitor**. Web assets dikompilasi lalu disalin ke native project Android/iOS.

**Alur build mobile:**
```bash
# 1. Build web assets
npm run build

# 2. Salin dist/ ke native project
npx cap sync

# 3a. Buka di Android Studio
npx cap open android

# 3b. Buka di Xcode (iOS)
npx cap open ios
```

**Perintah penting Capacitor:**

| Perintah | Fungsi |
|---|---|
| `npx cap init` | Inisialisasi Capacitor di project (sudah dilakukan) |
| `npx cap add android` | Tambah platform Android |
| `npx cap add ios` | Tambah platform iOS |
| `npx cap sync` | Build web + sync ke native (wajib setelah `npm run build`) |
| `npx cap copy` | Hanya salin web assets tanpa update plugin |
| `npx cap update` | Update native dependencies |
| `npx cap run android` | Build & jalankan di emulator/device Android |
| `npx cap run ios` | Build & jalankan di emulator/device iOS |

**Konfigurasi Capacitor** ada di `capacitor.config.ts` (atau `capacitor.config.json`) di root project:
```ts
// capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.posgo.app',
  appName: 'POSGO',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};
```

> ⚠️ **Penting untuk Agen AI**: Jangan pernah menghapus folder `android/` atau `ios/` — ini adalah native project yang di-generate Capacitor. Perubahan kode hanya dilakukan di `src/`, lalu jalankan `npx cap sync`.

**Plugin Capacitor yang mungkin digunakan:**
- `@capacitor/core` — runtime utama
- `@capacitor-community/bluetooth-le` — Bluetooth untuk printer thermal di mobile
- `@capacitor/filesystem` — akses file sistem (export PDF)
- `@capacitor/share` — share dokumen

---

## 🔑 Environment Variables

```env
VITE_SUPABASE_URL=       # URL project Supabase (wajib)
VITE_SUPABASE_ANON_KEY=  # Anon key Supabase (wajib)
GEMINI_API_KEY=          # Gemini AI key (opsional)
```

> ⚠️ Prefix `VITE_` **wajib** ada agar variable terbaca oleh Vite di sisi client.

---

## 🔐 Kredensial Proyek

> ⚠️ **RAHASIA** — Jangan dibagikan secara publik. Jangan di-commit ke repository.

### Supabase

| Key | Value |
|---|---|
| **Project URL** | `https://mrrfmrzhumcmhmqjceul.supabase.co` |
| **Anon Key (publishable)** | `sb_publishable__YgmAFLxNl1Tr5XmeKikXA_Q1SnPa1f` |
| **Dashboard** | `https://supabase.com/dashboard/project/mrrfmrzhumcmhmqjceul` |

File `.env` lokal yang harus dibuat (jangan di-commit):

```env
VITE_SUPABASE_URL=https://mrrfmrzhumcmhmqjceul.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable__YgmAFLxNl1Tr5XmeKikXA_Q1SnPa1f
```

### GitHub

| Key | Value |
|---|---|
| **Repository** | `https://github.com/stevanusherianto7-glitch/Aplikasi_kedai_POSGO` |
| **Branch utama** | `main` |
| **Clone (HTTPS)** | `git clone https://github.com/stevanusherianto7-glitch/Aplikasi_kedai_POSGO.git` |

### Tenant ID (Supabase RLS)

```ts
// src/hooks/useAppState.ts
const TENANT_ID = 'e57a0505-1234-5678-90ab-c0de57f17ac1';
```

Nilai ini digunakan sebagai filter RLS di semua tabel Supabase. **Jangan diubah.**

---

---

# 🏆 GOLDEN RULES

> Aturan ini **tidak boleh dilanggar** dalam kondisi apapun.

---

### RULE 1 — Jangan Ubah `TENANT_ID`
`TENANT_ID` di `useAppState.ts` adalah identifier tetap single-tenant. **Jangan pernah mengubah, memindahkan, atau menjadikannya dinamis** tanpa persetujuan eksplisit pemilik proyek. Mengubahnya akan memutus akses ke semua data di Supabase.

### RULE 2 — Jangan Modifikasi Komponen `ui/` Secara Manual
Folder `src/components/ui/` dikelola oleh **shadcn/ui**. Modifikasi manual akan tertimpa saat update. Jika perlu kustomisasi, bungkus komponen tersebut dalam komponen baru di level yang lebih tinggi.

### RULE 3 — Semua State Global Melalui `useAppState`
**Dilarang** membuat state Supabase di luar `useAppState.ts`. Setiap penambahan data baru ke Supabase **harus** ditambahkan sebagai fungsi dan state di dalam hook tersebut, lalu di-expose ke komponen.

### RULE 4 — Jangan Gunakan `any` Kecuali Terpaksa
TypeScript di proyek ini ketat (`tsc --noEmit` sebagai lint). Hindari `any`. Gunakan tipe yang sudah ada di `src/types.ts`. Jika perlu tipe baru, **tambahkan ke `types.ts`**, bukan inline di komponen.

### RULE 5 — Gunakan Alias `@/` untuk Import
Selalu gunakan alias `@/` untuk import internal, bukan path relatif yang panjang.
```ts
// ✅ Benar
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

// ❌ Salah
import { Button } from '../../../components/ui/button';
```

### RULE 6 — Mapping snake_case ↔ camelCase Wajib Konsisten
Supabase mengembalikan data dalam `snake_case`. TypeScript interface menggunakan `camelCase`. **Selalu** gunakan helper mapper (`ingredientToRow`, `rowToIngredient`, dst.) yang sudah ada di `useAppState.ts`. Jangan akses field Supabase langsung di komponen.

### RULE 7 — Tambahkan `user_id: TENANT_ID` di Setiap Insert
Setiap data baru yang ditulis ke Supabase **wajib menyertakan** `user_id: TENANT_ID`. Tanpa ini, RLS akan memblokir semua operasi read/write.

### RULE 8 — Jangan Hapus Error Boundary
`ErrorBoundary` di `App.tsx` adalah safety net produksi. Jangan dihapus atau dinonaktifkan. Jika ada error yang tidak tertangani, perbaiki sumbernya, bukan wrappernya.

### RULE 9 — `localStorage` Hanya untuk Data Non-Kritis
Data bisnis (bahan, resep, transaksi, karyawan) **wajib di Supabase**. `localStorage` hanya untuk preferensi UI dan konfigurasi perangkat (tema, printer config, shift pattern). Jangan simpan data transaksi atau keuangan di `localStorage`.

### RULE 10 — Jangan Commit Secrets ke Git
File `.env` dan `vercel.json` yang berisi API key nyata **tidak boleh di-commit**. Gunakan `.env.example` sebagai template. Pastikan `.env` dan `.env.local` ada di `.gitignore`.

### RULE 11 — Jangan Modifikasi Folder Native Capacitor Secara Manual
Folder `android/` dan `ios/` adalah hasil generate Capacitor dan dikelola via `npx cap sync`. **Jangan edit file di dalamnya secara langsung** kecuali untuk konfigurasi native (permissions, icons, splash screen) yang memang harus dilakukan di level native. Semua perubahan logika dan UI dilakukan di `src/`, kemudian di-sync dengan `npx cap sync`.

### RULE 12 — Selalu Jalankan `npx cap sync` Setelah Build
Setiap kali ada perubahan kode yang akan di-deploy ke mobile, alurnya wajib: `npm run build` → `npx cap sync`. Jangan langsung buka Android Studio / Xcode tanpa sync terlebih dahulu, karena web assets yang tertanam di native project akan ketinggalan.

### RULE 13 — Jujur: Jangan Klaim Sudah Melakukan Sesuatu Jika Belum
Ini adalah aturan integritas kerja yang paling mendasar.

**Dilarang keras:**
- Bilang *"sudah saya perbaiki"* padahal hanya menjelaskan caranya
- Bilang *"kode sudah diupdate"* padahal hanya menampilkan cuplikan kode tanpa benar-benar mengeditnya
- Bilang *"bug sudah teratasi"* sebelum ada verifikasi nyata
- Bilang *"sudah saya tambahkan ke file"* padahal file belum disentuh
- Menyembunyikan ketidakmampuan mengakses file dengan jawaban ambigu

**Yang wajib dilakukan:**
- Jika hanya memberikan panduan/instruksi → katakan *"Berikut cara memperbaikinya, silakan terapkan di file..."*
- Jika sudah benar-benar mengedit file → katakan *"Saya sudah mengubah baris X di file Y"* dan tunjukkan diff-nya
- Jika tidak bisa mengakses atau mengedit file → katakan terus terang *"Saya tidak bisa langsung mengedit file ini, berikut kodenya untuk kamu terapkan sendiri"*
- Jika belum yakin fix-nya benar → katakan *"Ini solusi yang saya usulkan, perlu ditest terlebih dahulu"*

> **Kepercayaan tim dibangun dari kejujuran, bukan dari laporan palsu. Satu klaim bohong merusak seluruh sesi kerja.**

---

## 🤖 PETUNJUK KHUSUS UNTUK AGEN AI

Bagian ini **wajib dibaca** sebelum melakukan perubahan apapun pada kodebase.

---

## Sebelum Menulis Kode

- [ ] **Baca `src/types.ts` terlebih dahulu** — pahami semua interface yang ada sebelum membuat tipe baru.
- [ ] **Baca `src/hooks/useAppState.ts`** — pahami state yang tersedia dan cara aksesnya sebelum membuat state baru.
- [ ] **Cek apakah komponen yang dibutuhkan sudah ada** di `src/components/` sebelum membuat komponen baru.
- [ ] **Jangan berasumsi** tentang nama tabel atau kolom Supabase — selalu rujuk ke `supabase_schema.sql`.

---

## Pola yang Benar vs Salah

### ✅ Menambah field baru ke tipe yang ada
```ts
// src/types.ts — tambahkan di sini
export interface Recipe {
  id: string;
  name: string;
  category: string; // sudah ada
  notes?: string;   // tambahan baru
  ...
}
```

### ❌ Membuat tipe inline di komponen
```ts
// JANGAN lakukan ini di dalam komponen
const recipe: { id: string; name: string } = ...
```

---

### ✅ Menambah fungsi CRUD baru
```ts
// Di useAppState.ts — tambahkan fungsi baru di sini
const handleUpdateIngredient = async (ing: Ingredient) => {
  const { error } = await supabase
    .from('ingredients')
    .update(ingredientToRow(ing))
    .eq('id', ing.id);
  if (!error) setIngredients(prev => prev.map(i => i.id === ing.id ? ing : i));
};
```

### ❌ Langsung query Supabase dari dalam komponen
```ts
// JANGAN lakukan ini di dalam komponen
const { data } = await supabase.from('ingredients').select('*');
```

---

### ✅ Import komponen UI
```ts
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
```

### ❌ Membuat button/card custom sendiri jika sudah ada di ui/
```ts
// JANGAN buat ulang komponen yang sudah ada di ui/
<div className="border rounded p-4">...</div> // Gunakan <Card> saja
```

---

## Kesalahan Umum yang Harus Dihindari

| ❌ Kesalahan | ✅ Yang Benar |
|---|---|
| Lupa tambah `user_id: TENANT_ID` saat insert | Selalu sertakan di setiap write ke Supabase |
| Menggunakan `any` untuk data dari Supabase | Gunakan mapper `rowToX()` yang sudah ada |
| Mengubah nama kolom Supabase tanpa update schema | Selalu sinkronkan `supabase_schema.sql` |
| Menyimpan data bisnis di `localStorage` | Gunakan Supabase untuk semua data persisten |
| Import path relatif panjang `../../..` | Gunakan alias `@/` |
| Memanggil `supabase` langsung dari komponen | Semua query melalui `useAppState` |
| Membuat state duplikat di komponen | Gunakan state dari `useAppState` |
| Memodifikasi file di `src/components/ui/` | Buat wrapper komponen baru |
| Lupa menangani loading state `isLoaded` | Selalu cek `isLoaded` sebelum render data |
| Tidak menangani error dari Supabase | Selalu periksa `{ error }` dari setiap operasi |
| Edit langsung folder `android/` atau `ios/` | Edit di `src/`, lalu `npx cap sync` |
| Lupa `npx cap sync` setelah `npm run build` | Wajib sync sebelum buka Android Studio/Xcode |
| Menggunakan Web Bluetooth API langsung di mobile | Gunakan plugin `@capacitor-community/bluetooth-le` untuk Android/iOS |

---

## Konvensi Penamaan

| Entitas | Konvensi | Contoh |
|---|---|---|
| Komponen React | PascalCase | `BahanManager`, `SalesSync` |
| Hooks | camelCase + `use` prefix | `useAppState`, `useThermalPrinter` |
| Fungsi handler | camelCase + `handle` prefix | `handleAddIngredient`, `handleSaveEmployee` |
| File komponen | PascalCase.tsx | `RecipeManager.tsx` |
| File hook/service | camelCase.ts | `useAppState.ts`, `pdfService.ts` |
| Tabel Supabase | snake_case | `recipe_items`, `shift_patterns` |
| Kolom Supabase | snake_case | `purchase_price`, `low_stock_threshold` |
| TypeScript interface | PascalCase | `Ingredient`, `Recipe`, `Employee` |
| Field interface | camelCase | `purchasePrice`, `stockQuantity` |

---

## Cara Menambah Fitur Baru (Checklist)

Saat diminta menambah fitur baru yang melibatkan data persisten:

1. **Desain tipe** — Tambahkan interface baru di `src/types.ts`
2. **Update schema** — Tambahkan tabel/kolom baru di `supabase_schema.sql`
3. **Buat mapper** — Tambahkan `xToRow()` dan `rowToX()` di `useAppState.ts`
4. **Tambah state & CRUD** — Tambahkan state dan fungsi CRUD di `useAppState.ts`
5. **Buat/update komponen** — Bangun UI di `src/components/`
6. **Expose di App.tsx** — Hubungkan ke tab navigasi jika diperlukan

---

## 🚨 Integritas & Kejujuran dalam Coding

Ini adalah standar perilaku yang **tidak bisa dikompromikan**. Agen AI yang bekerja di proyek ini wajib jujur tentang apa yang sudah dan belum dilakukan.

### Status yang Wajib Digunakan Secara Tepat

| Situasi | Kalimat yang BENAR | Kalimat yang DILARANG |
|---|---|---|
| Menampilkan contoh kode tanpa mengedit file | *"Berikut kode yang perlu kamu tambahkan ke `X.ts`..."* | *"Sudah saya tambahkan ke `X.ts`"* |
| Menjelaskan solusi tanpa mengeksekusi | *"Cara memperbaikinya adalah..."* | *"Sudah saya perbaiki"* |
| Memberikan instruksi manual | *"Jalankan perintah ini di terminal kamu..."* | *"Sudah saya jalankan"* |
| Fix yang belum diverifikasi | *"Coba solusi ini, perlu ditest dulu"* | *"Bug sudah teratasi"* |
| Tidak bisa akses file | *"Saya tidak bisa buka file itu, tapi berikut panduannya..."* | *(jawaban ambigu tanpa pengakuan)* |

### Aturan Pelaporan Perubahan Kode

Setiap kali agen AI mengklaim telah mengubah kode, wajib menyertakan:

```
File    : src/path/ke/file.ts
Baris   : 42-48 (sebelum) → 42-51 (sesudah)
Perubahan: [deskripsi singkat apa yang diubah]
```

Jika tidak bisa menampilkan bukti perubahan seperti di atas, berarti perubahan **belum terjadi** dan harus diakui demikian.

### Mengapa Ini Penting

Bug yang dilaporkan "sudah fixed" padahal belum akan:
- Membuang waktu debugging di tempat yang salah
- Membuat deployment produksi rusak
- Menghancurkan kepercayaan antara developer dan AI agent

> **Lebih baik jujur "belum bisa" daripada bohong "sudah selesai".**

---

## Konteks Bisnis Penting

- Semua nilai uang dalam **Rupiah (IDR)**, tanpa desimal (integer).
- Unit bahan baku: `kg`, `gr`, `ml`, `l`, `pcs`, `pack`, `sdm`, `sdt`, `btl`, `cup`, `tray`.
- Konversi unit selalu antara `purchaseUnit` (unit beli) ke `useUnit` (unit pakai).
- HPP dihitung dari: `(harga bahan × qty) + biaya tenaga + overhead + margin susut`.
- Status absensi: `'Hadir' | 'Izin' | 'Alpha' | 'Sakit' | 'off'`.
- Jenis shift: `'Pagi' | 'Sore' | 'Full' | 'Off'`.
- Kategori pengeluaran: `'Operasional' | 'Bahan Baku' | 'Gaji' | 'Lainnya'`.

---

*Dokumen ini harus diperbarui setiap kali ada perubahan arsitektur, tabel database baru, atau library baru yang ditambahkan.*

**Versi dokumen: 1.0.0 | Terakhir diperbarui: Mei 2026**
