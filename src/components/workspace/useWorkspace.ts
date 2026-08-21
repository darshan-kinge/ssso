"use client";

import { useCallback, useEffect, useState } from "react";
import { authFetch } from "@/lib/auth/api-client";
import { setStoredAccessToken } from "@/lib/auth/client";

export interface WorkspaceSummary {
  id: string;
  slug: string;
  name: string;
  plan: string;
  role: string;
  settings?: {
    logoUrl?: string | null;
    primaryColor?: string | null;
    themeType?: string | null;
    backgroundImageUrl?: string | null;
    backgroundColor?: string | null;
    customCardBg?: string | null;
    customCardBorder?: string | null;
    customCardText?: string | null;
    customButtonBg?: string | null;
    customButtonText?: string | null;
    loginMode?: "open" | "sso-only" | null;
  } | null;
}

/** Custom event name – broadcast whenever the active workspace changes */
const WS_CHANGED_EVENT = "ssso:workspace-changed";

export function useWorkspace() {
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [active, setActive] = useState<WorkspaceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await authFetch("/api/workspaces");
    if (res.status === 401) {
      setError("Sign in required");
      setLoading(false);
      return;
    }
    if (!res.ok) {
      setError("Failed to load workspaces");
      setLoading(false);
      return;
    }
    const data = await res.json();
    const list = (data.workspaces ?? []) as WorkspaceSummary[];
    setWorkspaces(list);
    setError(null);

    const stored =
      typeof window !== "undefined"
        ? localStorage.getItem("ssso_active_workspace")
        : null;
    const current =
      list.find((w) => w.id === stored) ?? list[0] ?? null;
    setActive(current);
    if (current && typeof window !== "undefined") {
      localStorage.setItem("ssso_active_workspace", current.id);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Listen for workspace-changed events dispatched by any hook instance
  useEffect(() => {
    const handler = () => void load();
    window.addEventListener(WS_CHANGED_EVENT, handler);
    return () => window.removeEventListener(WS_CHANGED_EVENT, handler);
  }, [load]);

  async function activate(id: string) {
    const res = await authFetch(`/api/workspaces/${id}/activate`, {
      method: "POST",
    });
    if (!res.ok) return false;
    const data = await res.json();
    if (data.accessToken) {
      setStoredAccessToken(data.accessToken);
    }
    localStorage.setItem("ssso_active_workspace", id);
    // Broadcast to ALL hook instances (header + dashboard + any other component)
    window.dispatchEvent(new CustomEvent(WS_CHANGED_EVENT, { detail: { id } }));
    return true;
  }

  return {
    workspaces,
    active,
    loading,
    error,
    reload: load,
    activate,
    hasWorkspace: workspaces.length > 0,
  };
}
