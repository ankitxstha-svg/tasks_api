import {z} from "zod";

export const createWorkspaceBodySchema = z.object({
    name: z
    .string({message: "name is required"})
    .trim()
    .min(1, "name is required")
    .max(100, "name must be at most 100 characters"),
});

export const inviteBodySchema = z.object({
    email: z
    .string({message: "email is required"})
    .trim()
    .toLowerCase()
    .min(1, "email is required")
    .email("email must be a valid email address"),
});

export const createTaskBodySchema = z.object({
    title: z
    .string({ message: "title is required"})
    .trim()
    .min(1, "title is required")
    .max(500, "title must be at most 500 characters"),
});

export const workspaceIdParamSchema = z.object({
    workspaceId: z.uuid("workspace must be valid uuid"),
});

export const taskIdParamSchema = z.object({
    taskId: z.uuid("taskId must be a valid UUID"),
})