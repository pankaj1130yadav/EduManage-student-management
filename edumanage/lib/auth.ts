import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import type { Role } from "@prisma/client";
import { prisma } from "./prisma";

export const TOKEN_COOKIE = "edumanage_token";
const JWT_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  teacherId?: string | null;
  studentId?: string | null;
}

function secret(): string {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET is not set");
  return s;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: Omit<SessionUser, "teacherId" | "studentId"> & Partial<Pick<SessionUser, "teacherId" | "studentId">>): string {
  return jwt.sign(payload, secret(), { expiresIn: JWT_MAX_AGE });
}

export function verifyToken(token: string): SessionUser | null {
  try {
    const decoded = jwt.verify(token, secret()) as SessionUser;
    if (!decoded?.id || !decoded?.role) return null;
    return decoded;
  } catch {
    return null;
  }
}

/** Read the current session from the httpOnly cookie (server components / routes). */
export function getSession(): SessionUser | null {
  const token = cookies().get(TOKEN_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/** Set the httpOnly session cookie after a successful login. */
export function setSessionCookie(token: string) {
  cookies().set(TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: JWT_MAX_AGE,
    path: "/",
  });
}

export function clearSessionCookie() {
  cookies().set(TOKEN_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

/** Full user record (with linked teacher/student profile ids) for a session user. */
export async function loadSessionUser(session: SessionUser): Promise<SessionUser> {
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    include: { teacherProfile: { select: { id: true } }, studentProfile: { select: { id: true } } },
  });
  return {
    ...session,
    teacherId: user?.teacherProfile?.id ?? null,
    studentId: user?.studentProfile?.id ?? null,
  };
}
