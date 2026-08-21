import type { Project, Task } from "./project-store";

export async function apiFetch<T>(
  path: string,
  token: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (data as { error?: string }).error ?? `Request failed (${res.status})`
    );
  }
  return data as T;
}

export function fetchProjects(token: string) {
  return apiFetch<{ projects: Project[] }>("/api/projects", token);
}

export function createProjectApi(
  token: string,
  body: { name: string; description?: string }
) {
  return apiFetch<{ project: Project }>("/api/projects", token, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function fetchProject(token: string, id: string) {
  return apiFetch<{ project: Project }>(`/api/projects/${id}`, token);
}

export function addTaskApi(token: string, projectId: string, title: string) {
  return apiFetch<{ task: Task; project: Project }>(
    `/api/projects/${projectId}/tasks`,
    token,
    { method: "POST", body: JSON.stringify({ title }) }
  );
}

export function toggleTaskApi(
  token: string,
  projectId: string,
  taskId: string,
  done: boolean
) {
  return apiFetch<{ project: Project }>(
    `/api/projects/${projectId}/tasks/${taskId}`,
    token,
    { method: "PATCH", body: JSON.stringify({ done }) }
  );
}

export function deleteProjectApi(token: string, projectId: string) {
  return apiFetch<{ success: boolean }>(`/api/projects/${projectId}`, token, {
    method: "DELETE",
  });
}
