import { FastifyInstance } from "fastify";
import { authenticate } from "../middleware/authenticate.js";
import { prisma } from "../lib/prisma.js";
import { loadWorkspaceMembership } from "../middleware/loadWorkspaceMembership.js";
import { requireWorkspaceRole } from "../middleware/requireWorkspaceRole.js";

import { validateBody, validateParams } from "../validation/validate.js";
import {
  createWorkspaceBodySchema,
  inviteBodySchema,
  workspaceIdParamSchema,
} from "../validation/schemas.js";
import { ErrorCode, errorResponse } from "../lib/error.js";

export async function workspaceRoutes(app: FastifyInstance) {
  app.post(
    "/workspaces",
    { preHandler: [...authenticate] },
    async (request, reply) => {
      const body = validateBody(
        createWorkspaceBodySchema,
        request.body,
        reply
      );
      if (!body) return;

      const userId = request.user!.id;
      const name = body.name;

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

      const params = validateParams(
        workspaceIdParamSchema,
        request.params,
        reply
      );
      if (!params) return;

      const workspace = await prisma.workspace.findUnique({
        where: { id: params.workspaceId },
      });

      if (!workspace) {
        return reply.status(404).send(
          errorResponse(ErrorCode.NOT_FOUND, "Workspace not found")
        );
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
      
      const params = validateParams(
        workspaceIdParamSchema,
        request.params,
        reply
      );
      if (!params) return;

      const body = validateBody(inviteBodySchema, request.body, reply);
      if (!body) return;

      const invitedUser = await prisma.user.findUnique({
        where: { email: body.email },
      });

      if(!invitedUser){
        return reply.status(404).send(
          errorResponse(
            ErrorCode.NOT_FOUND,
            "User with this email has not signed in yet"
          )
        );
      }

      const existing = await prisma.membership.findUnique({
        where:{
          userId_workspaceId: {
            userId: invitedUser.id,
            workspaceId: params.workspaceId,
          },
        },
      });

      if(existing){
        return reply.status(409).send( errorResponse(
          ErrorCode.CONFLICT,
          "User is already a member of this workspace"
        ));
      }

      const membership = await prisma.membership.create({
        data: {
          userId: invitedUser.id,
          workspaceId: params.workspaceId,
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