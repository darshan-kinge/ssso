export class AuthError extends Error {
  constructor(
    message: string,
    readonly status: number = 400,
    readonly code?: string
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export function isAuthError(err: unknown): err is AuthError {
  return err instanceof AuthError;
}
