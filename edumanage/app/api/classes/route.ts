import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-guard";

export async function GET(req: NextRequest) {
  const gate = await requireRole(["ADMIN", "TEACHER"]);
  if ("response" in gate) return gate.response;
  const { session } = gate;

  const classes = await prisma.class.findMany({
    include: {
      classTeacher: { include: { user: { select: { name: true } } } },
      _count: { select: { students: true } },
    },
    orderBy: [{ grade: "asc" }, { section: "asc" }],
  });

  // Teachers only need their own classes, but listing all is harmless for navigation;
  // mark which ones belong to the teacher.
  let mine: string[] = [];
  if (session.role === "TEACHER") {
    const t = await prisma.teacher.findUnique({
      where: { id: session.teacherId! },
      include: { classes: { select: { id: true } }, classTeacherOf: { select: { id: true } } },
    });
    mine = [...t!.classes.map((c) => c.id), ...t!.classTeacherOf.map((c) => c.id)];
  }
  return NextResponse.json({ classes, mine });
}

export async function POST(req: NextRequest) {
  const gate = await requireRole("ADMIN");
  if ("response" in gate) return gate.response;

  try {
    const body = await req.json();
    const { name, grade, section, academicYear, classTeacherId } = body;
    if (!name || !grade || !section) {
      return NextResponse.json(
        { error: "Class name, grade and section are required" },
        { status: 400 }
      );
    }
    const cls = await prisma.class.create({
      data: {
        name: String(name),
        grade: String(grade),
        section: String(section),
        academicYear: academicYear || "2026-27",
        classTeacherId: classTeacherId || null,
      },
    });
    return NextResponse.json({ class: cls }, { status: 201 });
  } catch (err) {
    console.error("create class error", err);
    return NextResponse.json({ error: "Could not create class" }, { status: 500 });
  }
}
