import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const regions = sqliteTable("regions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  provinceCode: text("province_code").notNull(),
  provinceName: text("province_name").notNull(),
  regencyCode: text("regency_code").notNull(),
  regencyName: text("regency_name").notNull(),
  regencyType: text("regency_type").notNull(),
  districtCode: text("district_code").notNull(),
  districtName: text("district_name").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
});
