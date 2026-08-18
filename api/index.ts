import { createApp } from "../src/app";

const app = createApp();

export default async function handler(request: Request): Promise<Response> {
  return app.fetch(request);
}
