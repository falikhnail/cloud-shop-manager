# 🏪 Sistem Kasir & Manajemen Toko

Sistem Point of Sale (POS) dan manajemen toko modern yang dibangun dengan React dan Supabase. Dirancang untuk membantu bisnis retail mengelola penjualan, inventaris, pembelian, dan laporan keuangan dengan mudah.

![React](https://img.shields.io/badge/React-18.3-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css)
![Supabase](https://img.shields.io/badge/Supabase-Backend-green?logo=supabase)

---

## ✨ Fitur Utama

### 🛒 Point of Sale (POS)
- Antarmuka kasir yang intuitif dan responsif
- Pencarian dan filter produk berdasarkan kategori
- Keranjang belanja dengan perhitungan otomatis
- Dukungan berbagai metode pembayaran (Tunai, QRIS, Transfer)
- Cetak struk/receipt dengan format profesional
- Kalkulasi kembalian otomatis

### 📦 Manajemen Produk
- CRUD produk lengkap (Tambah, Edit, Hapus)
- Kategori produk untuk organisasi yang lebih baik
- Pelacakan stok real-time
- Harga beli dan harga jual terpisah
- Dukungan gambar produk

### 🛍️ Manajemen Pembelian
- Pencatatan pembelian dari supplier
- Manajemen supplier lengkap
- Pelacakan status pembayaran (Lunas, Sebagian, Belum Bayar)
- Riwayat pembayaran ke supplier
- Otomatis update stok saat pembelian

### 💰 Biaya Operasional
- Pencatatan biaya operasional harian
- Kategori biaya (Gaji, Listrik, Sewa, dll)
- Laporan pengeluaran

### 📊 Laporan & Analitik
- **Dashboard**: Ringkasan penjualan, transaksi, dan stok
- **Laporan Laba Rugi**: Analisis keuntungan berdasarkan periode
- **Laporan Transaksi**: Riwayat lengkap semua transaksi
- **Laporan Pembayaran Supplier**: Tracking hutang dan pembayaran
- Ekspor laporan ke Excel/PDF

### 👥 Manajemen Pengguna
- Sistem autentikasi aman
- Dua role pengguna: **Admin** dan **Kasir**
- Kontrol akses berdasarkan role
- Manajemen profil pengguna

### 💾 Backup & Restore Data
- Ekspor data ke format Excel
- Import data dari file Excel
- Riwayat backup tersimpan
- Dukungan backup partial per tabel

### 🎨 Tampilan & UX
- Desain modern dan responsif
- Mode Gelap/Terang (Dark/Light mode)
- PWA ready - dapat diinstall sebagai aplikasi
- Mobile-friendly untuk penggunaan di tablet/smartphone

---

## 🛠️ Teknologi

| Kategori | Teknologi |
|----------|-----------|
| **Frontend** | React 18, TypeScript, Vite |
| **Styling** | Tailwind CSS, shadcn/ui |
| **State Management** | React Context, TanStack Query |
| **Backend** | Supabase (PostgreSQL, Auth, Edge Functions) |
| **Charts** | Recharts |
| **Form** | React Hook Form, Zod |
| **Export** | jsPDF, xlsx |

---

## 📁 Struktur Proyek

```
src/
├── components/
│   ├── dashboard/      # Komponen dashboard (StatCard, DueBillsAlert)
│   ├── expenses/       # Form & dialog biaya operasional
│   ├── layout/         # MainLayout, AppSidebar
│   ├── pos/            # CartPanel, ReceiptDialog
│   ├── products/       # ProductCard, ProductFormDialog
│   ├── purchases/      # Form pembelian & pembayaran
│   ├── ui/             # Komponen shadcn/ui
│   └── users/          # Manajemen user dialogs
├── context/
│   ├── AuthContext     # Autentikasi & session
│   ├── CartContext     # State keranjang belanja
│   ├── SidebarContext  # State sidebar
│   └── StoreContext    # Pengaturan toko
├── hooks/
│   ├── useProducts     # CRUD produk
│   ├── usePurchases    # CRUD pembelian
│   ├── useExpenses     # CRUD biaya operasional
│   ├── useTransactions # Simpan transaksi
│   └── useSuppliers    # CRUD supplier
├── pages/
│   ├── Dashboard       # Halaman utama admin
│   ├── POS             # Halaman kasir
│   ├── Products        # Manajemen produk
│   ├── Purchases       # Manajemen pembelian
│   ├── Expenses        # Biaya operasional
│   ├── Reports         # Laporan penjualan
│   ├── ProfitReport    # Laporan laba rugi
│   └── ...
└── lib/
    ├── utils           # Utility functions (formatCurrency, dll)
    ├── receiptPrinter  # Fungsi cetak struk
    └── exportReport    # Ekspor laporan
```

---

## 🚀 Memulai

### Prasyarat
- Node.js 18+ 
- npm atau bun

### Instalasi

```bash
# Clone repository
git clone <YOUR_GIT_URL>

# Masuk ke direktori proyek
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install

# Jalankan development server
npm run dev
```

Aplikasi akan berjalan di `http://localhost:5173`

---

## 👤 Role & Akses

### Admin
- ✅ Dashboard & Statistik
- ✅ Manajemen Produk
- ✅ Manajemen Pembelian
- ✅ Biaya Operasional
- ✅ Semua Laporan
- ✅ Manajemen Pengguna
- ✅ Backup & Restore Data
- ✅ Pengaturan Toko

### Kasir
- ✅ Point of Sale (POS)
- ✅ Riwayat Transaksi Sendiri
- ❌ Akses terbatas ke fitur admin

---

## 💡 Format Mata Uang

Sistem menggunakan format Rupiah Indonesia:
- **Tampilan**: `Rp 1.500.000`
- **Input**: Otomatis format dengan pemisah ribuan saat mengetik

---

## 📱 Progressive Web App (PWA)

Aplikasi ini mendukung instalasi sebagai PWA:
1. Buka aplikasi di browser
2. Klik ikon "Install" di address bar
3. Aplikasi akan terinstall dan dapat diakses offline

---

## 🔐 Keamanan

- Autentikasi berbasis Supabase Auth
- Row Level Security (RLS) pada database
- Session management otomatis
- Password terenkripsi

---

## 📄 Lisensi

Proyek ini dibuat untuk keperluan bisnis retail dan manajemen toko.

---

## 🤝 Kontribusi

Kontribusi sangat diterima! Silakan buat Pull Request atau laporkan issue jika menemukan bug.

---

<p align="center">
  Dibuat dengan ❤️
</p>
