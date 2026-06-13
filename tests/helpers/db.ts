import {prisma} from "../../src/lib/prisma.js";

export async function resetDb(){
    await prisma.membership.deleteMany();
    await prisma.task.deleteMany();
    await prisma.workspace.deleteMany();
    await prisma.user.deleteMany();
}

export async function seedUsers(){
    const owner = await prisma.user.create({
        data: {
            externalAuthId: "auth0|test-owner",
            email: "owner@test.local",
        },
    });

    const member = await prisma.user.create({
        data: {
            externalAuthId: "auth0|test-member",
            email: "member@test.local",
        },
    });

    const outsider = await prisma.user.create({
        data: {
            externalAuthId: "auth0|test-outsider",
            email: "outsider@test.local",
        },
    });

    return {owner, member, outsider};
}


export function authHeader(externalAuthId: string){
    return {authorization: `Bearer ${externalAuthId}`};
}