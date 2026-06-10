import { FastifyReply, FastifyRequest} from "fastify";

export async function requireAuth(
    request: FastifyRequest,
    reply: FastifyReply
){
    if(!request.user){
        return reply.status(401).send({
            error: "unathorized",
            message: "Authentication required"
        });
    }

}