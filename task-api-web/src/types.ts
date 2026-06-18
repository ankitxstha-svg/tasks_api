export type Workspace = {
    id: string;
    name: string;
}

export type Membership = {
    role: "owner" | "member";
    workspace: Workspace;
}

export type MeResponse = {
    id: string;
    email: string;
    isAdmin: boolean;
    memberships: Membership[];
};