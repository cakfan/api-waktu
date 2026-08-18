import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { HealthResponseSchema } from "../schemas";

const app = new OpenAPIHono();

const healthRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Health"],
  summary: "Health check",
  responses: {
    200: {
      content: { "application/json": { schema: HealthResponseSchema } },
      description: "Server status",
    },
  },
});

app.openapi(healthRoute, (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

export default app;
