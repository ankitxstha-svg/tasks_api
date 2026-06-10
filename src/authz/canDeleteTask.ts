type Role = "owner" | "member";

export function canDeleteTask(
    userId: string,
    membershipRole: Role,
    taskCreatedById: string
): boolean {

    if(membershipRole === "owner") return true;
    if(userId === taskCreatedById) return true;
    return false;
}