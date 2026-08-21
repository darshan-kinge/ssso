"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authFetch } from "@/lib/auth/api-client";
import { type AppRecord } from "@/components/dashboard/AppCard";

async function fetchApps(): Promise<AppRecord[]> {
  const res = await authFetch("/api/apps");
  if (res.status === 401) {
    throw new Error("unauthorized");
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    if (data.code === "no_workspace") {
      throw new Error("no_workspace");
    }
    throw new Error(data.error ?? "Failed to load apps");
  }
  const data = await res.json();
  return data.apps ?? [];
}

export function useAppsQuery() {
  return useQuery<AppRecord[], Error>({
    queryKey: ["apps"],
    queryFn: fetchApps,
  });
}

export function useCreateAppMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newApp: {
      name: string;
      redirectUrls: string[];
      clientType: "public" | "confidential";
    }) => {
      const res = await authFetch("/api/apps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newApp),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to create app");
      }
      return {
        app: data.app as AppRecord,
        clientSecret: data.clientSecret as string,
      };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["apps"] });
    },
  });
}

export function useUpdateAppMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      redirectUrls,
      clientType,
    }: {
      id: string;
      redirectUrls: string[];
      clientType: "public" | "confidential";
    }) => {
      const res = await authFetch(`/api/apps/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ redirectUrls, clientType }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to update redirects");
      }
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["apps"] });
    },
  });
}

export function useRotateSecretMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await authFetch(`/api/apps/${id}/rotate-secret`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Rotation failed");
      }
      return data.clientSecret as string;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["apps"] });
    },
  });
}

export function useDeleteAppMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await authFetch(`/api/apps/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Delete failed");
      }
      return true;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["apps"] });
    },
  });
}
