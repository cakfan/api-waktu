# PRD — api-waktu — Jadwal Sholat & Kalender Jawa/Hijriah API

## 1. Latar Belakang

Developer Indonesia yang butuh fitur jadwal sholat, kalender Hijriah, atau kalender Jawa (pasaran) di aplikasi mereka saat ini harus:
- Pakai API luar negeri (Aladhan API, dll) yang akurasinya rendah untuk wilayah Indonesia karena tidak granular (biasanya cuma per kota besar, bukan per kecamatan) dan tidak pakai parameter hisab yang sesuai konvensi Kemenag RI.
- Scraping situs jadwal sholat manual, yang rapuh dan tidak reliable untuk production.
- Kalender Jawa (pasaran/wuku) hampir tidak ada API open source sama sekali di ekosistem Indonesia.

Tidak ada satu pun API open source Indonesia yang menggabungkan ketiganya (jadwal sholat granular + Hijriah + Jawa) dalam satu layanan yang konsisten dan mudah dipakai.

## 2. Tujuan Produk

Menyediakan API publik, open source, self-hostable, yang menghitung:
1. Jadwal sholat granular (berbasis koordinat, bukan cuma kota besar) menggunakan parameter hisab yang mendekati konvensi Kemenag RI.
2. Konversi tanggal Hijriah dari Masehi.
3. Konversi kalender Jawa (pasaran + wuku) dari Masehi.

Non-goal (di luar scope awal):
- Tidak menyediakan penetapan resmi awal bulan Hijriah (rukyat/sidang isbat) — hanya hisab matematis.
- Tidak membangun UI/aplikasi konsumen — murni API/backend.
- Tidak membuat mobile app atau notifikasi.

## 3. Target Pengguna

- Developer yang membangun aplikasi masjid, aplikasi Islami, atau fitur jadwal sholat di produk mereka.
- Developer yang butuh kalender Jawa untuk aplikasi budaya/event/penanggalan tradisional.
- Peneliti/hobbyist yang butuh data kalender lokal Indonesia terprogram.

## 4. Fitur Utama (Scope Fase 1 — MVP)

### 4.1 Jadwal Sholat
- Endpoint hitung waktu sholat (Subuh, Terbit, Dzuhur, Ashar, Maghrib, Isya) berdasarkan koordinat lat/long + tanggal.
- Endpoint alternatif berbasis kode wilayah (kecamatan/kabupaten) menggunakan database koordinat internal.
- Parameter hisab dapat dikonfigurasi (sudut Subuh/Isya), default mendekati konvensi Kemenag RI.

### 4.2 Kalender Hijriah
- Endpoint konversi tanggal Masehi → Hijriah (hisab matematis, bukan rukyat resmi).
- Endpoint kalender bulan Hijriah penuh untuk suatu bulan Masehi.

### 4.3 Kalender Jawa
- Endpoint konversi tanggal Masehi → kalender Jawa (hari pasaran: Legi, Pahing, Pon, Wage, Kliwon + wuku).

### 4.4 Data Wilayah
- Database internal kode wilayah Indonesia (kecamatan/kabupaten) berikut koordinat, untuk mendukung endpoint berbasis nama wilayah.

## 5. Fitur Fase 2 (Belum Prioritas)

- Endpoint jadwal sholat sebulan penuh (kalender bulanan) sekaligus.
- Opsi parameter hisab custom per negara/organisasi lain (ISNA, MWL, dll) untuk pengguna non-Indonesia.
- Integrasi data resmi Kemenag (bila tersedia sumbernya) sebagai opsi selain hisab matematis murni.
- Rate limiting & API key untuk penggunaan publik skala besar.

## 6. Nama Project

**api-waktu** — konsisten dengan penamaan repo project sebelumnya (api-harga-pangan), langsung deskriptif fungsinya.

## 7. Tech Stack

- **Runtime**: Bun
- **Framework API**: Hono (ringan, cepat, native support Bun, cocok untuk pure API server tanpa overhead UI)
- **Database**: SQLite + Drizzle ORM (untuk data wilayah/koordinat, mengikuti pola project sebelumnya)
- **Perhitungan hisab**: engine kustom berbasis algoritma astronomi standar (referensi `adhan-js`), disesuaikan parameter Kemenag RI
- **Konversi kalender**: implementasi matematis murni (tidak butuh dependency eksternal besar)

## 8. Metrik Keberhasilan (untuk riset/penggunaan sendiri)

- Selisih waktu sholat hasil hitung vs jadwal resmi Kemenag < 2 menit untuk sample kota-kota besar.
- Endpoint dapat menjawab query untuk minimal seluruh kabupaten/kota (level kabupaten dulu, kecamatan menyusul).
- API dapat di-self-host dengan setup minimal (SQLite, tidak butuh service eksternal berbayar).

## 9. Risiko & Constraint

- Akurasi hisab perlu divalidasi manual terhadap jadwal resmi — tidak ada cara otomatis untuk verifikasi 100% tanpa data pembanding.
- Database koordinat kecamatan (7000+ entri) perlu effort pengumpulan data di awal.
- Penetapan awal bulan Hijriah "resmi" (Ramadhan/Syawal) tidak bisa full otomatis karena berbasis sidang isbat — didokumentasikan dengan jelas sebagai limitasi (hisab murni, bukan rukyat resmi).