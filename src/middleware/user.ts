import {FastifyReply, FastifyRequest} from "fastify";
import {prisma} from "../lib/prisma.js";

export async function userMiddleware(
    request: FastifyRequest,
    reply: FastifyReply
){
    if(!request.auth?.sub){
        return reply.status(401).send({
            error:"unauthorized",
            message: "not authorized"
        });
    }

    const {sub, email} = request.auth;

    let user = await prisma.user.findUnique({
        where: {externalAuthId: sub}
    });

    if(!user){
        user = await prisma.user.create({
            data: {
                externalAuthId :sub,
                email: email ?? `${sub.replace("|", "-")}@auth0.local`,
            },
        });
    }

    request.user = {
        id: user.id,
        email: user.email,
        isAdmin: user.isAdmin
    };
};