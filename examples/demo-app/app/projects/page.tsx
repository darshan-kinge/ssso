"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ProtectedRoute, useAuth } from "@ssso/react";
import type { Project } from "@/lib/project-store";
import {
  createProjectApi,
  deleteProjectApi,
  fetchProjects,
} from "@/lib/api";
import { SignedOutPanel } from "@/components/SignedOutPanel";

export default function ProjectsPage() {
  return (
    <ProtectedRoute
      fallback={<p className="text-[var(--muted)]">Loading session…</p>}
      unauthenticated={<SignedOutPanel />}
    >
      <ProjectsView />
    </ProtectedRoute>
  );
}

function ProjectsView() {
  const { token } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProjects(token);
      setProjects(data.projects);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !name.trim()) return;
    setCreating(true);
    try {
      await createProjectApi(token, { name });
      setName("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create failed");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!token || !confirm("Delete this project?")) return;
    try {
      await deleteProjectApi(token, id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  }

  const openTasks = projects.reduce(
    (n, p) => n + p.tasks.filter((t) => !t.done).length,
    0
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {loading
              ? "Loading…"
              : `${projects.length} projects · ${openTasks} open tasks`}
          </p>
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <form
        onSubmit={handleCreate}
        className="flex flex-wrap gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4"
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New project name"
          className="min-w-[200px] flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
          required
        />
        <button
          type="submit"
          disabled={creating}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
        >
          {creating ? "Creating…" : "Add project"}
        </button>
      </form>

      <ul className="grid gap-4 sm:grid-cols-2">
        {projects.map((p) => {
          const done = p.tasks.filter((t) => t.done).length;
          return (
            <li
              key={p.id}
              className="group rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 transition hover:border-zinc-600"
            >
              <div className="flex items-start justify-between gap-2">
                <Link href={`/projects/${p.id}`} className="flex-1">
                  <h2 className="font-semibold group-hover:text-[var(--accent)]">
                    {p.name}
                  </h2>
                  {p.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-[var(--muted)]">
                      {p.description}
                    </p>
                  )}
                </Link>
                <button
                  type="button"
                  onClick={() => void handleDelete(p.id)}
                  className="text-xs text-[var(--muted)] opacity-0 hover:text-red-400 group-hover:opacity-100"
                  aria-label="Delete project"
                >
                  Delete
                </button>
              </div>
              <p className="mt-4 text-xs text-[var(--muted)]">
                {done}/{p.tasks.length} tasks done
              </p>
            </li>
          );
        })}
      </ul>

      {!loading && projects.length === 0 && (
        <p className="text-center text-sm text-[var(--muted)]">
          No projects yet — create one above.
        </p>
      )}
    </div>
  );
}
