import { FastifyInstance } from "fastify";

import { authenticate } from "../middleware/authenticate.js";
import { prisma } from "../lib/prisma.js";
import { loadWorkspaceMembership } from "../middleware/loadWorkspaceMembership.js";
import { requireWorkspaceRole } from "../middleware/requireWorkspaceRole.js";

import { validateBody, validateParams } from "../validation/validate.js";
import {
  createTaskBodySchema,
  workspaceIdParamSchema,
  taskIdParamSchema,
} from "../validation/schemas.js";

import { ErrorCode, errorResponse } from "../lib/error.js";
import { canDeleteTask } from "../authz/canDeleteTask.js";

export async function taskRoutes(app: FastifyInstance){
    app.post("/workspaces/:workspaceId/tasks",
        {
            preHandler: [...authenticate, loadWorkspaceMembership(), requireWorkspaceRole("member")],
        },
        async (request, reply)=>{
            const workspaceParams = validateParams(
                workspaceIdParamSchema,
                request.params,
                reply
            );

            if(!workspaceParams) return;

            const body = validateBody(
                createTaskBodySchema,
                request.body,
                reply
            );

            if(!body) return;

            const task = await prisma.task.create({
                data: {
                    workspaceId: workspaceParams.workspaceId,
                    createdById: request.user!.id,
                    title: body.title,
                },
            });

            return reply.status(201).send(task);
        }
    )


    app.get(
        "/workspaces/:workspaceId/tasks",
        {
            preHandler: [...authenticate, loadWorkspaceMembership(), requireWorkspaceRole("member")],
        },

        async (request, reply) => {
            const workspaceParams = validateParams(
                workspaceIdParamSchema,
                request.params,
                reply
            );
            if(!workspaceParams) return;

            const tasks = await prisma.task.findMany({
                where: { workspaceId: workspaceParams.workspaceId},
                select: {
                    id: true,
                    title: true,
                    createdById: true,
                    createdAt: true,
                },
                orderBy: {
                    createdAt: "desc"
                },
            });

            return tasks;
        }
    )

    app.patch(
        "/workspaces/:workspaceId/tasks/:taskId",
        {
            preHandler: [...authenticate, loadWorkspaceMembership(), requireWorkspaceRole("member")],
        },

        async (request, reply) =>{
            const workspaceParams = validateParams(
                workspaceIdParamSchema,
                request.params,
                reply
            );

            if(!workspaceParams) return;

            const taskParams = validateParams(
                taskIdParamSchema,
                request.params,
                reply
            );

            if(!taskParams) return;

            const body = validateBody(
                createTaskBodySchema,
                request.body,
                reply
            );
            if(!body) return;

            const existing = await prisma.task.findFirst({
                where: {
                    id: taskParams.taskId,
                    workspaceId: workspaceParams.workspaceId,
                },
            });

            if(!existing){
                return reply.status(404).send(
                    errorResponse(ErrorCode.NOT_FOUND, "Task not Found")
                );
            }

            const updated = await prisma.task.update({
                where: {id: existing.id},
                data: {title: body.title},
            });

            return updated;
        }
    )

    app.delete(
        "/workspaces/:workspaceId/tasks/:taskId",
        {
            preHandler: [...authenticate, loadWorkspaceMembership(), requireWorkspaceRole("member")],
        },

        async (request, reply) => {
            const workspaceParams = validateParams(
                workspaceIdParamSchema,
                request.params,
                reply
            );

            if(!workspaceParams) return;

            const taskParams = validateParams(
                taskIdParamSchema,
                request.params,
                reply
            );

            if(!taskParams) return;

            const existing = await prisma.task.findFirst({
                where: {
                    id: taskParams.taskId,
                    workspaceId: workspaceParams.workspaceId,
                },
                select: {
                    id: true,
                    createdById: true,
                },
            });

            if(!existing){
                return reply.status(404).send(
                    errorResponse(ErrorCode.NOT_FOUND, "Task not found")
                );
            }

            const userId = request.user!.id;
            const membershipRole = request.membership!.role;
            const allowed = canDeleteTask(userId, membershipRole, existing.createdById);

            if(!allowed) {
                return reply.status(403).send(
                    errorResponse(ErrorCode.FORBIDDEN, "you cannot delete this task")
                );
            }

            await prisma.task.delete({
                where: {id: existing.id},
            });

            return reply.status(204).send();
        }
    );
}