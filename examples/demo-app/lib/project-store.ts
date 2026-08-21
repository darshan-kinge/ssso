export interface Task {
  id: string;
  title: string;
  done: boolean;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  tasks: Task[];
  createdAt: string;
  updatedAt: string;
}

interface Store {
  projects: Map<string, Project[]>;
}

declare global {
  var pulseStore: Store | undefined;
}

function store(): Store {
  if (!global.pulseStore) {
    global.pulseStore = { projects: new Map() };
  }
  return global.pulseStore;
}

function newId(): string {
  return crypto.randomUUID();
}

function seedProjects(_userId: string): Project[] {
  const now = new Date().toISOString();
  return [
    {
      id: newId(),
      name: "Website relaunch",
      description: "Marketing site and docs refresh",
      createdAt: now,
      updatedAt: now,
      tasks: [
        {
          id: newId(),
          title: "Review SSO login flow",
          done: true,
          createdAt: now,
        },
        {
          id: newId(),
          title: "Ship protected API routes",
          done: false,
          createdAt: now,
        },
      ],
    },
    {
      id: newId(),
      name: "Mobile beta",
      description: "Quest build with OneAuth PKCE",
      createdAt: now,
      updatedAt: now,
      tasks: [
        {
          id: newId(),
          title: "Deep link callback URL",
          done: false,
          createdAt: now,
        },
      ],
    },
  ];
}

export function listProjects(userId: string): Project[] {
  const s = store();
  if (!s.projects.has(userId)) {
    s.projects.set(userId, seedProjects(userId));
  }
  return [...(s.projects.get(userId) ?? [])].sort(
    (a, b) => b.updatedAt.localeCompare(a.updatedAt)
  );
}

export function getProject(
  userId: string,
  projectId: string
): Project | undefined {
  return listProjects(userId).find((p) => p.id === projectId);
}

export function createProject(
  userId: string,
  input: { name: string; description?: string }
): Project {
  const s = store();
  const list = listProjects(userId);
  const now = new Date().toISOString();
  const project: Project = {
    id: newId(),
    name: input.name.trim(),
    description: input.description?.trim() ?? "",
    tasks: [],
    createdAt: now,
    updatedAt: now,
  };
  list.unshift(project);
  s.projects.set(userId, list);
  return project;
}

export function updateProject(
  userId: string,
  projectId: string,
  patch: { name?: string; description?: string }
): Project | undefined {
  const s = store();
  const list = listProjects(userId);
  const idx = list.findIndex((p) => p.id === projectId);
  if (idx < 0) return undefined;

  const now = new Date().toISOString();
  const p = { ...list[idx], updatedAt: now };
  if (patch.name !== undefined) p.name = patch.name.trim();
  if (patch.description !== undefined) p.description = patch.description.trim();
  list[idx] = p;
  s.projects.set(userId, list);
  return p;
}

export function deleteProject(userId: string, projectId: string): boolean {
  const s = store();
  const list = listProjects(userId).filter((p) => p.id !== projectId);
  const had = list.length < (s.projects.get(userId)?.length ?? 0);
  s.projects.set(userId, list);
  return had;
}

export function addTask(
  userId: string,
  projectId: string,
  title: string
): Task | undefined {
  const s = store();
  const list = listProjects(userId);
  const idx = list.findIndex((p) => p.id === projectId);
  if (idx < 0) return undefined;

  const now = new Date().toISOString();
  const task: Task = { id: newId(), title: title.trim(), done: false, createdAt: now };
  const p = {
    ...list[idx],
    tasks: [...list[idx].tasks, task],
    updatedAt: now,
  };
  list[idx] = p;
  s.projects.set(userId, list);
  return task;
}

export function toggleTask(
  userId: string,
  projectId: string,
  taskId: string,
  done: boolean
): Project | undefined {
  const s = store();
  const list = listProjects(userId);
  const idx = list.findIndex((p) => p.id === projectId);
  if (idx < 0) return undefined;

  const now = new Date().toISOString();
  const p = {
    ...list[idx],
    tasks: list[idx].tasks.map((t) =>
      t.id === taskId ? { ...t, done } : t
    ),
    updatedAt: now,
  };
  list[idx] = p;
  s.projects.set(userId, list);
  return p;
}

export function deleteTask(
  userId: string,
  projectId: string,
  taskId: string
): Project | undefined {
  const s = store();
  const list = listProjects(userId);
  const idx = list.findIndex((p) => p.id === projectId);
  if (idx < 0) return undefined;

  const now = new Date().toISOString();
  const p = {
    ...list[idx],
    tasks: list[idx].tasks.filter((t) => t.id !== taskId),
    updatedAt: now,
  };
  list[idx] = p;
  s.projects.set(userId, list);
  return p;
}
