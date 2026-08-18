import { readFileSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { Database } from "bun:sqlite";

const RAW_DIR = join(import.meta.dir, "..", "data", "raw");
const DB_PATH = join(import.meta.dir, "..", "data.db");
const JSON_PATH = join(import.meta.dir, "..", "data", "regions.json");

interface RawProvince {
  code: string;
  name: string;
}

interface RawRegency {
  code: string;
  province_code: string;
  name: string;
  type: "kabupaten" | "kota";
}

interface RawDistrict {
  code: string;
  regency_code: string;
  name: string;
}

interface RawVillage {
  code: string;
  district_code: string;
  name: string;
  type: "kelurahan" | "desa";
  postal_code?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

function readJson<T>(filename: string): T[] {
  const content = readFileSync(join(RAW_DIR, filename), "utf-8");
  return JSON.parse(content) as T[];
}

function seed() {
  console.log("Reading raw data...");
  const provinces = readJson<RawProvince>("provinces.json");
  const regencies = readJson<RawRegency>("regencies.json");
  const districts = readJson<RawDistrict>("districts.json");
  const villages = readJson<RawVillage>("villages.json");

  console.log(`  ${provinces.length} provinces, ${regencies.length} regencies, ${districts.length} districts, ${villages.length} villages`);

  const provinceMap = new Map(provinces.map((p) => [p.code, p.name]));
  const regencyMap = new Map(regencies.map((r) => [r.code, { name: r.name, type: r.type, provinceCode: r.province_code }]));

  const villagesByDistrict = new Map<string, RawVillage[]>();
  for (const v of villages) {
    if (v.latitude == null || v.longitude == null) continue;
    const list = villagesByDistrict.get(v.district_code);
    if (list) {
      list.push(v);
    } else {
      villagesByDistrict.set(v.district_code, [v]);
    }
  }

  console.log(`Computing centroids for ${districts.length} districts...`);

  interface RegionRow {
    provinceCode: string;
    provinceName: string;
    regencyCode: string;
    regencyName: string;
    regencyType: string;
    districtCode: string;
    districtName: string;
    latitude: number;
    longitude: number;
  }

  const rows: RegionRow[] = [];

  for (const d of districts) {
    const regency = regencyMap.get(d.regency_code);
    if (!regency) continue;

    const provinceName = provinceMap.get(regency.provinceCode) ?? "";
    const villageList = villagesByDistrict.get(d.code);

    if (!villageList || villageList.length === 0) continue;

    let sumLat = 0;
    let sumLng = 0;
    for (const v of villageList) {
      sumLat += v.latitude!;
      sumLng += v.longitude!;
    }

    rows.push({
      provinceCode: regency.provinceCode,
      provinceName,
      regencyCode: d.regency_code,
      regencyName: regency.name,
      regencyType: regency.type,
      districtCode: d.code,
      districtName: d.name,
      latitude: Math.round((sumLat / villageList.length) * 10000) / 10000,
      longitude: Math.round((sumLng / villageList.length) * 10000) / 10000,
    });
  }

  console.log(`Inserting ${rows.length} districts into SQLite...`);

  mkdirSync(join(import.meta.dir, ".."), { recursive: true });
  const sqlite = new Database(DB_PATH);
  sqlite.exec("PRAGMA journal_mode=DELETE");
  sqlite.exec("DROP TABLE IF EXISTS regions");
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS regions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      province_code TEXT NOT NULL,
      province_name TEXT NOT NULL,
      regency_code TEXT NOT NULL,
      regency_name TEXT NOT NULL,
      regency_type TEXT NOT NULL,
      district_code TEXT NOT NULL,
      district_name TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL
    )
  `);
  sqlite.exec("CREATE INDEX IF NOT EXISTS idx_regions_district ON regions(district_code)");
  sqlite.exec("CREATE INDEX IF NOT EXISTS idx_regions_regency ON regions(regency_code)");
  sqlite.exec("CREATE INDEX IF NOT EXISTS idx_regions_name ON regions(district_name)");

  const insert = sqlite.prepare(
    "INSERT INTO regions (province_code, province_name, regency_code, regency_name, regency_type, district_code, district_name, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
  );

  const insertMany = sqlite.transaction((items: RegionRow[]) => {
    for (const r of items) {
      insert.run(
        r.provinceCode,
        r.provinceName,
        r.regencyCode,
        r.regencyName,
        r.regencyType,
        r.districtCode,
        r.districtName,
        r.latitude,
        r.longitude
      );
    }
  });

  insertMany(rows);
  sqlite.close();

  console.log(`Writing JSON to ${JSON_PATH}...`);
  mkdirSync(join(import.meta.dir, "..", "data"), { recursive: true });
  writeFileSync(JSON_PATH, JSON.stringify(rows));

  console.log(`Done! Inserted ${rows.length} rows into ${DB_PATH} and ${JSON_PATH}`);
}

seed();
