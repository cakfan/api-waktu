import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { convertToJavanese } from "./javanese-calendar/convert-to-javanese";
import {
  gregorianToHijri,
  hijriToGregorian,
  getDaysInHijriMonth,
  getHijriMonthName,
  type HijriMonthName,
} from "./hijri-calendar/convert-to-hijri";
import { computePrayerTimes } from "./prayer-times/prayer-times";
import { prayerTimesCache } from "./cache";
import { db } from "./db";
import { regions } from "./db/schema";
import { eq, like, sql } from "drizzle-orm";

const app = new Hono();

app.use("*", logger());
app.use("*", cors());

function parseDate(dateParam: string | undefined): { year: number; month: number; day: number } | { error: string } {
  let year: number;
  let month: number;
  let day: number;

  if (dateParam) {
    const segments = dateParam.split("-");
    if (segments.length !== 3 || segments.some((s) => isNaN(Number(s)))) {
      return { error: "Invalid date format. Use YYYY-MM-DD." };
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

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return { error: "Invalid date values." };
  }

  return { year, month, day };
}

app.get("/", (c) => {
  return c.json({
    name: "api-waktu",
    version: "0.1.0",
    description: "Open source API for prayer times, Hijri calendar, and Javanese calendar",
    endpoints: {
      health: "GET /",
      javaneseDate: "GET /javanese-date?date=YYYY-MM-DD",
      hijriDate: "GET /hijri-date?date=YYYY-MM-DD",
      hijriCalendar: "GET /hijri-calendar?year=1446&month=1",
      prayerTimes: "GET /prayer-times?lat=&long=&date=YYYY-MM-DD",
      prayerTimesByDistrict: "GET /prayer-times?districtCode=31.71.01&date=YYYY-MM-DD",
      regionSearch: "GET /regions/search?q=",
      regionByCode: "GET /regions/:districtCode",
    },
  });
});

app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/javanese-date", (c) => {
  const date = parseDate(c.req.query("date"));
  if ("error" in date) return c.json({ error: date.error }, 400);

  try {
    const result = convertToJavanese(date.year, date.month, date.day);
    return c.json(result);
  } catch {
    return c.json({ error: "Failed to convert date." }, 500);
  }
});

app.get("/hijri-date", (c) => {
  const date = parseDate(c.req.query("date"));
  if ("error" in date) return c.json({ error: date.error }, 400);

  try {
    const result = gregorianToHijri(date.year, date.month, date.day);
    return c.json(result);
  } catch {
    return c.json({ error: "Failed to convert date." }, 500);
  }
});

app.get("/hijri-calendar", (c) => {
  const yearParam = c.req.query("year");
  const monthParam = c.req.query("month");

  if (!yearParam || !monthParam) {
    return c.json({ error: "year and month parameters are required." }, 400);
  }

  const year = Number(yearParam);
  const month = Number(monthParam);

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    return c.json({ error: "Invalid year or month." }, 400);
  }

  const daysInMonth = getDaysInHijriMonth(year, month);
  const monthName = getHijriMonthName(month);

  const days: { day: number; gregorian: { year: number; month: number; day: number } }[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const greg = hijriToGregorian(year, month, d);
    days.push({ day: d, gregorian: greg });
  }

  return c.json({
    year,
    month,
    monthName,
    daysInMonth,
    days,
  });
});

app.get("/prayer-times", (c) => {
  const latParam = c.req.query("lat");
  const longParam = c.req.query("long");
  const districtCode = c.req.query("districtCode");
  const dateParam = c.req.query("date");

  let latitude: number;
  let longitude: number;

  if (districtCode) {
    const region = db
      .select()
      .from(regions)
      .where(eq(regions.districtCode, districtCode))
      .get();
    if (!region) {
      return c.json({ error: `District not found: ${districtCode}` }, 404);
    }
    latitude = region.latitude;
    longitude = region.longitude;
  } else if (latParam && longParam) {
    latitude = Number(latParam);
    longitude = Number(longParam);
    if (isNaN(latitude) || isNaN(longitude)) {
      return c.json({ error: "Invalid latitude or longitude." }, 400);
    }
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return c.json({ error: "Latitude must be -90..90, longitude -180..180." }, 400);
    }
  } else {
    return c.json(
      { error: "Provide lat/long or districtCode parameter." },
      400
    );
  }

  const date = parseDate(dateParam);
  if ("error" in date) return c.json({ error: date.error }, 400);

  const cacheKey = `prayer:${latitude}:${longitude}:${date.year}-${date.month}-${date.day}`;
  const cached = prayerTimesCache.get(cacheKey);
  if (cached) {
    return c.json(cached);
  }

  try {
    const result = computePrayerTimes(date.year, date.month, date.day, latitude, longitude);
    const response = {
      date: { year: date.year, month: date.month, day: date.day },
      coordinates: { latitude, longitude },
      method: "Kemenag",
      times: result,
    };
    prayerTimesCache.set(cacheKey, response);
    return c.json(response);
  } catch {
    return c.json({ error: "Failed to compute prayer times." }, 500);
  }
});

app.get("/regions/search", (c) => {
  const q = c.req.query("q");
  if (!q || q.trim().length < 2) {
    return c.json({ error: "Query must be at least 2 characters." }, 400);
  }

  const results = db
    .select()
    .from(regions)
    .where(like(regions.districtName, `%${q.toUpperCase()}%`))
    .limit(20)
    .all();

  return c.json({ query: q, count: results.length, results });
});

app.get("/regions/:districtCode", (c) => {
  const code = c.req.param("districtCode");
  const result = db
    .select()
    .from(regions)
    .where(eq(regions.districtCode, code))
    .get();

  if (!result) {
    return c.json({ error: `District not found: ${code}` }, 404);
  }

  return c.json(result);
});

const port = Number(process.env.PORT) || 3000;

export default {
  port,
  fetch: app.fetch,
};

console.log(`api-waktu running on http://localhost:${port}`);
