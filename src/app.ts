import Fastify from "fastify";
import rateLimit from "@fastify/rate-limit";
import helmet from "@fastify/helmet";
import cors from "@fastify/cors";
import { meRoutes } from "./routes/me.js";
import { workspaceRoutes } from "./routes/workspaces.js";

export async function buildApp() {
  const app = Fastify({ logger: true });

  await app.register(helmet);
  await app.register(cors, {
    origin: process.env.CORS_ORIGIN || false,
    methods: ["GET", "POST", "DELETE"],
  });

  // Skip rate limit in tests (avoids flaky 429s)
  if (process.env.NODE_ENV !== "test") {
    await app.register(rateLimit, {
      global: true,
      max: 100,
      timeWindow: "1 minute",
    });
  }

  app.get("/health", async () => ({ ok: true }));

  app.register(meRoutes);
  app.register(workspaceRoutes);

  return app;
}