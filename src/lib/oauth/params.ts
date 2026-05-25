import { assertValidCodeChallenge } from "./pkce";

export interface AuthorizeParams {
  client_id: string;
  redirect_uri: string;
  response_type: string;
  state?: string;
  code_challenge?: string;
  code_challenge_method?: string;
}

export function buildAuthorizeQuery(params: AuthorizeParams): string {
  const q = new URLSearchParams({
    client_id: params.client_id,
    redirect_uri: params.redirect_uri,
    response_type: params.response_type,
  });
  if (params.state) q.set("state", params.state);
  if (params.code_challenge) {
    q.set("code_challenge", params.code_challenge);
    q.set("code_challenge_method", params.code_challenge_method ?? "S256");
  }
  return q.toString();
}

export function parseAuthorizeParams(
  searchParams: URLSearchParams
): AuthorizeParams {
  const client_id = searchParams.get("client_id")?.trim();
  const redirect_uri = searchParams.get("redirect_uri")?.trim();
  const response_type = searchParams.get("response_type")?.trim() ?? "";
  const state = searchParams.get("state")?.trim() || undefined;
  const code_challenge = searchParams.get("code_challenge")?.trim() || undefined;
  const code_challenge_method =
    searchParams.get("code_challenge_method")?.trim() || undefined;

  if (!client_id || !redirect_uri) {
    throw new Error("missing_params");
  }

  if (response_type !== "code") {
    throw new Error("unsupported_response_type");
  }

  if (code_challenge) {
    if (code_challenge_method && code_challenge_method !== "S256") {
      throw new Error("unsupported_code_challenge_method");
    }
    assertValidCodeChallenge(code_challenge);
  }

  return {
    client_id,
    redirect_uri,
    response_type,
    state,
    code_challenge,
    code_challenge_method: code_challenge ? "S256" : undefined,
  };
}
