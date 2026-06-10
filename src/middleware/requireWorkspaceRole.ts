import {FastifyReply, FastifyRequest} from "fastify";

type Role = "owner" | "member";

const roleRank : Record<Role, number> = {
    member: 1,
    owner: 2
};

export function requireWorkspaceRole(minRole: Role){
    return async function(
        request: FastifyRequest,
        reply: FastifyReply
    ){
        if(!request.membership){
            return reply.status(403).send({
                error: "forbidden",
                message: "workspace mwembership required"
            });
        }
        const currentRank = roleRank[request.membership.role];
        const requiredRank = roleRank[minRole];

        if(currentRank < requiredRank){
            return reply.status(403).send({
                error: "forbidden",
                message: `Requires role ${minRole}`
            });
        }
    };
}