import { FastifyInstance } from "fastify";
import { z } from "zod";
import { ErrorCode, errorResponse } from "../lib/error.js";

const signupBodySchema = z.object({
  email: z.string().email("email must be valid"),
  password: z.string().min(8, "password must be at least 8 characters"),
});

const loginBodySchema = z.object({
  email: z.string().email("email must be valid"),
  password: z.string().min(1, "password is required"),
});

export async function authRoutes(app: FastifyInstance) {
  app.post("/auth/signup", async (request, reply) => {
    const parsed = signupBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send(
        errorResponse(ErrorCode.BAD_REQUEST, parsed.error.issues[0]?.message ?? "Invalid body")
      );
    }

    const { email, password } = parsed.data;
    const domain = process.env.AUTH0_DOMAIN!;
    const clientId = process.env.AUTH0_CLIENT_ID!;
    const connection = process.env.AUTH0_CONNECTION ?? "Username-Password-Authentication";

    const res = await fetch(`https://${domain}/dbconnections/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        email,
        password,
        connection,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const message =
        typeof data?.description === "string"
          ? data.description
          : typeof data?.message === "string"
            ? data.message
            : "Signup failed";
      return reply.status(400).send(errorResponse(ErrorCode.BAD_REQUEST, message));
    }

    return reply.status(201).send({ message: "Account created. You can log in now." });
  });

  app.post("/auth/login", async (request, reply) => {
    const parsed = loginBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send(
        errorResponse(ErrorCode.BAD_REQUEST, parsed.error.issues[0]?.message ?? "Invalid body")
      );
    }

    const { email, password } = parsed.data;
    const domain = process.env.AUTH0_DOMAIN!;
    const clientId = process.env.AUTH0_CLIENT_ID!;
    const clientSecret = process.env.AUTH0_CLIENT_SECRET!;
    const audience = process.env.AUTH0_AUDIENCE!;
    const connection = process.env.AUTH0_CONNECTION ?? "Username-Password-Authentication";

    const body = new URLSearchParams({
      grant_type: "password",
      username: email,
      password,
      client_id: clientId,
      client_secret: clientSecret,
      audience,
      scope: "openid profile email",
      connection,
    });

    const res = await fetch(`https://${domain}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return reply.status(401).send(
        errorResponse(
          ErrorCode.UNAUTHORIZED,
          typeof data?.error_description === "string"
            ? data.error_description
            : "Invalid email or password"
        )
      );
    }

    return reply.send({
      access_token: data.access_token,
      expires_in: data.expires_in,
      token_type: data.token_type,
    });
  });
}