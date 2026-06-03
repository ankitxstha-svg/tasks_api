import "fastify";

declare module "fastify" {
    interface FastifyRequest {
        auth?:{
            sub: string;
            email?: string;
        };
        user?:{
            id: string;
            email: string;
            isAdmin: boolean;
        };
    }
}