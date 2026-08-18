# api-waktu

Open source API for prayer times, Hijri calendar, and Javanese calendar. Built with Bun + Hono + SQLite.

## Tech Stack

- **Runtime**: Bun
- **Framework**: Hono
- **Database**: SQLite via Drizzle ORM (`drizzle-orm/bun-sqlite`)
- **Language**: TypeScript (strict mode)

## Getting Started

```bash
# install dependencies
bun install

# seed region database (6,947 kecamatan)
bun run db:seed

# start dev server (with hot reload)
bun run dev

# or run directly
bun run start
```

Server runs on `http://localhost:3000` by default. Set `PORT` env to change.

## API Endpoints

### Calendar Conversion

#### `GET /javanese-date?date=YYYY-MM-DD`

Convert Gregorian date to Javanese calendar (day-of-week, pasaran, wuku).

```json
{
  "year": 2026,
  "month": 8,
  "day": 18,
  "dayOfWeek": "Selasa",
  "pasaran": "Pahing",
  "wuku": "Medangkungan",
  "javaneseYear": 1960
}
```

#### `GET /hijri-date?date=YYYY-MM-DD`

Convert Gregorian date to Hijri (Islamic) calendar.

```json
{
  "year": 1447,
  "month": 2,
  "day": 23,
  "monthName": "Safar",
  "daysInMonth": 29
}
```

**Limitasi**: Menggunakan algoritma Tabular Islamic Calendar (Kuwaiti Civil Calendar). Hasilnya adalah hisab matematis, bukan penetapan berdasarkan rukyatul hilal. Bisa berbeda ±1 hari dari kalender resmi yang ditetapkan pemerintah.

#### `GET /hijri-calendar?year=1446&month=1`

Get full Hijri month with Gregorian equivalent for each day.

```json
{
  "year": 1446,
  "month": 1,
  "monthName": "Muharram",
  "daysInMonth": 30,
  "days": [
    { "day": 1, "gregorian": { "year": 2024, "month": 7, "day": 8 } },
    { "day": 2, "gregorian": { "year": 2024, "month": 7, "day": 9 } }
  ]
}
```

### Prayer Times

#### `GET /prayer-times?lat=&long=&date=YYYY-MM-DD`

Get daily prayer times for a location. Uses Kemenag RI method (Fajr 20°, Isha 18°, Shafi madhab).

```json
{
  "date": { "year": 2026, "month": 8, "day": 18 },
  "coordinates": { "latitude": -6.2088, "longitude": 106.8456 },
  "method": "Kemenag",
  "times": {
    "fajr": "04:41",
    "sunrise": "05:59",
    "dhuhr": "11:58",
    "asr": "15:18",
    "maghrib": "17:55",
    "isha": "19:05"
  }
}
```

#### `GET /prayer-times?districtCode=31.71.01&date=YYYY-MM-DD`

Get prayer times by kecamatan code (uses region database for coordinates).

**Limitasi**: Menggunakan algoritma hisab matematis berdasarkan "Astronomical Algorithms" by Jean Meeus (sama seperti adhan-js). Hasil bisa berbeda ±1-2 menit dari jadwal resmi Kemenag yang mungkin menggunakan metode atau tuning tambahan. Waktu zona: WIB (UTC+7) secara default.

### Region Lookup

#### `GET /regions/search?q=`

Search kecamatan by name (min 2 characters). Returns up to 20 results.

```json
{
  "query": "menteng",
  "count": 2,
  "results": [
    {
      "provinceCode": "31",
      "provinceName": "DKI JAKARTA",
      "regencyCode": "31.71",
      "regencyName": "JAKARTA PUSAT",
      "regencyType": "kota",
      "districtCode": "31.71.01",
      "districtName": "MENTENG",
      "latitude": -6.1844,
      "longitude": 106.8376
    }
  ]
}
```

#### `GET /regions/:districtCode`

Lookup kecamatan by Kemendagri code (e.g. `31.71.01`).

### Health Check

#### `GET /` or `GET /health`

Returns server status and list of available endpoints.

## Database

SQLite database is stored at `data/database.sqlite`. Region data is seeded from [api-wilayah-indonesia](https://github.com/cakfan/api-wilayah-indonesia) via:

```bash
bun run db:seed
```

Schema includes: province, regency (kabupaten/kota), district (kecamatan), with centroid coordinates (latitude/longitude) computed from village data.

## Project Structure

```
src/
  index.ts                        # Hono app entry point
  db/
    index.ts                      # SQLite connection via Drizzle
    schema.ts                     # Drizzle table definitions
  hijri-calendar/
    convert-to-hijri.ts           # Hijri ↔ Gregorian conversion (Tabular)
    convert-to-hijri.test.ts
  javanese-calendar/
    convert-to-javanese.ts        # Javanese calendar conversion
    convert-to-javanese.test.ts
  prayer-times/
    math-utils.ts                 # Degree/radian math utilities
    astronomical.ts               # Solar position calculations (Jean Meeus)
    solar-time.ts                 # Solar time (transit, sunrise, sunset)
    prayer-times.ts               # Prayer times engine (Kemenag method)
    prayer-times.test.ts
scripts/
  seed-regions.ts                 # Import kecamatan data to SQLite
data/
  raw/                            # Raw JSON from api-wilayah-indonesia (gitignored)
```

## Testing

```bash
bun test
```

## License

MIT
