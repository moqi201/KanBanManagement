# Plan Implementasi Fitur Tambahan: Opsi 1, 2, dan 3

Dokumen ini menjabarkan rencana teknis penambahan fitur **Drag-and-Drop (Opsi 1)**, **Notifikasi Toast (Opsi 2)**, dan **Filter Tugas Saya (Opsi 3)** dengan kepatuhan penuh terhadap standar sistem desain [Gemini.md](file:///d:/data%20rayhan/programs/kanban-manegement/frontend/Gemini.md) dan aturan kualitas `.agents`.

---

## 1. Ruang Lingkup & Tujuan

Meningkatkan pengalaman interaksi (*tactile & fluid UX*) pada papan Kanban tanpa merusak struktur kode yang sudah ada, tanpa menambah beban dependensi berlebihan, dan tetap menjaga tema terkunci di belakang layar.

Tiga fitur yang akan diimplementasikan:
1. **Opsi 1 — Drag-and-Drop (DND) Native:** Memindahkan kartu tugas antar kolom (*To Do*, *In Progress*, *Done*) secara intuitif dengan menggeser kartu menggunakan mouse atau layar sentuh.
2. **Opsi 2 — Toast Notification System:** Memberikan umpan balik visual (*feedback toast*) di pojok layar saat operasi berhasil (tambah, edit, geser status, hapus tugas, atau tambah anggota).
3. **Opsi 3 — Filter Cepat "Tugas Saya":** Tombol sakelar (*toggle button*) pada bilah filter agar pengguna dapat menyaring tugas yang hanya ditugaskan kepada dirinya.

---

## 2. Kepatuhan Desain Sistem (`Gemini.md`) & `.agents`

- **Palet Warna Terkunci:**
  - Toast Sukses / Drag Active Indicator: **Forest Olive (`#597928`)**
  - Toast Error: **Destructive Dark (`#DC2626`)** dengan aksen **Chestnut Brown (`#6E3511`)**
  - Surface Toast & Drop Zone: **Warm Cream (`#FCECD8`)** dan **Card Surface**
  - Tipografi: Angka counter & judul toast menggunakan font **Oswald**, pesan isi menggunakan **Google Sans**.
- **Aturan `.agents`:**
  - Tidak menggunakan animasi berisik (*no radioactive glow*).
  - Aksesibilitas: Toast menggunakan `role="status"` dan `aria-live="polite"`.
  - Dukungan Mobile: Drag-and-drop tetap mempertahankan tombol aksi cepat (`Mulai →`, `Selesai ✓`) sebagai alternatif aksesibilitas (*graceful fallback*) bagi pengguna ponsel/layar sentuh.

---

## 3. Rencana Teknis Tiap Fitur

### Opsi 1: Drag-and-Drop (DND) Interaktif
* **Pendekatan Teknis:** Menggunakan **HTML5 Drag and Drop API** (dengan state visual drop zone di React).
  * *Keunggulan:* Kompatibel 100% dengan React 19 & Next.js 15 tanpa risiko konflik *peer dependencies* seperti library pihak ketiga lama.
* **Perubahan Komponen:**
  1. **`TaskCard` (`task-card.tsx`):**
     - Atribut `draggable={true}`.
     - Event `onDragStart`: Menyimpan `taskId` dan status asal ke data transfer.
     - Efek visual saat di-drag: Opasitas berkurang dan border beraksen Forest Olive.
  2. **`KanbanColumn` (`kanban-column.tsx`):**
     - Event `onDragOver` & `onDragEnter`: Mengaktifkan *Drop Indicator* (border putus-putus dengan highlight Sage Olive).
     - Event `onDrop`: Membaca `taskId` dan memanggil `moveTaskStatus(taskId, targetStatus)` dari `kanban-store.ts`.
     - Event `onDragLeave`: Mereset *Drop Indicator*.

---

### Opsi 2: Toast Notification System Terpadu
* **Pendekatan Teknis:** Membuat *Lightweight Toast Store* berbasis Zustand (`src/store/toast-store.ts`) dan komponen kontainer (`src/components/ui/toast.tsx`).
* **Fitur Toast:**
  - Jenis Toast: `success`, `error`, `info`.
  - Auto-dismiss otomatis dalam 3.5 detik (atau tombol silang manual).
  - Animasi masuk dari pojok kanan bawah (*slide-in from bottom-right*).
* **Integrasi Operasi:**
  - Saat task dipindahkan (via drag atau tombol) &rarr; `toast.success("Tugas dipindahkan ke [Status]")`.
  - Saat task baru dibuat &rarr; `toast.success("Tugas baru berhasil ditambahkan")`.
  - Saat task dihapus &rarr; `toast.info("Tugas berhasil dihapus")`.
  - Saat terjadi error server &rarr; `toast.error("Gagal memproses data")`.

---

### Opsi 3: Filter Cepat "Tugas Saya"
* **Pendekatan Teknis:**
  1. **Zustand Store (`kanban-store.ts`):**
     - Tambahkan state `onlyMyTasks: boolean` (default: `false`).
     - Tambahkan action `toggleOnlyMyTasks()`.
     - Logika filter: Jika `onlyMyTasks === true`, saring tugas berdasarkan `assigned_to === user.id` atau `assignee_name === user.name`.
  2. **Bilah Filter (`kanban-filter-bar.tsx`):**
     - Tambahkan tombol pill interaktif dengan ikon user: **`Tugas Saya`**.
     - Status aktif: Berwarna Forest Olive (`bg-palette-olive text-palette-cream`).
     - Status tidak aktif: Berborder normal (`border-border text-palette-brown`).

---

## 4. Berkas yang Akan Dibuat & Dimodifikasi

| Berkas | Aksi | Deskripsi |
|---|---|---|
| `src/store/toast-store.ts` | **Baru** | Store global notifikasi toast (add, remove, auto-clear). |
| `src/components/ui/toast.tsx` | **Baru** | Komponen container dan tampilan kartu toast mengambang. |
| `src/store/kanban-store.ts` | **Modifikasi** | Penambahan state & logika filter `onlyMyTasks`. |
| `src/components/kanban/kanban-filter-bar.tsx` | **Modifikasi** | Penambahan tombol toggle "Tugas Saya". |
| `src/components/kanban/task-card.tsx` | **Modifikasi** | Penambahan atribut `draggable` dan event handler drag. |
| `src/components/kanban/kanban-column.tsx` | **Modifikasi** | Penambahan drop target area & event handler drop. |
| `src/app/providers.tsx` | **Modifikasi** | Pemasangan `<ToastContainer />` secara global. |

---

## 5. Rencana Tahapan Eksekusi

- [x] **Langkah 1:** Buat `toast-store.ts` dan komponen `toast.tsx`, pasang di `providers.tsx`.
- [x] **Langkah 2:** Tambahkan logika dan tombol filter "Tugas Saya" di `kanban-store.ts` dan `kanban-filter-bar.tsx`.
- [x] **Langkah 3:** Implementasikan HTML5 Drag-and-Drop pada `task-card.tsx` dan `kanban-column.tsx`, sambungkan dengan toast success.
- [x] **Langkah 4:** Jalankan `npm run lint`, `npx tsc --noEmit`, dan `npm run build` untuk memvalidasi zero error.
- [x] **Langkah 5:** Commit dan push ke repository GitHub.
