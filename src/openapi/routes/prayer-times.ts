import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { computePrayerTimes } from "../../prayer-times/prayer-times";
import { isValidGregorianDate } from "../../date-utils";
import { prayerTimesCache } from "../../cache";
import { db } from "../../db";
import { regions } from "../../db/schema";
import { eq } from "drizzle-orm";
import { ErrorResponseSchema, PrayerTimesResponseSchema } from "../schemas";

const app = new OpenAPIHono();

const prayerTimesQuerySchema = z.object({
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
  date: z.string().optional().openapi({
    param: { name: "date", in: "query" },
    description: "Date in YYYY-MM-DD format (default: today)",
    example: "2026-08-18",
  }),
  tz: z.string().optional().openapi({
    param: { name: "tz", in: "query" },
    description: "UTC offset in hours (default: auto from longitude). Examples: 7 for WIB, 8 for WITA, 9 for WIT",
    example: "7",
  }),
});

const prayerTimesRoute = createRoute({
  method: "get",
  path: "/prayer-times",
  tags: ["Prayer Times"],
  summary: "Get daily prayer times",
  description:
    "Returns Fajr, Sunrise, Dhuhr, Asr, Maghrib, and Isha times using Kemenag RI method (Fajr 20°, Isha 18°, Shafi madhab). Provide lat/long or districtCode.",
  request: { query: prayerTimesQuerySchema },
  responses: {
    200: {
      content: { "application/json": { schema: PrayerTimesResponseSchema } },
      description: "Prayer times",
    },
    400: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Invalid input",
    },
    404: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "District not found",
    },
    500: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Computation error",
    },
  },
});

app.openapi(prayerTimesRoute, (c) => {
  const query = c.req.valid("query");
  let latitude: number;
  let longitude: number;

  if (query.districtCode) {
    const region = db
      .select()
      .from(regions)
      .where(eq(regions.districtCode, query.districtCode!))
      .get();
    if (!region) {
      return c.json({ error: `District not found: ${query.districtCode}` }, 404);
    }
    latitude = region.latitude;
    longitude = region.longitude;
  } else if (query.lat && query.long) {
    latitude = Number(query.lat);
    longitude = Number(query.long);
    if (isNaN(latitude) || isNaN(longitude)) {
      return c.json({ error: "Invalid latitude or longitude." }, 400);
    }
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return c.json({ error: "Latitude must be -90..90, longitude -180..180." }, 400);
    }
  } else {
    return c.json({ error: "Provide lat/long or districtCode parameter." }, 400);
  }

  let year: number, month: number, day: number;

  if (query.date) {
    const segments = query.date.split("-");
    if (segments.length !== 3 || segments.some((s) => isNaN(Number(s)))) {
      return c.json({ error: "Invalid date format. Use YYYY-MM-DD." }, 400);
    }
    year = Number(segments[0]);
    month = Number(segments[1]);
    day = Number(segments[2]);
  } else {
    const now = new Date();
    year = now.getFullYear();
    month = now.getMonth() + 1;
    day = now.getDate();
  }

  if (!isValidGregorianDate(year, month, day)) {
    return c.json({ error: "Invalid date values." }, 400);
  }

  let timezoneOffset: number | undefined;
  if (query.tz) {
    timezoneOffset = Number(query.tz);
    if (isNaN(timezoneOffset) || timezoneOffset < -12 || timezoneOffset > 14) {
      return c.json({ error: "Invalid timezone offset. Must be -12 to 14." }, 400);
    }
  }

  const cacheKey = `prayer:${latitude}:${longitude}:${year}-${month}-${day}:${timezoneOffset ?? "auto"}`;
  const cached = prayerTimesCache.get(cacheKey);
  if (cached) return c.json(cached, 200);

  try {
    const result = computePrayerTimes(year, month, day, latitude, longitude, undefined, timezoneOffset);
    const response = {
      date: { year, month, day },
      coordinates: { latitude, longitude },
      method: "Kemenag",
      timezone: timezoneOffset !== undefined ? `UTC${timezoneOffset >= 0 ? "+" : ""}${timezoneOffset}` : `UTC${Math.round(longitude / 15) >= 0 ? "+" : ""}${Math.round(longitude / 15)}`,
      times: result,
    };
    prayerTimesCache.set(cacheKey, response);
    return c.json(response, 200);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to compute prayer times.";
    return c.json({ error: message }, 500);
  }
});

export default app;
