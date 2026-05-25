import {
  clearStoredAccessToken,
  getStoredAccessToken,
  setStoredAccessToken,
} from "./client";

/** Authenticated fetch with access-token refresh retry. */
export async function authFetch(
  input: RequestInfo,
  init: RequestInit = {}
): Promise<Response> {
  const token = getStoredAccessToken();
  if (!token) {
    return new Response(JSON.stringify({ error: "Not signed in" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);

  let res = await fetch(input, {
    ...init,
    headers,
    credentials: init.credentials ?? "include",
  });

  if (res.status !== 401) return res;

  const refreshRes = await fetch("/api/auth/refresh", {
    method: "POST",
    credentials: "include",
  });

  if (!refreshRes.ok) {
    clearStoredAccessToken();
    return res;
  }

  const data = await refreshRes.json();
  if (data.accessToken) {
    setStoredAccessToken(data.accessToken);
    headers.set("Authorization", `Bearer ${data.accessToken}`);
    res = await fetch(input, { ...init, headers, credentials: "include" });
  }

  return res;
}
