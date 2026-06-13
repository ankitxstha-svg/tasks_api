#tasks_api

# Tasks API

Multi-tenant Tasks API built with Node.js, TypeScript, Fastify, Prisma, and PostgreSQL. Demonstrates Auth0 authentication, workspace RBAC, and integration tests.

## Status

Work in progress — multi-tenant Tasks API with Auth0 + RBAC.

- [x] Health check (`GET /health`)
- [x] Prisma schema + migrations (User, Workspace, Membership, Task)
- [x] Auth0 JWT verification + user sync (`GET /me`)
- [x] Authorization middleware (membership, roles)
- [x] Workspaces (create, get, delete)
- [x] Invite members (owner only)
- [x] Tasks (list, create, delete with creator/owner rules)
- [ ] Zod validation, rate limiting, tests, demo README


## What this demonstrates

- **Authentication** — Auth0 JWT verification (JWKS), mapped to internal `User` rows via `externalAuthId`
- **Authorization** — Workspace roles (`owner`, `member`), membership checks, owner-only invite
- **Security** — Helmet, CORS, rate limiting, consistent error responses, Zod validation
- **Testing** — Vitest integration tests for 401 / 403 / 201 without real Auth0 tokens

## Stack

- Node.js + TypeScript
- Fastify
- PostgreSQL + Prisma 7
- Auth0 (JWT)
- Zod
- Vitest

## Data model

| Model        | Purpose |
|-------------|---------|
| User        | Internal user; `externalAuthId` = Auth0 `sub` |
| Workspace   | Tenant; has `ownerId` |
| Membership  | User ↔ workspace + role (`owner` / `member`) |


## Prerequisites

- Node.js 20+
- PostgreSQL
- Auth0 account (API + Regular Web Application for Postman)

## Setup

git clone <your-repo-url>
cd task-api
npm install
cp .env.example .env
# Edit .env: DATABASE_URL, AUTH0_DOMAIN, AUTH0_AUDIENCE, AUTH0_ISSUER

npx prisma migrate dev
npx prisma generate
npm run dev

## Auth (Postman)

1. Create Auth0 **API** (identifier = audience, e.g. `https://tasks-api`)
2. Create **Regular Web Application**; callback `https://oauth.pstmn.io/v1/callback`
3. In Postman OAuth 2.0, set **audience** on **Auth Request** and **Token Request**
4. Get Access Token → use as `Authorization: Bearer <token>`


## Authorization rules

| Action | Who |
|--------|-----|
| `GET /me` | Authenticated user |
| `POST /workspaces` | Any authenticated user (becomes owner) |
| `GET /workspaces/:id` | Workspace member (owner or member) |
| `POST /workspaces/:id/invite` | Owner only |
| Non-member access | 403 |
| No / invalid token | 401 |

## Tests

Create test DB and `.env.test`, then:

DATABASE_URL="...tasks_api_test..." npx prisma migrate deploy
npm test

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server |
| `npm run build` | Compile TypeScript |
| `npm start` | Run compiled app |
| `npm test` | Integration tests |
| `npx prisma studio` | DB UI |

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| DATABASE_URL | Yes | Postgres connection |
| AUTH0_DOMAIN | Yes | Auth0 tenant domain |
| AUTH0_AUDIENCE | Yes | API identifier |
| AUTH0_ISSUER | Yes | Issuer URL (usually trailing `/`) |
| PORT | No | Default 3000 |
| CORS_ORIGIN | No | Frontend origin; empty = disabled |
