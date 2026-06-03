import { PrismaClient } from "@prisma/client";
import "dotenv/config";
import {PrismaPg} from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;

if(!connectionString){
    throw new Error("DATABSE_URL is not set in .env");
}

const adapter = new PrismaPg({ connectionString});

export const prisma = new PrismaClient({adapter});