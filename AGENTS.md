# AGENTS.md — api-waktu

Panduan ini berlaku untuk siapa pun (manusia atau AI agent) yang menulis kode di project ini. Tujuannya: kode tetap mudah dipelihara dalam jangka panjang, meski dikerjakan solo.

## 1. Penamaan File

- Semua nama file pakai **kebab-case**: `prayer-times.ts`, `hijri-calendar.ts`, `region-lookup.ts`.
- Tidak ada camelCase, PascalCase, atau snake_case untuk nama file — termasuk file konfigurasi custom.
- Nama file harus deskriptif terhadap isinya, bukan generik. Hindari `utils.ts`, `helper.ts`, `misc.ts` — pecah jadi file spesifik sesuai fungsinya, misal `date-converter.ts`, `coordinate-resolver.ts`.
- Struktur folder mengikuti domain, bukan tipe file. Contoh:
  ```
  src/
    prayer-times/
      calculate-prayer-times.ts
      hisab-parameters.ts
    hijri-calendar/
      convert-to-hijri.ts
    javanese-calendar/
      convert-to-javanese.ts
    regions/
      region-lookup.ts
      region-seed-data.ts
  ```

## 2. Penamaan Variabel & Fungsi

- Nama variabel dan fungsi harus **manusiawi dan deskriptif** — bisa dibaca seperti kalimat, bukan singkatan kriptik.
  - Baik: `sunriseTime`, `fajrAngle`, `calculatePrayerTimesForLocation()`
  - Hindari: `st`, `fa`, `calcPT()`
- Untuk istilah domain-spesifik (Hijriah, pasaran Jawa, hisab), gunakan istilah yang sudah baku di domain tersebut daripada disingkat sendiri. Contoh: `wuku`, `pasaran`, `hijriMonth` — bukan `wk`, `psr`, `hm`.
- Boolean diberi prefix jelas: `isValidCoordinate`, `hasRegionData` — bukan `valid`, `flag`.
- Fungsi diberi nama sebagai kata kerja yang menjelaskan aksinya: `resolveRegionCoordinates()`, bukan `regionCoord()` atau `process()`.

## 3. Tidak Ada Redundansi (Single Source of Truth)

- Data yang sama tidak boleh disimpan di dua tempat berbeda. Contoh: koordinat wilayah hanya ada di database wilayah (`regions` table), tidak boleh ada salinan hardcoded di file lain.
- Logika perhitungan (hisab, konversi kalender) hanya boleh ada satu implementasi per jenis perhitungan. Jangan duplikasi fungsi serupa dengan sedikit variasi — refactor jadi satu fungsi dengan parameter.
- Konstanta (sudut hisab default, kode wilayah, dst) didefinisikan satu kali di file konfigurasi terkait, lalu di-import di tempat lain — tidak di-copy-paste ulang.
- Sebelum menambah fungsi/helper baru, cek dulu apakah fungsi serupa sudah ada di codebase.

## 4. Kode Bersih & Best Practices

- Satu fungsi hanya bertanggung jawab atas satu hal (single responsibility). Jika sebuah fungsi butuh komentar untuk menjelaskan "bagian ini melakukan X, bagian ini melakukan Y" — itu tandanya fungsi tersebut harus dipecah.
- Hindari nested logic yang dalam (lebih dari 2-3 level). Gunakan early return untuk mengurangi nesting.
- Semua fungsi publik (yang dipakai lintas file/module) diberi tipe TypeScript eksplisit untuk parameter dan return value — jangan andalkan inferensi implisit untuk API publik.
- Endpoint API (Hono routes) tetap tipis — logic bisnis (perhitungan hisab, konversi kalender) diletakkan di layer terpisah (`src/<domain>/`), bukan langsung di dalam route handler.
- Error handling eksplisit: validasi input (koordinat, tanggal, kode wilayah) di awal fungsi, lempar error yang jelas pesannya, bukan silent fail atau return `null` tanpa konteks.
- Tidak ada magic number tanpa penjelasan — gunakan named constant. Contoh: `const DEFAULT_FAJR_ANGLE = 20;` bukan angka `20` langsung di tengah kalkulasi.
- Komentar hanya untuk menjelaskan **kenapa**, bukan **apa** — kode sendiri harus cukup jelas menjelaskan "apa"-nya lewat penamaan yang baik.

## 5. Konsistensi dengan Project Lain

Project ini mengikuti konvensi yang sama dengan project lain dalam portofolio (CekSaham, Biayabangun, api-harga-pangan):
- Seluruh tooling pakai **Bun** (bukan npm/yarn/pnpm) — instalasi dependency, run script, semua lewat `bun`.
- Commit message singkat, deskriptif, present tense (misal: `add prayer time calculation engine`, bukan `added` atau `adding`).
- Dokumentasi (PRD.md, ROADMAP.md, AGENTS.md) selalu diperbarui saat scope atau keputusan teknis berubah — jangan biarkan dokumen basi.

## 6. Testing

- Fungsi perhitungan (hisab, konversi kalender) wajib punya unit test dengan tanggal/lokasi referensi yang hasilnya sudah diketahui dan bisa diverifikasi manual.
- Test diletakkan berdampingan dengan file yang diuji (`calculate-prayer-times.ts` → `calculate-prayer-times.test.ts`), bukan di folder `__tests__` terpisah.