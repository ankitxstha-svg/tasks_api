import {FastifyReply, FastifyRequest} from "fastify";
import {createRemoteJWKSet, jwtVerify} from "jose";

const domain = process.env.AUTH0_DOMAIN;
const issuer = process.env.AUTH0_ISSUER;
const audience = process.env.AUTH0_AUDIENCE;

const JWKS = createRemoteJWKSet(
    new URL(`https://${domain}/.well-known/jwks.json`)
);

export async function authMiddleware(
    request: FastifyRequest,
    reply: FastifyReply
){
    const header = request.headers.authorization;

    if(!header?.startsWith("Bearer ")){
        return reply.status(401).send({
            error: "unauthorized",
            message: "Missing or invalid authorization header",
        });
    };

    const token = header.slice("Bearer ".length);

        // TEST ONLY — skip Auth0 in automated tests
    if (process.env.NODE_ENV === "test") {
    request.auth = {
        sub: token,
        email: `${token.replace("|", "-")}@test.local`,
    };
    return;
    }

    try {
        const {payload} = await jwtVerify(token, JWKS, {issuer, audience,});

        if(!payload.sub){
            return reply.status(401).send({
                error: "unauthorized",
                message: "token missing sub",
            });
        }

        request.auth={
            sub: payload.sub,
            email: typeof payload.email === "string" ? payload.email : undefined,
        };
    } catch {

        return reply.status(401).send({
            error: "unauthorized",
            message: "invalid or expire token",
        });
        
    }

};