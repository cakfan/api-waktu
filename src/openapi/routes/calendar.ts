import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { convertToJavanese } from "../../javanese-calendar/convert-to-javanese";
import {
  gregorianToHijri,
  hijriToGregorian,
  getDaysInHijriMonth,
  getHijriMonthName,
} from "../../hijri-calendar/convert-to-hijri";
import {
  ErrorResponseSchema,
  JavaneseDateResponseSchema,
  HijriDateResponseSchema,
  HijriCalendarResponseSchema,
} from "../schemas";

const app = new OpenAPIHono();

const dateQuerySchema = z.object({
  date: z.string().optional().openapi({
    param: { name: "date", in: "query" },
    description: "Date in YYYY-MM-DD format (default: today)",
    example: "2026-08-18",
  }),
});

const javaneseDateRoute = createRoute({
  method: "get",
  path: "/javanese-date",
  tags: ["Calendar"],
  summary: "Convert Gregorian date to Javanese calendar",
  description: "Returns day-of-week, pasaran, wuku, and neptu for a given Gregorian date.",
  request: { query: dateQuerySchema },
  responses: {
    200: {
      content: { "application/json": { schema: JavaneseDateResponseSchema } },
      description: "Javanese date",
    },
    400: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Invalid date",
    },
    500: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Conversion error",
    },
  },
});

app.openapi(javaneseDateRoute, (c) => {
  const dateParam = c.req.valid("query").date;
  let year: number, month: number, day: number;

  if (dateParam) {
    const segments = dateParam.split("-");
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

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return c.json({ error: "Invalid date values." }, 400);
  }

  try {
    return c.json(convertToJavanese(year, month, day), 200);
  } catch {
    return c.json({ error: "Failed to convert date." }, 500);
  }
});

const hijriDateRoute = createRoute({
  method: "get",
  path: "/hijri-date",
  tags: ["Calendar"],
  summary: "Convert Gregorian date to Hijri (Islamic) calendar",
  description: "Uses Tabular Islamic Calendar (Kuwaiti algorithm). May differ ±1 day from observation-based calendars.",
  request: { query: dateQuerySchema },
  responses: {
    200: {
      content: { "application/json": { schema: HijriDateResponseSchema } },
      description: "Hijri date",
    },
    400: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Invalid date",
    },
    500: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Conversion error",
    },
  },
});

app.openapi(hijriDateRoute, (c) => {
  const dateParam = c.req.valid("query").date;
  let year: number, month: number, day: number;

  if (dateParam) {
    const segments = dateParam.split("-");
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

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return c.json({ error: "Invalid date values." }, 400);
  }

  try {
    return c.json(gregorianToHijri(year, month, day), 200);
  } catch {
    return c.json({ error: "Failed to convert date." }, 500);
  }
});

const hijriCalendarQuerySchema = z.object({
  year: z.string().openapi({
    param: { name: "year", in: "query" },
    description: "Hijri year",
    example: "1447",
  }),
  month: z.string().openapi({
    param: { name: "month", in: "query" },
    description: "Hijri month (1-12)",
    example: "2",
  }),
});

const hijriCalendarRoute = createRoute({
  method: "get",
  path: "/hijri-calendar",
  tags: ["Calendar"],
  summary: "Get full Hijri month with Gregorian equivalents",
  description: "Returns all days in a Hijri month with their Gregorian equivalent dates.",
  request: { query: hijriCalendarQuerySchema },
  responses: {
    200: {
      content: { "application/json": { schema: HijriCalendarResponseSchema } },
      description: "Hijri month calendar",
    },
    400: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Invalid year or month",
    },
  },
});

app.openapi(hijriCalendarRoute, (c) => {
  const { year: yearParam, month: monthParam } = c.req.valid("query");
  const year = Number(yearParam);
  const month = Number(monthParam);

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    return c.json({ error: "Invalid year or month." }, 400);
  }

  const daysInMonth = getDaysInHijriMonth(year, month);
  const monthName = getHijriMonthName(month);
  const days: { day: number; gregorian: { year: number; month: number; day: number } }[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    days.push({ day: d, gregorian: hijriToGregorian(year, month, d) });
  }

  return c.json({ year, month, monthName, daysInMonth, days }, 200);
});

export default app;
