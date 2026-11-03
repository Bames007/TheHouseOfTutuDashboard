// app/lib/apiHelpers.ts
import { NextRequest } from "next/server";

/** ...existing getClientIp stays... */

export type SessionUser = {
  id: string;
  role: string;
  email?: string;
  fullName?: string;
};

/**
 * Parse the `user` cookie set by /login. Returns null if missing/invalid.
 * ⚠️ This trusts the cookie as-is. For production, switch to a signed JWT
 * (jose / next-auth) and verify the signature here.
 */
export function getSessionUser(request: NextRequest): SessionUser | null {
  const raw = request.cookies.get("user")?.value;
  if (!raw) return null;
  try {
    const u = JSON.parse(decodeURIComponent(raw));
    if (!u?.id || !u?.role) return null;
    return { id: u.id, role: u.role, email: u.email, fullName: u.fullName };
  } catch {
    return null;
  }
}

export function requireAdmin(request: NextRequest): SessionUser | null {
  const user = getSessionUser(request);
  if (!user) return null;
  if (user.role !== "admin") return null;
  return user;
}

export function requireAuth(request: NextRequest): SessionUser | null {
  return getSessionUser(request);
}

/** Standard error response */
export function apiError(message: string, status = 400) {
  return Response.json({ success: false, error: message }, { status });
}

/** Standard success response */
export function apiOk<T>(data: T) {
  return Response.json({ success: true, data });
}
