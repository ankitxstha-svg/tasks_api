import { FastifyInstance } from "fastify";
import { authMiddleware } from "../middleware/auth.js";
import { userMiddleware } from "../middleware/user.js";
import { prisma } from "../lib/prisma.js";

export async function meRoutes(app: FastifyInstance) {
  app.get(
    "/me",
    { preHandler: [authMiddleware, userMiddleware] },
    async (request, reply) => {
      const user = await prisma.user.findUnique({
        where: { id: request.user!.id },
        include: {
          memberships: {
            include: {
              workspace: {
                select: { id: true, name: true },
              },
            },
          },
        },
      });

      if (!user) {
        return reply.status(404).send({
          error: "NOT_FOUND",
          message: "User not found",
        });
      }

      return {
        id: user.id,
        email: user.email,
        isAdmin: user.isAdmin,
        memberships: user.memberships.map((m) => ({
          role: m.role,
          workspace: m.workspace,
        })),
      };
    }
  );
}