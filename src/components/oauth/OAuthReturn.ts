/** Build /authorize return path from login/signup query params. */
export function getOAuthReturnPath(
  searchParams: URLSearchParams | Record<string, string>
): string | null {
  const params =
    searchParams instanceof URLSearchParams
      ? searchParams
      : new URLSearchParams(searchParams);

  const clientId = params.get("client_id");
  const redirectUri = params.get("redirect_uri");
  const responseType = params.get("response_type");

  if (!clientId || !redirectUri || responseType !== "code") {
    return null;
  }

  const q = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: responseType,
  });
  const state = params.get("state");
  if (state) q.set("state", state);

  const challenge = params.get("code_challenge");
  const method = params.get("code_challenge_method");
  if (challenge) {
    q.set("code_challenge", challenge);
    q.set("code_challenge_method", method ?? "S256");
  }

  return `/authorize?${q.toString()}`;
}
