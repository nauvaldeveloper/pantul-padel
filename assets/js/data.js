/**
 * DATA — Pantul Padel (fiktif, untuk portfolio Nauval Dev).
 * Lapangan, harga, jadwal terisi, dan "main bareng" hanya contoh.
 */
window.PADEL = {
  name: 'Pantul Padel',
  area: 'Arcamanik, Bandung',
  address: 'Jl. Pacuan Kuda No. 9, Arcamanik, Bandung (alamat contoh)',
  DEMO: true,
  WA_NUMBER: '',
  DEV_CONTACT_URL: 'https://ig.me/m/nauval_dev',

  OPEN: 7, CLOSE: 23, DAYS_AHEAD: 10, PLAYERS: 4,

  COURTS: [
    { id: 'l1', name: 'Lap. 1', type: 'Panoramic', note: 'Dinding kaca penuh, indoor' },
    { id: 'l2', name: 'Lap. 2', type: 'Indoor', note: 'Atap tinggi, lampu LED' },
    { id: 'l3', name: 'Lap. 3', type: 'Indoor', note: 'Atap tinggi, lampu LED' },
    { id: 'l4', name: 'Lap. 4', type: 'Semi-outdoor', note: 'Beratap, sisi terbuka', discount: 50000 },
  ],

  // Harga per lapangan per jam
  BANDS: [
    { id: 'pagi', label: 'Pagi', days: 'Sen–Jum', from: 7, to: 16, price: 280000 },
    { id: 'prime', label: 'Prime time', days: 'Sen–Jum', from: 16, to: 23, price: 420000 },
    { id: 'wkpagi', label: 'Akhir pekan pagi', days: 'Sab–Min', from: 7, to: 12, price: 360000 },
    { id: 'wk', label: 'Akhir pekan', days: 'Sab–Min', from: 12, to: 23, price: 420000 },
  ],

  ADDONS: {
    racket: { label: 'Sewa raket', price: 35000, max: 4 },
    balls: { label: 'Bola (1 kaleng isi 3)', price: 60000, max: 3 },
  },

  LEVELS: ['Pemula', 'Pemula+', 'Menengah'],
  HOSTS: ['Dimas', 'Sekar', 'Reza', 'Nadia', 'Fajar', 'Laras', 'Bagas', 'Tika'],

  RULES: [
    ['Sepatu', 'Wajib sepatu olahraga bersol karet halus. Sepatu lari bersol kasar atau sepatu futsal pul tidak boleh masuk lapangan.'],
    ['Datang 10 menit lebih awal', 'Jam main dihitung tepat sesuai booking. Lapangan diserahkan ke pemain berikutnya saat waktu habis.'],
    ['Pembayaran', 'Lunas sebelum main lewat transfer atau QRIS. Booking tanpa pembayaran dilepas 30 menit setelah konfirmasi.'],
    ['Reschedule', 'Bisa pindah jadwal gratis sampai H-1. Pembatalan di hari yang sama tidak dapat dikembalikan.'],
    ['Main bareng', 'Slot main bareng dibuka oleh pemain lain. Bayar bagianmu saja, sisanya ditanggung pembuat slot bila tidak penuh.'],
  ],
};
