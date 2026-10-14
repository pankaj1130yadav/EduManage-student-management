import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-guard";

/** GET /api/report-card?studentId= — consolidated marks per exam for the report card. */
export async function GET(req: NextRequest) {
  const gate = await requireRole(["ADMIN", "TEACHER", "STUDENT"]);
  if ("response" in gate) return gate.response;
  const { session } = gate;

  const { searchParams } = new URL(req.url);
  let studentId: string | undefined = searchParams.get("studentId") ?? undefined;
  if (session.role === "STUDENT") studentId = session.studentId ?? undefined;
  if (!studentId) {
    return NextResponse.json({ error: "studentId is required" }, { status: 400 });
  }

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { class: { select: { id: true, name: true } } },
  });
  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

  if (session.role === "STUDENT" && session.studentId !== studentId) {
    return NextResponse.json({ error: "Not permitted" }, { status: 403 });
  }

  const exams = await prisma.exam.findMany({
    where: { classId: student.classId ?? undefined },
    include: { marks: { where: { studentId }, select: { marksObtained: true, remark: true } } },
    orderBy: { examDate: "asc" },
  });

  // Group by exam name (e.g. "Mid-Term Examination") across subjects.
  const byName = new Map<
    string,
    { name: string; term: string | null; subjects: { subject: string; max: number; obtained: number | null }[] }
  >();
  for (const e of exams) {
    if (!byName.has(e.name)) byName.set(e.name, { name: e.name, term: e.term, subjects: [] });
    const m = e.marks[0];
    byName.get(e.name)!.subjects.push({
      subject: e.subject,
      max: e.maxMarks,
      obtained: m ? m.marksObtained : null,
    });
  }

  const reportCard = [...byName.values()].map((g) => {
    const entered = g.subjects.filter((s) => s.obtained !== null);
    const totalMax = entered.reduce((a, s) => a + s.max, 0);
    const totalObt = entered.reduce((a, s) => a + (s.obtained ?? 0), 0);
    const pct = totalMax ? (totalObt / totalMax) * 100 : 0;
    return { ...g, totalMax, totalObtained: totalObt, percentage: Math.round(pct * 10) / 10 };
  });

  return NextResponse.json({ student, reportCard });
}
