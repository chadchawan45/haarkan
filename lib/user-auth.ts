import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getSecretKey } from "./admin-auth";

export interface MemberSessionUser {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role?: string;
  systemRole?: string;
}

const MEMBER_COOKIE_NAME = "haarkan_member_session";

export function createMemberToken(user: MemberSessionUser, expiresInDays = 30): string {
  const payload = {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    exp: Date.now() + expiresInDays * 24 * 60 * 60 * 1000,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const hmac = crypto.createHmac("sha256", getSecretKey());
  hmac.update(body);
  const signature = hmac.digest("base64url");
  return `${body}.${signature}`;
}

export function verifyMemberToken(token: string): MemberSessionUser | null {
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
      phone: payload.phone,
    };
  } catch {
    return null;
  }
}

export function getMemberFromRequest(request: NextRequest): MemberSessionUser | null {
  // 1. Check Authorization Bearer Header
  const authHeader = request.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    const user = verifyMemberToken(token);
    if (user) return user;
  }

  // 2. Check x-member-token header
  const customHeader = request.headers.get("x-member-token");
  if (customHeader) {
    const user = verifyMemberToken(customHeader);
    if (user) return user;
  }

  // 3. Check Cookie
  const cookie = request.cookies.get(MEMBER_COOKIE_NAME);
  if (cookie?.value) {
    const user = verifyMemberToken(cookie.value);
    if (user) return user;
  }

  return null;
}

export { MEMBER_COOKIE_NAME };
