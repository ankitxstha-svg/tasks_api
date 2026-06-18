const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export function getToken(): string | null{
    return localStorage.getItem("access_token");
}

export function setToken(token: string){
    localStorage.setItem("access_token", token);
}

export function clearToken(){
    localStorage.removeItem("access_token");
}

export async function apiFetch(path: string, options: RequestInit = {}){
    const token = getToken();
    const headers: Record<string, string> = {
        ...(options.headers as Record<string, string>),
    };

    if(options.body !== undefined){
        headers["Content-Type"] = "application/json";
    }

    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API_URL}${path}`, {...options, headers});
    if(res.status === 204){
        if(!res.ok) throw {
            status: res.status, data:{}

        };
        return null;
    }
    const text = await res.text();
    const data = text ? JSON.parse(text) : {};
    if (!res.ok) throw {status: res.status, data};
    return data;
}

export async function signup(email: string, password: string){
    return apiFetch("/auth/signup", {
        method: "POST",
        body: JSON.stringify({email, password}),
    });
}

export async function login(email: string, password: string) {
  const data = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setToken(data.access_token);
  return data;
}

export async function getMe(){
    return apiFetch("/me");
}

export async function createWorkspace(name: string){
    return apiFetch("/workspaces", {
        method: "POST",
        body: JSON.stringify({name}),
    });
}

export async function inviteToWorkspace(workspaceId: string, email:string){
    return apiFetch(`/workspaces/${workspaceId}/invite`,{
        method: "POST",
        body: JSON.stringify({email}),
    });
}

export type Task ={
    id: string;
    title: string;
    createdById: string;
    createdAt: string;
};

export async function listTasks(workspaceId: string): Promise<Task[]>{
    return apiFetch(`/workspaces/${workspaceId}/tasks`);
}

export async function createTask(workspaceId: string, title: string){
    return apiFetch(`/workspaces/${workspaceId}/tasks`, {
        method: "POST",
        body: JSON.stringify({title}),
    });
}

export async function updateTask(workspaceId: string, taskId: string, title: string){
    return apiFetch(`/workspaces/${workspaceId}/tasks/${taskId}`,{
        method: "PATCH",
        body: JSON.stringify({title}),
    });
}

export async function deleteTask(workspaceId: string, taskId: string){
    return apiFetch(`/workspaces/${workspaceId}/tasks/${taskId}`,
       {method: "DELETE",}
    );
}