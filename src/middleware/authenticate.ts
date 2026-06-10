import { authMiddleware } from "./auth.js";
import { userMiddleware } from "./user.js";
import { requireAuth } from "./requireAuth.js";

export const authenticate = [
    authMiddleware,
    userMiddleware,
    requireAuth
];