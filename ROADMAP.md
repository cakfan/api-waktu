# ROADMAP — api-waktu — Jadwal Sholat & Kalender Jawa/Hijriah API

## Fase 0 — Setup Project
- [x] Init project Bun + Hono
- [x] Setup SQLite + Drizzle ORM
- [x] Setup struktur folder (src, kebab-case file naming, sesuai konvensi project sebelumnya)
- [x] Setup AGENTS.md (coding conventions, single source of truth, dst)
- [x] Tentukan brand/nama project

## Fase 1 — Engine Kalender Jawa (paling mudah, tanpa dependency data eksternal)
- [x] Implementasi algoritma konversi Masehi → Jawa (pasaran: Legi, Pahing, Pon, Wage, Kliwon)
- [x] Implementasi perhitungan wuku
- [x] Endpoint `GET /javanese-date?date=`
- [x] Unit test dengan beberapa tanggal referensi yang sudah diketahui hasilnya

## Fase 2 — Engine Kalender Hijriah
- [x] Implementasi algoritma konversi Masehi → Hijriah (hisab matematis)
- [x] Endpoint `GET /hijri-date?date=`
- [x] Endpoint `GET /hijri-calendar?year=&month=` (kalender bulan penuh)
- [x] Dokumentasikan limitasi (bukan penetapan resmi/rukyat)

## Fase 3 — Database Wilayah
- [x] Kumpulkan data kode wilayah + koordinat kabupaten/kota (sumber: BPS/Kemendagri/OSM)
- [x] Import ke SQLite via Drizzle
- [x] Endpoint pencarian wilayah (untuk resolve nama wilayah → koordinat)
- [x] (Opsional lanjutan) tambah level kecamatan jika data tersedia

## Fase 4 — Engine Jadwal Sholat
- [x] Riset & pilih basis algoritma hisab (referensi adhan-js, sesuaikan parameter)
- [x] Implementasi perhitungan waktu sholat dari lat/long/tanggal
- [x] Kalibrasi parameter sudut Subuh/Isya mendekati konvensi Kemenag RI
- [x] Endpoint `GET /prayer-times?lat=&long=&date=`
- [x] Endpoint `GET /prayer-times?districtCode=&date=` (pakai data wilayah dari Fase 3)
- [x] Validasi manual: bandingkan hasil hitung vs jadwal resmi Kemenag untuk beberapa kota besar (Jakarta, Surabaya, Bandung, dll)

## Fase 5 — Polish & Caching
- [x] Cache layer per lokasi per hari (hindari hitung ulang tiap request)
- [x] Response format konsisten (helper `parseDate()` reusable, error response seragam)
- [x] Error handling & validasi input (coordinate range, date format, parameter wajib)
- [x] Dokumentasi API (README + contoh request/response)

## Fase 6 — Publish
- [ ] Publish ke GitHub (open source)
- [ ] Tulis README dengan contoh penggunaan
- [ ] (Opsional) deploy demo instance publik

## Backlog / Fase 2 Produk (belum prioritas)
- [ ] Endpoint jadwal sholat kalender bulanan
- [ ] Parameter hisab custom (ISNA, MWL, dll) untuk dukungan negara lain
- [ ] Integrasi data resmi Kemenag jika sumbernya ditemukan
- [ ] Rate limiting & API key untuk publik skala besar