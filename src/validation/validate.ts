import { FastifyReply } from "fastify";
import {z} from "zod";
import {ErrorCode, errorResponse} from "../lib/error.js";

export function validateBody<T>(
    schema: z.ZodType<T>,
    body: unknown,
    reply: FastifyReply
): T | null {
    const result = schema.safeParse(body);

    if(!result.success){
        const firstIssue = result.error.issues[0];
        const message = firstIssue?.message ?? "Invalid request body";

        reply.status(400).send(errorResponse(ErrorCode.BAD_REQUEST, message));
        return null;
    }

    return result.data;
}

export function validateParams<T>(
    schema: z.ZodType<T>,
    params: unknown,
    reply: FastifyReply
): T | null {
    const result = schema.safeParse(params);

    if(!result.success){
        const firstIssue= result.error.issues[0];
        const message = firstIssue?.message ?? "Invalid route parameters";

        reply.status(400).send(errorResponse(ErrorCode.BAD_REQUEST, message));
        return null;
    
    }

    return result.data;
}
