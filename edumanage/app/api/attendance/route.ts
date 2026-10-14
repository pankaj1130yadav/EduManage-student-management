import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-guard";
import type { AttendanceStatus } from "@prisma/client";

async function teacherClassIds(teacherId: string): Promise<string[]> {
  const t = await prisma.teacher.findUnique({
    where: { id: teacherId },
    include: { classes: { select: { id: true } }, classTeacherOf: { select: { id: true } } },
  });
  if (!t) return [];
  return [...t.classes.map((c) => c.id), ...t.classTeacherOf.map((c) => c.id)];
}

/**
 * GET /api/attendance?classId=&date=YYYY-MM-DD   → rows for one class-day
 * GET /api/attendance?studentId=                 → full record for one student
 */
export async function GET(req: NextRequest) {
  const gate = await requireRole(["ADMIN", "TEACHER", "STUDENT"]);
  if ("response" in gate) return gate.response;
  const { session } = gate;

  const { searchParams } = new URL(req.url);
  const classId = searchParams.get("classId");
  const date = searchParams.get("date");
  const studentId = searchParams.get("studentId");

  if (studentId) {
    if (session.role === "STUDENT" && session.studentId !== studentId) {
      return NextResponse.json({ error: "Not permitted" }, { status: 403 });
    }
    const rows = await prisma.attendance.findMany({
      where: { studentId },
      orderBy: { date: "desc" },
      take: 120,
    });
    return NextResponse.json({ rows });
  }

  if (!classId || !date) {
    return NextResponse.json({ error: "classId and date are required" }, { status: 400 });
  }
  if (session.role === "TEACHER") {
    const mine = await teacherClassIds(session.teacherId!);
    if (!mine.includes(classId)) {
      return NextResponse.json({ error: "This class is not assigned to you" }, { status: 403 });
    }
  }

  const students = await prisma.student.findMany({
    where: { classId },
    select: { id: true, firstName: true, lastName: true, admissionNo: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
  const dayStart = new Date(date + "T00:00:00.000Z");
  const dayEnd = new Date(date + "T00:00:00.000Z");
  const rows = await prisma.attendance.findMany({
    where: { classId, date: { gte: dayStart, lt: new Date(dayEnd.getTime() + 86400000) } },
  });
  const byStudent = new Map(rows.map((r) => [r.studentId, r]));
  return NextResponse.json({
    students: students.map((s) => ({ ...s, attendance: byStudent.get(s.id) ?? null })),
    date,
  });
}

/** POST /api/attendance — batch mark a class-day. { classId, date, entries: [{studentId, status, remark?}] } */
export async function POST(req: NextRequest) {
  const gate = await requireRole(["ADMIN", "TEACHER"]);
  if ("response" in gate) return gate.response;
  const { session } = gate;

  try {
    const body = await req.json();
    const { classId, date, entries } = body as {
      classId: string;
      date: string;
      entries: { studentId: string; status: AttendanceStatus; remark?: string }[];
    };
    if (!classId || !date || !Array.isArray(entries)) {
      return NextResponse.json({ error: "classId, date and entries are required" }, { status: 400 });
    }
    if (session.role === "TEACHER") {
      const mine = await teacherClassIds(session.teacherId!);
      if (!mine.includes(classId)) {
        return NextResponse.json({ error: "This class is not assigned to you" }, { status: 403 });
      }
    }

    const day = new Date(date + "T00:00:00.000Z");
    const valid: AttendanceStatus[] = ["PRESENT", "ABSENT", "LEAVE"];

    await prisma.$transaction(
      entries
        .filter((e) => e.studentId && valid.includes(e.status))
        .map((e) =>
          prisma.attendance.upsert({
            where: { studentId_date: { studentId: e.studentId, date: day } },
            update: {
              status: e.status,
              remark: e.remark || null,
              markedById: session.role === "TEACHER" ? session.teacherId : undefined,
            },
            create: {
              studentId: e.studentId,
              classId,
              date: day,
              status: e.status,
              remark: e.remark || null,
              markedById: session.role === "TEACHER" ? session.teacherId : undefined,
            },
          })
        )
    );
    return NextResponse.json({ ok: true, marked: entries.length });
  } catch (err) {
    console.error("mark attendance error", err);
    return NextResponse.json({ error: "Could not save attendance" }, { status: 500 });
  }
}
