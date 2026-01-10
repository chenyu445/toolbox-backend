import { serve } from "@hono/node-server";
import { config } from "dotenv";

config({ path: ".env.local" });

const port = 3000;

console.log(`Server is running on http://localhost:${port}`);

const { default: app } = await import("./index.ts");

serve({
  fetch: app.fetch,
  port,
});
