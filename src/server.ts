import Fastify from "fastify";
import "dotenv/config";
import rateLimit from "@fastify/rate-limit";
import helmet from "@fastify/helmet";
import cors from "@fastify/cors";
import { meRoutes } from "./routes/me.js";
import {workspaceRoutes} from "./routes/workspaces.js";
import { buildApp } from "./app.js";


async function start(){
    const app = await buildApp();

    const port = Number(process.env.PORT ?? 3000);
    const host = process.env.HOST ?? "0.0.0.0";
    await app.listen({port, host});
}

start().catch((err) => {
    console.error(err);
    process.exit(1);
});