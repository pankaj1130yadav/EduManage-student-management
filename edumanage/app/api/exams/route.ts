import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-guard";

/** GET /api/exams?classId= — list exams (with marks counts) */
export async function GET(req: NextRequest) {
  const gate = await requireRole(["ADMIN", "TEACHER", "STUDENT"]);
  if ("response" in gate) return gate.response;

  const { searchParams } = new URL(req.url);
  const classId = searchParams.get("classId");

  const exams = await prisma.exam.findMany({
    where: classId ? { classId } : {},
    include: {
      class: { select: { id: true, name: true } },
      _count: { select: { marks: true } },
    },
    orderBy: { examDate: "desc" },
  });
  return NextResponse.json({ exams });
}

/** POST /api/exams — create an exam (admin + teacher) */
export async function POST(req: NextRequest) {
  const gate = await requireRole(["ADMIN", "TEACHER"]);
  if ("response" in gate) return gate.response;

  try {
    const body = await req.json();
    const { name, classId, subject, maxMarks, examDate, term } = body;
    if (!name || !classId || !subject || !examDate) {
      return NextResponse.json(
        { error: "Name, class, subject and exam date are required" },
        { status: 400 }
      );
    }
    const exam = await prisma.exam.create({
      data: {
        name: String(name),
        classId: String(classId),
        subject: String(subject),
        maxMarks: maxMarks ? Number(maxMarks) : 100,
        examDate: new Date(examDate),
        term: term || null,
      },
      include: { class: { select: { id: true, name: true } } },
    });
    return NextResponse.json({ exam }, { status: 201 });
  } catch (err) {
    console.error("create exam error", err);
    return NextResponse.json({ error: "Could not create exam" }, { status: 500 });
  }
}
