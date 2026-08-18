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
import { db } from "./db";
import { regions } from "./db/schema";
import { eq, like, sql } from "drizzle-orm";

const app = new Hono();

app.use("*", logger());
app.use("*", cors());

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
      regionSearch: "GET /regions/search?q=",
      regionByCode: "GET /regions/:districtCode",
    },
  });
});

app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/javanese-date", (c) => {
  const dateParam = c.req.query("date");

  let year: number;
  let month: number;
  let day: number;

  if (dateParam) {
    const segments = dateParam.split("-");
    if (segments.length !== 3 || segments.some((s) => isNaN(Number(s)))) {
      return c.json(
        { error: "Invalid date format. Use YYYY-MM-DD." },
        400
      );
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
    return c.json({ error: "Invalid date values." }, 400);
  }

  try {
    const result = convertToJavanese(year, month, day);
    return c.json(result);
  } catch {
    return c.json({ error: "Failed to convert date." }, 500);
  }
});

app.get("/hijri-date", (c) => {
  const dateParam = c.req.query("date");

  let year: number;
  let month: number;
  let day: number;

  if (dateParam) {
    const segments = dateParam.split("-");
    if (segments.length !== 3 || segments.some((s) => isNaN(Number(s)))) {
      return c.json(
        { error: "Invalid date format. Use YYYY-MM-DD." },
        400
      );
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
    return c.json({ error: "Invalid date values." }, 400);
  }

  try {
    const result = gregorianToHijri(year, month, day);
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
