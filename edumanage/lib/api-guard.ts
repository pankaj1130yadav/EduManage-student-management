import { getSession, loadSessionUser } from "@/lib/auth";
import type { SessionUser } from "@/lib/auth";
import type { Role } from "@prisma/client";

/**
 * Guard helper for API routes.
 * Returns `{ session }` on success or `{ response }` (a 401/403 Response) to return.
 */
export async function requireRole(
  roles: Role | Role[]
): Promise<{ session: SessionUser } | { response: Response }> {
  const raw = getSession();
  if (!raw) {
    return { response: Response.json({ error: "Not signed in" }, { status: 401 }) };
  }
  const session = await loadSessionUser(raw);
  const allowed = Array.isArray(roles) ? roles : [roles];
  if (!allowed.includes(session.role)) {
    return { response: Response.json({ error: "Not permitted for this role" }, { status: 403 }) };
  }
  return { session };
}

export { getSession };
