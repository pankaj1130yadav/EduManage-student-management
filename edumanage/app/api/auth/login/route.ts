import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken, setSessionCookie, verifyPassword, loadSessionUser } from "@/lib/auth";

const REDIRECT: Record<string, string> = {
  ADMIN: "/admin",
  TEACHER: "/teacher",
  STUDENT: "/student",
};

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }
    const user = await prisma.user.findUnique({
      where: { email: String(email).toLowerCase().trim() },
    });
    if (!user || !(await verifyPassword(String(password), user.passwordHash))) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }
    const session = await loadSessionUser({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
    setSessionCookie(signToken(session));
    return NextResponse.json({
      user: session,
      redirect: REDIRECT[user.role] ?? "/",
    });
  } catch (err) {
    console.error("login error", err);
    return NextResponse.json({ error: "Sign in failed. Try again." }, { status: 500 });
  }
}
