<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your POSGO app

Aplikasi ini adalah sistem POS (Point of Sale) yang dibangun dengan React (Vite) dan dikonversi ke Android menggunakan Capacitor.

## Run Locally (Web)

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Jalankan aplikasi di browser:
   `npm run dev`

## Deploy to Android

Untuk menjalankan aplikasi di perangkat Android fisik atau emulator:

### 1. Persiapan Build
Setiap kali ada perubahan pada kode web (React), lakukan langkah ini:
```bash
npm run build
npx cap sync android
```

### 2. Cara Menjalankan (Pairing Wi-Fi)
Jika ingin menggunakan **Wireless Debugging** (Ikon Segitiga Hijau):
1. Pastikan HP dan Laptop di Wi-Fi yang sama.
2. Di HP: Masuk ke **Developer Options** > aktifkan **Wireless Debugging**.
3. Di Android Studio: 
   * Klik dropdown **Device Selector** (di toolbar atas, sebelah kiri ikon segitiga hijau).
   * Pilih **Pair Devices Using Wi-Fi**.
   * Scan QR Code yang muncul.
4. Setelah perangkat muncul di list, pilih perangkat tersebut.
5. Klik ikon **Segitiga Hijau (Run)** atau tekan `Shift + F10`.

### 3. Cara Menjalankan (Kabel USB)
1. Hubungkan HP dengan kabel USB.
2. Pastikan **USB Debugging** aktif di HP.
3. Klik ikon **Segitiga Hijau (Run)** di Android Studio.

---
**Catatan Penting:** Aplikasi ini berjalan 100% Offline menggunakan LocalStorage. Gunakan fitur **Backup/Restore** di dalam aplikasi untuk mengamankan data Anda.

