import { FastifyReply, FastifyRequest} from "fastify";
import {prisma} from "../lib/prisma.js";

export function loadWorkspaceMembership(
    workspaceIdParaName = "workspaceId"
){
    return async function(
        request: FastifyRequest,
        reply: FastifyReply
    ){
        if(!request.user){
            return reply.status(401).send({
                error: "unauthorized",
                message: "Authentication required"
            });
        }

        const workspaceId = (request.params as Record<string, string>)[workspaceIdParaName];

        if (!workspaceId) {

            return reply.status(400).send({
                error: "bad request",
                message: `Missing route param: ${workspaceIdParaName}`
            });
        }

        const membership = await prisma.membership.findUnique({
            where: {
                userId_workspaceId:{
                    userId: request.user.id,
                    workspaceId
                }
            }
        });


        if(!membership){
            return reply.status(403).send({
                error: "forbidden",
                message: "you are not a member of this workspace",
            });
        }

        request.membership = {
            role: membership.role,
            workspaceId: membership.workspaceId
        };
    };
}