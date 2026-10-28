import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export type SystemRole = "super_admin" | "admin" | "editor" | "support" | "analyst";

export interface AdminSessionUser {
  id: string;
  name: string;
  email: string;
  role: SystemRole;
  permissions: string[];
}

const DEFAULT_SECRET = "haarkan_super_secret_admin_jwt_salt_2026_x89";
const ADMIN_COOKIE_NAME = "haarkan_admin_session";

function getSecretKey(): string {
  return process.env.ADMIN_JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || DEFAULT_SECRET;
}

export const ROLE_PERMISSIONS: Record<SystemRole, string[]> = {
  super_admin: ["all"],
  admin: [
    "users.read",
    "users.write",
    "groups.read",
    "groups.write",
    "reports.read",
    "reports.export",
    "audit.read",
    "settings.read",
    "settings.write",
    "monitoring.read",
  ],
  editor: ["content.read", "content.write", "settings.read"],
  support: ["users.read", "groups.read", "audit.read", "monitoring.read"],
  analyst: ["reports.read", "reports.export", "groups.read", "users.read"],
};

export function hasPermission(role: SystemRole, requiredPermission: string): boolean {
  if (role === "super_admin") return true;
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(requiredPermission) || permissions.includes("all");
}

export function createAdminToken(user: AdminSessionUser, expiresInHours = 24): string {
  const payload = {
    ...user,
    exp: Date.now() + expiresInHours * 60 * 60 * 1000,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const hmac = crypto.createHmac("sha256", getSecretKey());
  hmac.update(body);
  const signature = hmac.digest("base64url");
  return `${body}.${signature}`;
}

export function verifyAdminToken(token: string): AdminSessionUser | null {
  try {
    if (!token || !token.includes(".")) return null;
    const [body, signature] = token.split(".");
    if (!body || !signature) return null;

    const hmac = crypto.createHmac("sha256", getSecretKey());
    hmac.update(body);
    const expectedSignature = hmac.digest("base64url");

    if (signature !== expectedSignature) return null;

    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf-8"));
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) {
      return null; // Expired
    }

    return {
      id: payload.id,
      name: payload.name,
      email: payload.email,
      role: payload.role as SystemRole,
      permissions: ROLE_PERMISSIONS[payload.role as SystemRole] || [],
    };
  } catch {
    return null;
  }
}

export function getAdminFromRequest(request: NextRequest): AdminSessionUser | null {
  // Check Authorization Bearer Header or Cookie
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    const user = verifyAdminToken(token);
    if (user) return user;
  }

  const cookie = request.cookies.get(ADMIN_COOKIE_NAME);
  if (cookie?.value) {
    return verifyAdminToken(cookie.value);
  }

  return null;
}

export function requireAdminAuth(
  request: NextRequest,
  requiredPermission?: string
): { user: AdminSessionUser } | { errorResponse: NextResponse } {
  const user = getAdminFromRequest(request);

  if (!user) {
    return {
      errorResponse: NextResponse.json(
        { success: false, message: "กรุณาเข้าสู่ระบบด้วยสิทธิ์ผู้ดูแลระบบ (Unauthorized)" },
        { status: 401 }
      ),
    };
  }

  if (requiredPermission && !hasPermission(user.role, requiredPermission)) {
    return {
      errorResponse: NextResponse.json(
        {
          success: false,
          message: `คุณไม่มีสิทธิ์เข้าถึงฟังก์ชันนี้ (ต้องการสิทธิ์: ${requiredPermission})`,
        },
        { status: 403 }
      ),
    };
  }

  return { user };
}

export { ADMIN_COOKIE_NAME };
