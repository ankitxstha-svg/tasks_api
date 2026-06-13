import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { buildApp } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import { resetDb, seedUsers, authHeader } from "./helpers/db.js";
import type { FastifyInstance } from "fastify";

let app: FastifyInstance;

beforeEach(async () => {
  await resetDb();
  app = await buildApp();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Auth", () => {
  it("returns 401 when no token on GET /me", async () => {
    const res = await app.inject({
      method: "GET",
      url: "/me",
    });

    expect(res.statusCode).toBe(401);
  });
});

describe("Workspaces", () => {
  it("owner can create a workspace", async () => {
    await seedUsers();

    const res = await app.inject({
      method: "POST",
      url: "/workspaces",
      headers: {
        ...authHeader("auth0|test-owner"),
        "content-type": "application/json",
      },
      payload: { name: "Test Workspace" },
    });

    expect(res.statusCode).toBe(201);
    expect(res.json().name).toBe("Test Workspace");
  });

  it("member can read workspace", async () => {
    const { member } = await seedUsers();

    const createRes = await app.inject({
      method: "POST",
      url: "/workspaces",
      headers: {
        ...authHeader("auth0|test-owner"),
        "content-type": "application/json",
      },
      payload: { name: "Shared Workspace" },
    });

    const workspaceId = createRes.json().id;

    await prisma.membership.create({
      data: {
        userId: member.id,
        workspaceId,
        role: "member",
      },
    });

    const res = await app.inject({
      method: "GET",
      url: `/workspaces/${workspaceId}`,
      headers: authHeader("auth0|test-member"),
    });

    expect(res.statusCode).toBe(200);
  });

  it("non-member gets 403", async () => {
    await seedUsers();

    const createRes = await app.inject({
      method: "POST",
      url: "/workspaces",
      headers: {
        ...authHeader("auth0|test-owner"),
        "content-type": "application/json",
      },
      payload: { name: "Private Workspace" },
    });

    const workspaceId = createRes.json().id;

    const res = await app.inject({
      method: "GET",
      url: `/workspaces/${workspaceId}`,
      headers: authHeader("auth0|test-outsider"),
    });

    expect(res.statusCode).toBe(403);
  });

  it("member cannot invite", async () => {
    const { member } = await seedUsers();

    const createRes = await app.inject({
      method: "POST",
      url: "/workspaces",
      headers: {
        ...authHeader("auth0|test-owner"),
        "content-type": "application/json",
      },
      payload: { name: "Invite Test" },
    });

    const workspaceId = createRes.json().id;

    await prisma.membership.create({
      data: {
        userId: member.id,
        workspaceId,
        role: "member",
      },
    });

    const res = await app.inject({
      method: "POST",
      url: `/workspaces/${workspaceId}/invite`,
      headers: {
        ...authHeader("auth0|test-member"),
        "content-type": "application/json",
      },
      payload: { email: "outsider@test.local" },
    });

    expect(res.statusCode).toBe(403);
  });

  it("owner can invite", async () => {
    await seedUsers();

    await prisma.user.create({
      data: {
        externalAuthId: "auth0|test-invitee",
        email: "invitee@test.local",
      },
    });

    const createRes = await app.inject({
      method: "POST",
      url: "/workspaces",
      headers: {
        ...authHeader("auth0|test-owner"),
        "content-type": "application/json",
      },
      payload: { name: "Invite OK" },
    });

    const workspaceId = createRes.json().id;

    const res = await app.inject({
      method: "POST",
      url: `/workspaces/${workspaceId}/invite`,
      headers: {
        ...authHeader("auth0|test-owner"),
        "content-type": "application/json",
      },
      payload: { email: "invitee@test.local" },
    });

    expect(res.statusCode).toBe(201);
    expect(res.json().role).toBe("member");
  });
});