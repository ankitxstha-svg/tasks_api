import type { MeResponse} from "../types";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  clearToken,
  createWorkspace,
  createTask,
  deleteTask,
  getMe,
  getToken,
  inviteToWorkspace,
  listTasks,
  updateTask,
  type Task,
} from "../api/client";


export function DashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<MeResponse | null>(null);
  const [error, setError] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [creating, setCreating] = useState(false);

  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [creatingTask, setCreatingTask] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [success, setSuccess] = useState("");


  function showSuccess(message: string){
    setSuccess(message);
    setTimeout(()=> setSuccess(""), 3000);
  }
  async function loadUser() {
    const data = await getMe();
    setUser(data);
  };

  async function loadTasks(workspaceId: string) {
  setTasksLoading(true);
  setError("");
  try {
    const data = await listTasks(workspaceId);
    setTasks(data);
  } catch (err: any) {
    setError(err?.data?.message ?? "Failed to load tasks");
    setTasks([]);
  } finally {
    setTasksLoading(false);
  }
  }

  function selectWorkspace(workspaceId: string) {
    setSelectedWorkspaceId(workspaceId);
    setNewTaskTitle("");
    setEditingTaskId(null);
    setInviteEmail("");
    setError("");
    loadTasks(workspaceId);
  }

  async function handleCreateTask(e: React.FormEvent) {
  e.preventDefault();
  if (!selectedWorkspaceId) return;

  setError("");
  setCreatingTask(true);
  try {
    await createTask(selectedWorkspaceId, newTaskTitle.trim());
    setNewTaskTitle("");
    await loadTasks(selectedWorkspaceId);
    showSuccess("Task added");
  } catch (err: any) {
    setError(err?.data?.message ?? "Failed to create task");
  } finally {
    setCreatingTask(false);
  }
}

function startEdit(task: Task) {
  setEditingTaskId(task.id);
  setEditTitle(task.title);
}

async function handleUpdateTask(taskId: string) {
  if (!selectedWorkspaceId) return;

  setError("");
  try {
    await updateTask(selectedWorkspaceId, taskId, editTitle.trim());
    setEditingTaskId(null);
    setEditTitle("");
    await loadTasks(selectedWorkspaceId);
    showSuccess("Task updated");
  } catch (err: any) {
    setError(err?.data?.message ?? "Failed to update task");
  }
}

async function handleDeleteTask(taskId: string) {
  if (!selectedWorkspaceId) return;
  if(!window.confirm("Delete this task?")) return;

  setError("");
  try {
    await deleteTask(selectedWorkspaceId, taskId);
    await loadTasks(selectedWorkspaceId);
    showSuccess("Task deleted");
  } catch (err: any) {
    setError(err?.data?.message ?? "Failed to delete task");
  }
}

function canDeleteTaskUI(task: Task, membershipRole: "owner" | "member") {
  return membershipRole === "owner" || task.createdById === user!.id;
}



  useEffect(() => {
    if (!getToken()) {
      navigate("/login");
      return;
    }
    loadUser().catch(() => {
      clearToken();
      navigate("/login");
    });
  }, [navigate]);

  useEffect(()=>{
    if(!user) return;
    if(user.memberships.length === 0) return;
    if(selectedWorkspaceId) return;

    const firstId = user.memberships[0].workspace.id;
    setSelectedWorkspaceId(firstId);
    loadTasks(firstId);
  }, [user, selectedWorkspaceId]);

  async function handleCreateWorkspace(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCreating(true);
    try {
      await createWorkspace(workspaceName.trim());
      setWorkspaceName("");
      await loadUser();
      showSuccess("workspace created");
    } catch (err: any) {
      setError(err?.data?.message ?? "Failed to create workspace");
    } finally {
      setCreating(false);
    }
  }



  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if(!selectedWorkspaceId) return;

    const email = inviteEmail.trim();
    if (!email) return;

    setError("");
    setInviting(true);
    try {
      await inviteToWorkspace(selectedWorkspaceId, email);
      setInviteEmail("");
      showSuccess("Member invited Succesfully");
    } catch (err: any) {
      setError(err?.data?.message ?? "Invite failed");
    } finally {
      setInviting(false);
    }
  }

  if (!user) return <p>Loading...</p>;

  const selectedMembership = user.memberships.find(
    (m) => m.workspace.id === selectedWorkspaceId
  );

    return (
    <div className="app-shell">
      {/* TOP BAR */}
      <header className="topbar">
        <div className="topbar__brand">Tasks API</div>
        <div className="topbar__user">
          <span>{user.email}</span>
          <button
            type="button"
            className="btn btn--small"
            onClick={() => {
              clearToken();
              navigate("/login");
            }}
          >
            Log out
          </button>
        </div>
      </header>

      <div className="dashboard-body">
        {/* SIDEBAR — workspace list + create */}
        <aside className="sidebar">
          <p className="sidebar__title">Workspaces</p>

          <form onSubmit={handleCreateWorkspace}>
            <input
              className="input"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              placeholder="New workspace name"
              required
              maxLength={100}
            />
            <button
              type="submit"
              className="btn btn--primary btn--full"
              style={{ marginTop: "0.5rem" }}
              disabled={creating}
            >
              {creating ? "Creating..." : "+ New workspace"}
            </button>
          </form>

          {user.memberships.length === 0 ? (
            <p className="empty-state" style={{ padding: "1rem" }}>
              Create your first workspace above.
            </p>
          ) : (
            <ul className="workspace-list">
              {user.memberships.map((m) => (
                <li key={m.workspace.id}>
                  <button
                    type="button"
                    className={
                      "workspace-item" +
                      (selectedWorkspaceId === m.workspace.id
                        ? " workspace-item--active"
                        : "")
                    }
                    onClick={() => selectWorkspace(m.workspace.id)}
                  >
                    <span className="workspace-item__name">
                      {m.workspace.name}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* MAIN PANEL — tasks + invite for selected workspace */}
        <main className="main-panel">
          {error && <div className="alert alert--error">{error}</div>}
          {success && <div className="alert alert--success">{success}</div>}

          {!selectedMembership ? (
            <div className="empty-state">
              {user.memberships.length === 0
                ? "Create a workspace to get started."
                : "Select a workspace from the sidebar."}
            </div>
          ) : (
            <>
              <div className="main-panel__header">
                <h2 className="main-panel__title">
                  {selectedMembership.workspace.name}
                </h2>
                <span className={`badge badge--${selectedMembership.role}`}>
                  {selectedMembership.role}
                </span>
              </div>

              {/* Add task */}
              <form className="task-form" onSubmit={handleCreateTask}>
                <input
                  className="input"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Add a task..."
                  required
                  maxLength={500}
                />
                <button
                  type="submit"
                  className="btn btn--primary"
                  disabled={creatingTask}
                >
                  {creatingTask ? "Adding..." : "Add"}
                </button>
              </form>

              {/* Task list */}
              {tasksLoading ? (
                <p>Loading tasks...</p>
              ) : tasks.length === 0 ? (
                <div className="empty-state">No tasks yet. Add one above.</div>
              ) : (
                <ul className="task-list">
                  {tasks.map((task) => (
                    <li key={task.id} className="task-row">
                      {editingTaskId === task.id ? (
                        <>
                          <input
                            className="input"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                          />
                          <div className="task-row__actions">
                            <button
                              type="button"
                              className="btn btn--primary btn--small"
                              onClick={() => handleUpdateTask(task.id)}
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              className="btn btn--small"
                              onClick={() => setEditingTaskId(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <span className="task-row__title">{task.title}</span>
                          <div className="task-row__actions">
                            <button
                              type="button"
                              className="btn btn--small"
                              onClick={() => startEdit(task)}
                            >
                              Edit
                            </button>
                            {canDeleteTaskUI(task, selectedMembership.role) && (
                              <button
                                type="button"
                                className="btn btn--small btn--danger"
                                onClick={() => handleDeleteTask(task.id)}
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {/* Invite — owners only */}
              {selectedMembership.role === "owner" && (
                <div className="section">
                  <h3>Invite member</h3>
                  <form className="invite-form" onSubmit={handleInvite}>
                    <input
                      className="input"
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="colleague@email.com"
                      required
                    />
                    <button
                      type="submit"
                      className="btn btn--primary"
                      disabled={inviting}
                    >
                      {inviting ? "Inviting..." : "Invite"}
                    </button>
                  </form>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}