import { z } from "@hono/zod-openapi";

export const ErrorResponseSchema = z.object({
  error: z.string(),
});

export const HealthResponseSchema = z.object({
  status: z.string(),
  timestamp: z.string(),
});

export const JavaneseDateResponseSchema = z.object({
  dayOfWeek: z.string().openapi({ example: "Selasa" }),
  pasaran: z.string().openapi({ example: "Pahing" }),
  wuku: z.string().openapi({ example: "Medangkungan" }),
  neptu: z.number().openapi({ example: 10 }),
  date: z.string().openapi({ example: "2026-08-18" }),
});

export const HijriDateResponseSchema = z.object({
  year: z.number(),
  month: z.number(),
  day: z.number(),
  monthName: z.string(),
  daysInMonth: z.number(),
});

export const HijriCalendarDaySchema = z.object({
  day: z.number(),
  gregorian: z.object({
    year: z.number(),
    month: z.number(),
    day: z.number(),
  }),
});

export const HijriCalendarResponseSchema = z.object({
  year: z.number(),
  month: z.number(),
  monthName: z.string(),
  daysInMonth: z.number(),
  days: z.array(HijriCalendarDaySchema),
});

export const PrayerTimesResponseSchema = z.object({
  date: z.object({
    year: z.number(),
    month: z.number(),
    day: z.number(),
  }),
  coordinates: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
  method: z.string(),
  timezone: z.string(),
  times: z.object({
    fajr: z.string(),
    sunrise: z.string(),
    dhuhr: z.string(),
    asr: z.string(),
    maghrib: z.string(),
    isha: z.string(),
  }),
});

export const PrayerTimesDaySchema = z.object({
  day: z.number(),
  times: z.object({
    fajr: z.string(),
    sunrise: z.string(),
    dhuhr: z.string(),
    asr: z.string(),
    maghrib: z.string(),
    isha: z.string(),
  }),
});

export const PrayerTimesMonthResponseSchema = z.object({
  year: z.number(),
  month: z.number(),
  coordinates: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
  method: z.string(),
  timezone: z.string(),
  daysInMonth: z.number(),
  days: z.array(PrayerTimesDaySchema),
});

export const RegionResponseSchema = z.object({
  provinceCode: z.string(),
  provinceName: z.string(),
  regencyCode: z.string(),
  regencyName: z.string(),
  regencyType: z.string(),
  districtCode: z.string(),
  districtName: z.string(),
  latitude: z.number(),
  longitude: z.number(),
});

export const RegionSearchResponseSchema = z.object({
  query: z.string(),
  count: z.number(),
  results: z.array(RegionResponseSchema),
});
