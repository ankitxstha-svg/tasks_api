import Fastify from "fastify";
import "dotenv/config";
import { meRoutes } from "./routes/me.js";
import {workspaceRoutes} from "./routes/workspaces.js";

const app = Fastify({logger: true});

app.get("/health", async()=>{
    return {ok : true};
});

app.register(meRoutes);
app.register(workspaceRoutes);

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? "0.0.0.0";

app.listen({port, host}).catch((err)=>{
    app.log.error(err);
    process.exit(1);
})