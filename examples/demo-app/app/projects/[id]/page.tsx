"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ProtectedRoute, useAuth } from "@ssso/react";
import type { Project } from "@/lib/project-store";
import { addTaskApi, fetchProject, toggleTaskApi } from "@/lib/api";
import { SignedOutPanel } from "@/components/SignedOutPanel";

export default function ProjectDetailPage() {
  return (
    <ProtectedRoute
      fallback={<p className="text-[var(--muted)]">Loading session…</p>}
      unauthenticated={<SignedOutPanel />}
    >
      <ProjectDetail />
    </ProtectedRoute>
  );
}

function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!token || !id) return;
    setError(null);
    try {
      const data = await fetchProject(token, id);
      setProject(data.project);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    }
  }, [token, id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !id || !taskTitle.trim()) return;
    setBusy(true);
    try {
      const data = await addTaskApi(token, id, taskTitle);
      setProject(data.project);
      setTaskTitle("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add task");
    } finally {
      setBusy(false);
    }
  }

  async function toggle(taskId: string, done: boolean) {
    if (!token || !id) return;
    try {
      const data = await toggleTaskApi(token, id, taskId, done);
      setProject(data.project);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    }
  }

  if (!project && !error) {
    return <p className="text-[var(--muted)]">Loading project…</p>;
  }

  if (!project) {
    return (
      <div>
        <p className="text-red-400">{error ?? "Not found"}</p>
        <Link href="/projects" className="mt-4 inline-block text-sm text-[var(--accent)]">
          ← Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/projects"
          className="text-sm text-[var(--muted)] hover:text-[var(--fg)]"
        >
          ← Projects
        </Link>
        <h1 className="mt-2 text-2xl font-bold">{project.name}</h1>
        {project.description && (
          <p className="mt-1 text-[var(--muted)]">{project.description}</p>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      <form onSubmit={addTask} className="flex gap-2">
        <input
          value={taskTitle}
          onChange={(e) => setTaskTitle(e.target.value)}
          placeholder="Add a task"
          className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
        >
          Add
        </button>
      </form>

      <ul className="space-y-2">
        {project.tasks.map((t) => (
          <li
            key={t.id}
            className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3"
          >
            <input
              type="checkbox"
              checked={t.done}
              onChange={(e) => void toggle(t.id, e.target.checked)}
              className="h-4 w-4 rounded border-[var(--border)]"
            />
            <span
              className={
                t.done
                  ? "flex-1 text-sm text-[var(--muted)] line-through"
                  : "flex-1 text-sm"
              }
            >
              {t.title}
            </span>
          </li>
        ))}
      </ul>

      {project.tasks.length === 0 && (
        <p className="text-sm text-[var(--muted)]">No tasks yet.</p>
      )}
    </div>
  );
}
