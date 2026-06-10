import { FastifyInstance } from "fastify";
import { authenticate } from "../middleware/authenticate.js";
import { prisma } from "../lib/prisma.js";
import { loadWorkspaceMembership } from "../middleware/loadWorkspaceMembership.js";
import { requireWorkspaceRole } from "../middleware/requireWorkspaceRole.js";

export async function workspaceRoutes(app: FastifyInstance) {
  app.post(
    "/workspaces",
    { preHandler: [...authenticate] },
    async (request, reply) => {
      const body = request.body as { name?: string };

      if (!body?.name || body.name.trim().length === 0) {
        return reply.status(400).send({
          error: "BAD_REQUEST",
          message: "name is required",
        });
      }

      const userId = request.user!.id;
      const name = body.name.trim();

      const workspace = await prisma.$transaction(async (tx) => {
        const ws = await tx.workspace.create({
          data: {
            name,
            ownerId: userId,
          },
        });

        await tx.membership.create({
          data: {
            userId,
            workspaceId: ws.id,
            role: "owner",
          },
        });

        return ws;
      });

      return reply.status(201).send(workspace);
    }
  );

  app.get(
    "/workspaces/:workspaceId",
    {
      preHandler: [
        ...authenticate,
        loadWorkspaceMembership(),
        requireWorkspaceRole("member"),
      ],
    },
    async (request, reply) => {
      const { workspaceId } = request.params as { workspaceId: string };

      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
      });

      if (!workspace) {
        return reply.status(404).send({
          error: "NOT_FOUND",
          message: "Workspace not found",
        });
      }

      return workspace;
    }
  );

  app.post(
    "/workspaces/:workspaceId/invite",
    {
      preHandler: [
        ...authenticate,
        loadWorkspaceMembership(),
        requireWorkspaceRole("owner"),
      ],
    },

    async (request, reply) => {
      const {workspaceId} = request.params as {workspaceId: string};
      const body = request.body as {email?: string};

      if(!body?.email || body.email.trim().length === 0){
        return reply.status(400).send({
          error: "bad request",
          message:"email is required",
        });
      }

      const email = body.email.trim().toLowerCase();

      const invitedUser = await prisma.user.findUnique({
        where: {email},
      });

      if(!invitedUser){
        return reply.status(404).send({
          error: "not found",
          message: "user with this email has not signed in yet"
        });
      }

      const existing = await prisma.membership.findUnique({
        where:{
          userId_workspaceId: {
            userId: invitedUser.id,
            workspaceId,
          },
        },
      });

      if(existing){
        return reply.status(409).send({
          error: "conflict",
          message: "User is already a member of this workspace",
        });
      }

      const membership = await prisma.membership.create({
        data: {
          userId: invitedUser.id,
          workspaceId,
          role: "member",
        },
      });

      return reply.status(201).send({
        userId: membership.userId,
        workspaceId: membership.workspaceId,
        role: membership.role
      });
    }
  );
}