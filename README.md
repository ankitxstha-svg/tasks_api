#tasks_api


# Tasks API

A small **multi-tenant Tasks API** built to demonstrate authentication, authorization (RBAC + resource ownership), and API security basics.

## Status

**In progress** — current milestone:

- [x] Fastify server with health check (`GET /health`)
- [x] PostgreSQL + Prisma schema (User, Workspace, Membership, Task)
- [x] Initial migration and Prisma Client generation
- [ ] JWT verification + user sync (`GET /me`)
- [ ] Workspace & task routes with role-based access control
- [ ] Validation, rate limiting, tests, and demo README

## What this will demonstrate

- **Authentication** — verify real users via a managed auth provider (JWT / JWKS)
- **Authorization** — workspace roles (`owner`, `member`) and rules such as “only owner can delete workspace” and “task delete: creator OR owner”
- **Security** — rate limits, safe token handling, correct `401` vs `403`

## Stack

- Node.js + TypeScript
- [Fastify](https://fastify.dev/)
- PostgreSQL + [Prisma](https://www.prisma.io/) (v7)
- [Zod](https://zod.dev/) (request validation — planned)
- Managed auth (Clerk / Auth0 — planned)

## Data model (high level)

| Entity       | Purpose                                      |
|-------------|-----------------------------------------------|
| `User`      | Internal user mapped from auth provider `sub` |
| `Workspace` | Tenant container; has an owner                 |
| `Membership`| User ↔ workspace with role (`owner` / `member`) |
| `Task`      | Task in a workspace; tracks `createdById`      |

## Prerequisites

- Node.js 20+
- PostgreSQL running locally (or a remote URL)

## Local setup

```bash
git clone <your-repo-url>
cd task-api
npm install