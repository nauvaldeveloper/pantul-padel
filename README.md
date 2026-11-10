# Pantul Padel — Website Booking Lapangan (Portfolio Nauval Dev)

Contoh website **booking lapangan padel**: tempat, jadwal, dan pemain fiktif.
HTML/CSS/JS biasa, tanpa build tool. Buka `index.html` langsung di browser.

Berbeda dari demo lain, halaman ini berbentuk **aplikasi**: navigasi berupa rel vertikal di kiri
(desktop) atau tab bar di bawah (HP), dan layar pertama langsung papan jadwal, tanpa hero.

## Fitur
- Papan jadwal 4 lapangan × jam 07–23 dengan harga tiap slot (pagi, prime time, akhir pekan)
- Tap jam kosong → panel tiket: durasi 1–2 jam (2 jam hanya bila jam berikutnya kosong),
  sewa raket & bola, total, dan **patungan per orang**
- **Main bareng**: slot yang dibuka pemain lain dan masih kurang orang; ikut 1–3 orang, bayar bagianmu saja
- Papan harga, aturan main, dan info tiap lapangan
- Semua booking dikirim sebagai pesan WhatsApp

## Menyesuaikan
Lapangan, harga per jam, add-on, dan aturan ada di `assets/js/data.js`. Isi `WA_NUMBER` lalu set `DEMO: false`.
Jadwal terisi di demo dibuat otomatis; untuk dipakai sungguhan bisa dihubungkan ke Google Sheets.
