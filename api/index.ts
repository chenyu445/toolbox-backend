import { Hono } from "hono";
import { handle } from "hono/vercel";
import authRoutes from "../src/routes/auth.js";
import passwordRoutes from "../src/routes/passwords.js";

const app = new Hono().basePath("/");
app.get("/", (c) => {
  return c.text("Damon love you");
});
// Routes
app.route("/auth", authRoutes);
app.route("/passwords", passwordRoutes);

// Health check
app.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: "Not Found" }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error("Error:", err);
  return c.json({ error: "Internal Server Error", message: err.message }, 500);
});

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);
export const PATCH = handle(app);

export default app;
