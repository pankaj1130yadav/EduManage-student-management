import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-guard";
import type { SessionUser } from "@/lib/auth";

const studentInclude = {
  class: { select: { id: true, name: true } },
  user: { select: { id: true, email: true } },
  attendance: { orderBy: { date: "desc" as const }, take: 30 },
  marks: { include: { exam: true }, orderBy: { createdAt: "desc" as const }, take: 50 },
  fees: { orderBy: { dueDate: "desc" as const } },
};

async function canSeeStudent(session: SessionUser, studentId: string) {
  if (session.role === "ADMIN") return true;
  if (session.role === "STUDENT") return session.studentId === studentId;
  // TEACHER: student must be in one of their classes
  const t = await prisma.teacher.findUnique({
    where: { id: session.teacherId! },
    include: { classes: { select: { id: true } }, classTeacherOf: { select: { id: true } } },
  });
  const ids = [...t!.classes.map((c) => c.id), ...t!.classTeacherOf.map((c) => c.id)];
  const s = await prisma.student.findUnique({ where: { id: studentId }, select: { classId: true } });
  return !!s?.classId && ids.includes(s.classId);
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const gate = await requireRole(["ADMIN", "TEACHER", "STUDENT"]);
  if ("response" in gate) return gate.response;
  const { session } = gate;

  if (!(await canSeeStudent(session, params.id))) {
    return NextResponse.json({ error: "Not permitted" }, { status: 403 });
  }
  const student = await prisma.student.findUnique({
    where: { id: params.id },
    include: studentInclude,
  });
  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });
  return NextResponse.json({ student });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const gate = await requireRole("ADMIN");
  if ("response" in gate) return gate.response;

  try {
    const body = await req.json();
    const student = await prisma.student.update({
      where: { id: params.id },
      data: {
        ...(body.firstName ? { firstName: String(body.firstName) } : {}),
        ...(body.lastName ? { lastName: String(body.lastName) } : {}),
        ...(body.gender ? { gender: body.gender } : {}),
        ...(body.dateOfBirth ? { dateOfBirth: new Date(body.dateOfBirth) } : {}),
        ...(body.classId !== undefined ? { classId: body.classId || null } : {}),
        ...(body.phone !== undefined ? { phone: body.phone || null } : {}),
        ...(body.address !== undefined ? { address: body.address || null } : {}),
        ...(body.guardianName !== undefined ? { guardianName: body.guardianName || null } : {}),
        ...(body.guardianPhone !== undefined ? { guardianPhone: body.guardianPhone || null } : {}),
      },
      include: studentInclude,
    });
    return NextResponse.json({ student });
  } catch (err) {
    console.error("update student error", err);
    return NextResponse.json({ error: "Could not update student" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const gate = await requireRole("ADMIN");
  if ("response" in gate) return gate.response;

  try {
    await prisma.student.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("delete student error", err);
    return NextResponse.json({ error: "Could not delete student" }, { status: 500 });
  }
}
