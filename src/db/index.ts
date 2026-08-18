import { readFileSync } from "fs";
import { join } from "path";

export interface Region {
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

const regions: Region[] = JSON.parse(
  readFileSync(join(import.meta.dir, "..", "..", "data", "regions.json"), "utf-8")
);

const byCode = new Map<string, Region>();
for (const r of regions) {
  byCode.set(r.districtCode, r);
}

export function findDistrict(districtCode: string): Region | undefined {
  return byCode.get(districtCode);
}

export function searchDistricts(query: string, limit = 20): Region[] {
  const upper = query.toUpperCase();
  const results: Region[] = [];
  for (const r of regions) {
    if (r.districtName.includes(upper)) {
      results.push(r);
      if (results.length >= limit) break;
    }
  }
  return results;
}
