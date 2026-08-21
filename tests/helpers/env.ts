/** Test secrets — min 32 chars for requireAuthSecrets() */
const TEST_JWT =
  "test-jwt-secret-minimum-32-characters-long";
const TEST_PEPPER =
  "test-refresh-pepper-minimum-32-chars";

export function applyTestEnv(mongoUri?: string): void {
  process.env.JWT_SECRET ??= TEST_JWT;
  process.env.REFRESH_PEPPER ??= TEST_PEPPER;
  process.env.RESEND_API_KEY = "";
  process.env.EMAIL_FROM = "";
  if (mongoUri) {
    process.env.MONGODB_URI = mongoUri;
  }
}
