import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { db } from "../../db";
import { regions } from "../../db/schema";
import { eq, like } from "drizzle-orm";
import {
  ErrorResponseSchema,
  RegionResponseSchema,
  RegionSearchResponseSchema,
} from "../schemas";

const app = new OpenAPIHono();

const regionSearchQuerySchema = z.object({
  q: z.string().min(2).openapi({
    param: { name: "q", in: "query" },
    description: "Search query (min 2 characters)",
    example: "menteng",
  }),
});

const regionSearchRoute = createRoute({
  method: "get",
  path: "/search",
  tags: ["Regions"],
  summary: "Search kecamatan by name",
  description: "Search districts (kecamatan) by name. Returns up to 20 results.",
  request: { query: regionSearchQuerySchema },
  responses: {
    200: {
      content: { "application/json": { schema: RegionSearchResponseSchema } },
      description: "Search results",
    },
    400: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "Query too short",
    },
  },
});

app.openapi(regionSearchRoute, (c) => {
  const { q } = c.req.valid("query");
  const results = db
    .select()
    .from(regions)
    .where(like(regions.districtName, `%${q.toUpperCase()}%`))
    .limit(20)
    .all();

  return c.json({ query: q, count: results.length, results }, 200);
});

const regionByCodeParamsSchema = z.object({
  districtCode: z.string().openapi({
    param: { name: "districtCode", in: "path" },
    description: "Kemendagri district code",
    example: "31.71.01",
  }),
});

const regionByCodeRoute = createRoute({
  method: "get",
  path: "/{districtCode}",
  tags: ["Regions"],
  summary: "Get kecamatan by code",
  description: "Lookup a district (kecamatan) by its Kemendagri code.",
  request: { params: regionByCodeParamsSchema },
  responses: {
    200: {
      content: { "application/json": { schema: RegionResponseSchema } },
      description: "District data",
    },
    404: {
      content: { "application/json": { schema: ErrorResponseSchema } },
      description: "District not found",
    },
  },
});

app.openapi(regionByCodeRoute, (c) => {
  const code = c.req.valid("param").districtCode;
  const result = db
    .select()
    .from(regions)
    .where(eq(regions.districtCode, code))
    .get();

  if (!result) {
    return c.json({ error: `District not found: ${code}` }, 404);
  }

  return c.json(result, 200);
});

export default app;
