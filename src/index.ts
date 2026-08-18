import "hono";
import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import healthRoutes from "./openapi/routes/health";
import calendarRoutes from "./openapi/routes/calendar";
import prayerTimesRoutes from "./openapi/routes/prayer-times";
import regionsRoutes from "./openapi/routes/regions";
import { swaggerHtml } from "./openapi/swagger-html";
import { rateLimiter } from "./rate-limit";

const app = new OpenAPIHono();

app.use("*", logger());
app.use("*", cors());
app.use("*", rateLimiter(60, 60_000));

app.route("/", healthRoutes);
app.route("/", calendarRoutes);
app.route("/", prayerTimesRoutes);
app.route("/regions", regionsRoutes);

app.get("/", (c) => {
  return c.json({
    name: "api-waktu",
    version: "0.1.0",
    description: "Open source API for prayer times, Hijri calendar, and Javanese calendar",
    docs: "GET /docs",
  });
});

app.doc("/openapi.json", {
  openapi: "3.0.3",
  info: {
    title: "api-waktu",
    version: "0.1.0",
    description:
      "Open source API for prayer times, Hijri calendar, and Javanese calendar. Uses Kemenag RI method (Fajr 20°, Isha 18°) for prayer times, Tabular Islamic Calendar for Hijri dates, and astronomical algorithms for Javanese calendar.",
    license: { name: "MIT" },
  },
  servers: [
    {
      url: process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000",
      description: process.env.VERCEL_ENV === "production" ? "Production" : "Development",
    },
  ],
});

app.get("/docs", (c) => {
  return c.html(swaggerHtml);
});

export default app;

if (import.meta.main) {
  const port = Number(process.env.PORT) || 3000;
  console.log(`api-waktu running on http://localhost:${port}`);
}
