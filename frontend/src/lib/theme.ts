export const THEME_PALETTE = {
  brown: {
    hex: "#6E3511",
    hsl: "23 73% 25%",
    name: "Chestnut Brown",
    usage: "Teks judul, teks utama, border kontras tinggi, aksen gelap",
  },
  sage: {
    hex: "#91AC67",
    hsl: "84 30% 54%",
    name: "Sage Olive",
    usage: "Header kolom kanban, badge status, secondary button, hover state",
  },
  olive: {
    hex: "#597928",
    hsl: "84 50% 32%",
    name: "Forest Olive",
    usage: "Tombol aksi utama (CTA), indikator aktif, ikon sorotan",
  },
  cream: {
    hex: "#FCECD8",
    hsl: "33 86% 92%",
    name: "Warm Cream",
    usage: "Latar belakang aplikasi, card containers, badge latar belakang",
  },
} as const;

export const THEME_FONTS = {
  primary: {
    name: "Google Sans",
    fallback: "Plus Jakarta Sans, system-ui, sans-serif",
    class: "font-sans",
    usage: "Body text, form inputs, deskripsi tugas, tombol, navigasi",
  },
  secondary: {
    name: "Oswald",
    fallback: "sans-serif",
    class: "font-heading",
    usage: "Headings, title halaman, judul kolom kanban, angka statistik",
  },
} as const;
