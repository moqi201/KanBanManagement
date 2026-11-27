# Gemini.md — Kunci Tema & Standar Desain Sistem (Locked Design System)

Dokumen ini berfungsi sebagai **kunci permanen di belakang layar (behind the scenes)** untuk seluruh agen AI (termasuk Antigravity / Gemini) dan pengembang. Tema ini telah dikunci secara absolut dan **tidak boleh ditampilkan sebagai halaman di UI aplikasi** atau memunculkan tombol "Kunci Tema" di navbar.

---

## 1. Aturan Penguncian Tema (Lock Rules)

1. **Di Belakang Layar:** Konfigurasi tema hidup di level konfigurasi (`src/lib/theme.ts`, `src/app/globals.css`, dan `tailwind.config.ts`).
2. **Tanpa Halaman Khusus:** Tidak boleh ada halaman `/theme` atau tombol showcase tema di antarmuka pengguna (navbar/sidebar).
3. **Kepatuhan Token:** Setiap komponen UI (tombol, kartu, form, modal, teks) wajib menggunakan token warna dan font yang tercantum di bawah ini. Dilarang menggunakan warna hardcoded arbitrer di luar sistem ini.

---

## 2. Palet Warna Resmi (Berdasarkan `image.png`)

Empat warna utama dari `image.png` yang telah dikunci:

| Nama Warna | Hex Code | HSL | Peran Semantik dalam Aplikasi |
|---|---|---|---|
| **Chestnut Brown** | `#6E3511` | `23 73% 25%` | Teks utama (`foreground`), seluruh judul (`h1–h6`), dark contrast border, aksen gelap. |
| **Sage Olive** | `#91AC67` | `84 30% 54%` | Secondary elements, header kolom Kanban (*Done*), badges status/divisi Marketing, hover state. |
| **Forest Olive** | `#597928` | `84 50% 32%` | Tombol aksi utama (*Primary CTA*), border aktif, badge divisi IT, highlight focus ring (`ring-palette-olive`). |
| **Warm Cream** | `#FCECD8` | `33 86% 92%` | Latar belakang aplikasi (`background`), permukaan kanvas, badge latar belakang, warna teks kontras di atas Olive. |

### Semantic CSS Variables Mapping (`globals.css`):
- `--background`: `33 60% 96%` (Warm Cream tint yang nyaman di mata)
- `--foreground`: `23 73% 22%` (Chestnut Brown pekat untuk keterbacaan tinggi / WCAG AAA)
- `--card`: `33 50% 99%` (Permukaan kartu bersih dengan nuansa warm)
- `--primary`: `84 50% 32%` (Forest Olive `#597928`)
- `--primary-foreground`: `33 86% 96%` (Warm Cream `#FCECD8`)
- `--secondary`: `84 30% 54%` (Sage Olive `#91AC67`)
- `--border`: `33 30% 84%` (Border warm subtle)
- `--ring`: `84 50% 32%` (Focus outline Forest Olive)

---

## 3. Standar Tipografi Resmi

| Peran | Nama Font | Fallback Resmi | Kelas Tailwind | Penggunaan Wajib |
|---|---|---|---|---|
| **Font Pertama (Body & UI)** | **Google Sans** | Plus Jakarta Sans, system-ui, sans-serif | `font-sans` | Teks isi, deskripsi tugas, navigasi, input form, tombol, dan isi tabel. |
| **Font Kedua (Headings & Display)** | **Oswald** | sans-serif | `font-heading` | Seluruh heading (`h1` sampai `h6`), nama kolom Kanban (*To Do*, *In Progress*, *Done*), label form, angka metrik/statistik. |

---

## 4. Lokasi File Teknis di Proyek

- **Token Desain:** `src/lib/theme.ts`
- **Variabel CSS:** `src/app/globals.css`
- **Konfigurasi Utility Tailwind:** `tailwind.config.ts`
- **Pemuat Font Global:** `src/app/layout.tsx` (`Plus_Jakarta_Sans` & `Oswald` dari `next/font/google`)
