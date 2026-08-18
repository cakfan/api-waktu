import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { computePrayerTimes, METHODS } from "../../prayer-times/prayer-times";
import { isValidGregorianDate } from "../../date-utils";
import { prayerTimesCache } from "../../cache";
import { findDistrict } from "../../db";
import {
  ErrorResponseSchema,
  PrayerTimesResponseSchema,
  PrayerTimesMonthResponseSchema,
} from "../schemas";

const app = new OpenAPIHono();

const methodNames = Object.keys(METHODS);

const baseQuerySchema = z.object({
  lat: z.string().optional().openapi({
    param: { name: "lat", in: "query" },
    description: "Latitude (-90 to 90)",
    example: "-6.2088",
  }),
  long: z.string().optional().openapi({
    param: { name: "long", in: "query" },
    description: "Longitude (-180 to 180)",
    example: "106.8456",
  }),
  districtCode: z.string().optional().openapi({
    param: { name: "districtCode", in: "query" },
    description: "Kemendagri district code (e.g. 31.71.01)",
    example: "31.71.01",
  }),
  method: z.string().optional().openapi({
    param: { name: "method", in: "query" },
    description: `Calculation method. Available: ${methodNames.join(", ")}`,
    example: "Kemenag",
  }),
  tz: z.string().optional().openapi({
    param: { name: "tz", in: "query" },
    description: "UTC offset in hours (default: auto from longitude). Examples: 7 for WIB, 8 for WITA, 9 for WIT",
    example: "7",
  }),
});

function resolveCoords(query: { lat?: string; long?: string; districtCode?: string }, c: any): { latitude: number; longitude: number } | { Response: any } {
  if (query.districtCode) {
    const region = findDistrict(query.districtCode);
    if (!region) return { Response: c.json({ error: `District not found: ${query.districtCode}` }, 404) };
    return { latitude: region.latitude, longitude: region.longitude };
  }
  if (query.lat && query.long) {
    const latitude = Number(query.lat);
    const longitude = Number(query.long);
    if (isNaN(latitude) || isNaN(longitude)) return { Response: c.json({ error: "Invalid latitude or longitude." }, 400) };
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180)
      return { Response: c.json({ error: "Latitude must be -90..90, longitude -180..180." }, 400) };
    return { latitude, longitude };
  }
  return { Response: c.json({ error: "Provide lat/long or districtCode parameter." }, 400) };
}

function getOffset(tz: string | undefined, longitude: number): number {
  if (tz) {
    const n = Number(tz);
    if (!isNaN(n) && n >= -12 && n <= 14) return n;
  }
  return Math.round(longitude / 15);
}

function formatTz(offset: number): string {
  return `UTC${offset >= 0 ? "+" : ""}${offset}`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

const prayerTimesRoute = createRoute({
  method: "get",
  path: "/prayer-times",
  tags: ["Prayer Times"],
  summary: "Get daily prayer times",
  description: "Returns Fajr, Sunrise, Dhuhr, Asr, Maghrib, and Isha times. Default method: Kemenag (Indonesia).",
  request: {
    query: baseQuerySchema.extend({
      date: z.string().optional().openapi({ param: { name: "date", in: "query" }, description: "Date in YYYY-MM-DD format (default: today)", example: "2026-08-18" }),
    }),
  },
  responses: {
    200: { content: { "application/json": { schema: PrayerTimesResponseSchema } }, description: "Prayer times" },
    400: { content: { "application/json": { schema: ErrorResponseSchema } }, description: "Invalid input" },
    404: { content: { "application/json": { schema: ErrorResponseSchema } }, description: "District not found" },
    500: { content: { "application/json": { schema: ErrorResponseSchema } }, description: "Computation error" },
  },
});

app.openapi(prayerTimesRoute, (c) => {
  const query = c.req.valid("query");

  const loc = resolveCoords(query, c);
  if ("Response" in loc) return loc.Response;
  const { latitude, longitude } = loc;

  let year: number, month: number, day: number;
  if (query.date) {
    const s = query.date.split("-");
    if (s.length !== 3 || s.some((x) => isNaN(Number(x))))
      return c.json({ error: "Invalid date format. Use YYYY-MM-DD." }, 400);
    year = Number(s[0]); month = Number(s[1]); day = Number(s[2]);
  } else {
    const now = new Date(); year = now.getFullYear(); month = now.getMonth() + 1; day = now.getDate();
  }
  if (!isValidGregorianDate(year, month, day)) return c.json({ error: "Invalid date values." }, 400);

  const methodName = query.method || "Kemenag";
  const methodParams = METHODS[methodName];
  if (!methodParams) return c.json({ error: `Unknown method: ${methodName}. Available: ${methodNames.join(", ")}` }, 400);

  const tzOffset = getOffset(query.tz, longitude);
  const cacheKey = `prayer:${latitude}:${longitude}:${year}-${month}-${day}:${methodName}:${tzOffset}`;
  const cached = prayerTimesCache.get(cacheKey);
  if (cached) return c.json(cached, 200);

  try {
    const result = computePrayerTimes(year, month, day, latitude, longitude, methodParams, tzOffset);
    const response = {
      date: { year, month, day },
      coordinates: { latitude, longitude },
      method: methodName,
      timezone: formatTz(tzOffset),
      times: result,
    };
    prayerTimesCache.set(cacheKey, response);
    return c.json(response, 200);
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : "Failed to compute prayer times." }, 500);
  }
});

const prayerTimesMonthRoute = createRoute({
  method: "get",
  path: "/prayer-times/month",
  tags: ["Prayer Times"],
  summary: "Get monthly prayer times",
  description: "Returns prayer times for every day in a given month.",
  request: {
    query: baseQuerySchema.extend({
      year: z.string().openapi({ param: { name: "year", in: "query" }, description: "Year (e.g. 2026)", example: "2026" }),
      month: z.string().openapi({ param: { name: "month", in: "query" }, description: "Month (1-12)", example: "8" }),
    }),
  },
  responses: {
    200: { content: { "application/json": { schema: PrayerTimesMonthResponseSchema } }, description: "Monthly prayer times" },
    400: { content: { "application/json": { schema: ErrorResponseSchema } }, description: "Invalid input" },
    404: { content: { "application/json": { schema: ErrorResponseSchema } }, description: "District not found" },
    500: { content: { "application/json": { schema: ErrorResponseSchema } }, description: "Computation error" },
  },
});

app.openapi(prayerTimesMonthRoute, (c) => {
  const query = c.req.valid("query");

  const loc = resolveCoords(query, c);
  if ("Response" in loc) return loc.Response;
  const { latitude, longitude } = loc;

  const year = Number(query.year);
  const month = Number(query.month);
  if (isNaN(year) || isNaN(month) || !isValidGregorianDate(year, month, 1))
    return c.json({ error: "Invalid year or month." }, 400);

  const methodName = query.method || "Kemenag";
  const methodParams = METHODS[methodName];
  if (!methodParams) return c.json({ error: `Unknown method: ${methodName}. Available: ${methodNames.join(", ")}` }, 400);

  const tzOffset = getOffset(query.tz, longitude);
  const daysInMonth = getDaysInMonth(year, month);

  const cacheKey = `prayer-month:${latitude}:${longitude}:${year}-${month}:${methodName}:${tzOffset}`;
  const cached = prayerTimesCache.get(cacheKey);
  if (cached) return c.json(cached, 200);

  try {
    const days: { day: number; times: { fajr: string; sunrise: string; dhuhr: string; asr: string; maghrib: string; isha: string } }[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({ day: d, times: computePrayerTimes(year, month, d, latitude, longitude, methodParams, tzOffset) });
    }
    const response = {
      year, month,
      coordinates: { latitude, longitude },
      method: methodName,
      timezone: formatTz(tzOffset),
      daysInMonth,
      days,
    };
    prayerTimesCache.set(cacheKey, response);
    return c.json(response, 200);
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : "Failed to compute prayer times." }, 500);
  }
});

export default app;
