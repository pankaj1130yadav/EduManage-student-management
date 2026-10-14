import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-guard";

/**
 * GET /api/exams/[id]/marks — students of the exam's class with their marks.
 * POST /api/exams/[id]/marks — batch upsert { entries: [{studentId, marksObtained, remark?}] }.
 */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const gate = await requireRole(["ADMIN", "TEACHER", "STUDENT"]);
  if ("response" in gate) return gate.response;

  const exam = await prisma.exam.findUnique({
    where: { id: params.id },
    include: { class: { select: { id: true, name: true } } },
  });
  if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 });

  const students = await prisma.student.findMany({
    where: { classId: exam.classId },
    select: { id: true, firstName: true, lastName: true, admissionNo: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
  const marks = await prisma.mark.findMany({ where: { examId: params.id } });
  const byStudent = new Map(marks.map((m) => [m.studentId, m]));

  return NextResponse.json({
    exam,
    students: students.map((s) => ({ ...s, mark: byStudent.get(s.id) ?? null })),
  });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const gate = await requireRole(["ADMIN", "TEACHER"]);
  if ("response" in gate) return gate.response;
  const { session } = gate;

  try {
    const exam = await prisma.exam.findUnique({ where: { id: params.id } });
    if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 });

    const body = await req.json();
    const { entries } = body as {
      entries: { studentId: string; marksObtained: number; remark?: string }[];
    };
    if (!Array.isArray(entries)) {
      return NextResponse.json({ error: "entries array is required" }, { status: 400 });
    }

    await prisma.$transaction(
      entries
        .filter((e) => e.studentId && e.marksObtained !== undefined && e.marksObtained !== null && String(e.marksObtained) !== "")
        .map((e) => {
          const m = Math.max(0, Math.min(exam.maxMarks, Number(e.marksObtained)));
          return prisma.mark.upsert({
            where: { examId_studentId: { examId: params.id, studentId: e.studentId } },
            update: { marksObtained: m, remark: e.remark || null },
            create: {
              examId: params.id,
              studentId: e.studentId,
              marksObtained: m,
              remark: e.remark || null,
              enteredById: session.role === "TEACHER" ? session.teacherId : null,
            },
          });
        })
    );
    return NextResponse.json({ ok: true, entered: entries.length });
  } catch (err) {
    console.error("enter marks error", err);
    return NextResponse.json({ error: "Could not save marks" }, { status: 500 });
  }
}
