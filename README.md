# 🧮 Kalkulator Ilmiah Pro (Scientific Calculator)

[![C++17](https://img.shields.io/badge/C++-17-00599C?style=for-the-badge&logo=c%2B%2B&logoColor=white)](https://isocpp.org/)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

Aplikasi **Kalkulator Ilmiah Pro** dengan algoritma parsing matematika berpresisi tinggi (*Recursive Descent Parser*). Proyek ini hadir dalam dua versi:
1. **Versi Web UI/UX Modern** — Antarmuka grafis *Glassmorphism Cyber Obsidian*, dilengkapi visualisasi grafik fungsi 2D, efek suara tombol mekanik (*Web Audio API*), dan riwayat perhitungan interaktif.
2. **Versi Desktop Console C++ (C++17)** — Program konsol cepat dan efisien yang dikompilasi menggunakan GCC/MinGW (MSYS2 UCRT64).

---

## 🌟 Fitur Utama

### 1. Web UI/UX Modern (`index.html`)
- **Desain Glassmorphism & Cyber Obsidian**: Efek blur transparan modern, partikel cahaya ambient dinamis, serta tipografi jernih (*Outfit* & *JetBrains Mono*).
- **Dark Mode & Light Mode**: Tombol peralihan tema yang tersimpan otomatis di *localStorage*.
- **Pembuat Grafik Fungsi 2D (Interactive Function Plotter)**:
  - Memplot kurva matematika (misal: $\sin(x) \cdot x$, $x^2 - 4$, $\sqrt{x}$, dll.).
  - Kontrol Zoom In/Out, pergeseran kanvas (*Pan*), dan pelacakan koordinat $(x, y)$ kursor *real-time*.
- **Efek Suara Taktil (Web Audio API)**: Umpan balik suara klik mekanik sintetis saat tombol ditekan (dapat diaktifkan/dinonaktifkan).
- **Riwayat Kalkulasi**:
  - Menyimpan setiap riwayat perhitungan secara lokal.
  - Klik riwayat untuk memuat ulang formula ke kalkulator.
- **Dukungan Keyboard Fisik Penuh**:
  - `0-9`, `.`, operator `+ - * / % ^ ( )`
  - `Enter` atau `=` untuk mengeksekusi perhitungan
  - `Backspace` untuk menghapus satu karakter
  - `Escape` untuk *All Clear* (AC)
- **Tombol Memori Lengkap**: `MC`, `MR`, `M+`, `M-`, `MS`, dan tombol salin hasil (*Copy to Clipboard*).

---

### 2. Program Konsol C++ (`kalkulator_ilmiah.cpp`)
- Menggunakan standar **C++17**.
- Implementasi algoritma *Recursive Descent Expression Parser* tanpa ketergantungan library pihak ketiga.
- Penanganan error yang aman (*Division by zero*, *Domain error*, sintaks kurung tidak lengkap).
- Konfigurasi IDE bawaan (`.clangd`, `tasks.json`, `launch.json`) untuk kemudahan build dan debug dengan compiler GCC/MinGW.

---

## 📐 Operasi Matematika yang Didukung

| Kategori | Simbol / Nama | Keterangan & Contoh |
| :--- | :--- | :--- |
| **Aritmatika Dasar** | `+`, `-`, `*`, `/`, `%` | Penjumlahan, pengurangan, perkalian, pembagian, dan modulo ($5 \% 3 = 2$) |
| **Pangkat & Akar** | `^`, `sqrt`, `cbrt`, `1/x` | $2^3 = 8$, $\sqrt{16} = 4$, $\sqrt[3]{27} = 3$, $x^{-1}$ |
| **Trigonometri** | `sin`, `cos`, `tan` | Mendukung mode derajat (**DEG**) dan radian (**RAD**) |
| **Invers Trigonometri** | `asin`, `acos`, `atan` | Validasi domain $-1 \le x \le 1$ |
| **Logaritma & Eksponen** | `log`, `ln`, `exp`, `10^x` | Logaritma basis 10, logaritma natural ($e$), eksponensial ($e^x$) |
| **Fungsi Khusus** | `fact(n)`, `abs(x)`, `rand()` | Faktorial ($n!$ untuk $0 \dots 170$), nilai absolut, dan angka acak |
| **Konstanta** | `pi`, `e`, `ans` | $\pi \approx 3.14159$, $e \approx 2.71828$, dan hasil kalkulasi sebelumnya |

---

## 🚀 Cara Menjalankan Program

### A. Versi Web (Paling Praktis)
1. **Opsi 1**: Klik ganda file [`buka_kalkulator_web.bat`](buka_kalkulator_web.bat) di File Explorer.
2. **Opsi 2**: Buka file [`index.html`](index.html) langsung menggunakan browser pilihan Anda (Google Chrome, Microsoft Edge, Firefox).
3. **Opsi 3 (Lewat Laragon / Web Server)**:
   Akses melalui browser di:
   ```
   http://localhost/kalkulatorIlmiah/index.html
   ```

---

### B. Versi C++ (Console / Terminal)

#### 1. Menggunakan Script Otomatis `run.bat`
Jalankan file batch melalui terminal atau klik ganda di File Explorer:
```cmd
.\run.bat
```
*Script ini otomatis mengompilasi `kalkulator_ilmiah.cpp` menggunakan `g++ -std=c++17` dan langsung mengeksekusi program.*

#### 2. Melalui VS Code / Antigravity IDE
- **Kompilasi & Build**: Tekan `Ctrl + Shift + B`.
- **Run & Debug (GDB)**: Tekan tombol `F5`.

#### 3. Kompilasi Manual lewat Terminal
```bash
# Kompilasi dengan GCC/G++
g++ -std=c++17 -Wall kalkulator_ilmiah.cpp -o kalkulator.exe

# Jalankan program
.\kalkulator.exe
```

---

## 📁 Struktur Direktori

```text
kalkulatorIlmiah/
├── .vscode/                     # Konfigurasi IDE (VS Code / Antigravity)
│   ├── c_cpp_properties.json   # Konfigurasi include path C++ IntelliSense
│   ├── launch.json             # Konfigurasi Run & Debug (F5) dengan GDB
│   ├── settings.json           # Pengaturan query-driver clangd
│   └── tasks.json              # Task build otomatis (Ctrl+Shift+B)
├── .clangd                     # Konfigurasi Language Server clangd C++
├── compile_flags.txt           # Compiler flags untuk C++17 & include paths
├── index.html                  # Struktur halaman Web Kalkulator
├── style.css                   # Desain Glassmorphism & Cyber Obsidian Theme
├── app.js                      # Mesin matematika, Canvas 2D Plotter & Web Audio
├── buka_kalkulator_web.bat     # Shortcut 1-klik membuka versi Web
├── kalkulator_ilmiah.cpp       # Source code C++17 Parser & Console App
├── kalkulator.exe              # File binary executable C++
├── run.bat                     # Script kompilasi dan eksekusi C++
├── input.txt                   # Contoh input kalkulasi
├── run.txt                     # Log contoh output eksekusi program
└── README.md                   # Dokumentasi proyek
```

---

## 💻 Contoh Penggunaan Perintah C++

Saat menjalankan versi konsol C++:
```text
[DEG] > 2*(3+4)^2
= 98
[DEG] > sin(30)
= 0.5
[DEG] > sqrt(16)+ans
= 4.5
[DEG] > fact(5)
= 120
[DEG] > mode rad
Mode sudut: radian
[RAD] > sin(pi/2)
= 1
[RAD] > history
1. 2*(3+4)^2 = 98
2. sin(30) = 0.5
3. sqrt(16)+ans = 4.5
4. fact(5) = 120
5. sin(pi/2) = 1
[RAD] > exit
Sampai jumpa!
```

---

## 📄 Lisensi
Proyek ini dilisensikan di bawah lisensi [MIT License](LICENSE).
Bebas dimodifikasi dan dikembangkan untuk keperluan edukasi dan penggunaan pribadi.
