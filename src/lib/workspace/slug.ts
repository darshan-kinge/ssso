import { isReservedSlug } from "./host";
import {
  WORKSPACE_SLUG_REGEX,
  normalizeSlugInput,
  slugifyWorkspaceName,
} from "./slug-utils";

export { WORKSPACE_SLUG_REGEX, normalizeSlugInput, slugifyWorkspaceName };

export function validateWorkspaceSlug(
  slug: string
): { valid: true } | { valid: false; message: string } {
  if (slug.length < 2) {
    return { valid: false, message: "Subdomain must be at least 2 characters" };
  }
  if (slug.length > 48) {
    return { valid: false, message: "Subdomain must be at most 48 characters" };
  }
  if (!WORKSPACE_SLUG_REGEX.test(slug)) {
    return {
      valid: false,
      message:
        "Use lowercase letters, numbers, and hyphens (not at the start or end)",
    };
  }
  if (isReservedSlug(slug)) {
    return { valid: false, message: "This subdomain is reserved" };
  }
  return { valid: true };
}
