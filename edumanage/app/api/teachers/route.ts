import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-guard";
import { hashPassword } from "@/lib/auth";

const teacherInclude = {
  user: { select: { id: true, email: true, name: true } },
  classes: { select: { id: true, name: true } },
  classTeacherOf: { select: { id: true, name: true } },
};

export async function GET(req: NextRequest) {
  const gate = await requireRole(["ADMIN", "TEACHER"]);
  if ("response" in gate) return gate.response;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();

  const teachers = await prisma.teacher.findMany({
    where: q
      ? {
          OR: [
            { user: { name: { contains: q, mode: "insensitive" } } },
            { employeeId: { contains: q, mode: "insensitive" } },
            { subject: { contains: q, mode: "insensitive" } },
          ],
        }
      : {},
    include: teacherInclude,
    orderBy: { user: { name: "asc" } },
  });
  return NextResponse.json({ teachers });
}

export async function POST(req: NextRequest) {
  const gate = await requireRole("ADMIN");
  if ("response" in gate) return gate.response;

  try {
    const body = await req.json();
    const {
      name, email, password, subject, phone, qualification,
      joiningDate, salary, classIds, employeeId,
    } = body;

    if (!name || !email || !password || !subject) {
      return NextResponse.json(
        { error: "Name, email, password and subject are required" },
        { status: 400 }
      );
    }
    const existing = await prisma.user.findUnique({
      where: { email: String(email).toLowerCase().trim() },
    });
    if (existing) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
    }

    const empId =
      employeeId ||
      `EMP-${new Date().getFullYear()}-${String(await prisma.teacher.count()).padStart(3, "0")}`;

    const teacher = await prisma.teacher.create({
      data: {
        user: {
          create: {
            email: String(email).toLowerCase().trim(),
            passwordHash: await hashPassword(String(password)),
            role: "TEACHER",
            name: String(name),
          },
        },
        employeeId: String(empId),
        subject: String(subject),
        phone: phone || null,
        qualification: qualification || null,
        joiningDate: joiningDate ? new Date(joiningDate) : null,
        salary: salary ? Number(salary) : null,
        classes: classIds?.length ? { connect: classIds.map((id: string) => ({ id })) } : undefined,
      },
      include: teacherInclude,
    });
    return NextResponse.json({ teacher }, { status: 201 });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "P2002") {
      return NextResponse.json({ error: "Employee ID already exists" }, { status: 409 });
    }
    console.error("create teacher error", err);
    return NextResponse.json({ error: "Could not create teacher" }, { status: 500 });
  }
}
