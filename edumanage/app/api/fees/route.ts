import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-guard";

/** GET /api/fees?studentId=&status= — list fee records. */
export async function GET(req: NextRequest) {
  const gate = await requireRole(["ADMIN", "TEACHER", "STUDENT"]);
  if ("response" in gate) return gate.response;
  const { session } = gate;

  const { searchParams } = new URL(req.url);
  let studentId: string | undefined = searchParams.get("studentId") ?? undefined;
  const status = searchParams.get("status");

  if (session.role === "STUDENT") {
    studentId = session.studentId ?? undefined;
  }

  const records = await prisma.feeRecord.findMany({
    where: {
      ...(studentId ? { studentId } : {}),
      ...(status ? { status: status as "PENDING" | "PAID" | "OVERDUE" } : {}),
    },
    include: {
      student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } },
    },
    orderBy: { dueDate: "asc" },
    take: 500,
  });
  return NextResponse.json({ records });
}

/** POST /api/fees — create a fee record (admin). */
export async function POST(req: NextRequest) {
  const gate = await requireRole("ADMIN");
  if ("response" in gate) return gate.response;

  try {
    const body = await req.json();
    const { studentId, title, amount, dueDate, academicYear } = body;
    if (!studentId || !title || !amount || !dueDate) {
      return NextResponse.json(
        { error: "Student, title, amount and due date are required" },
        { status: 400 }
      );
    }
    const record = await prisma.feeRecord.create({
      data: {
        studentId: String(studentId),
        title: String(title),
        amount: Math.round(Number(amount)),
        dueDate: new Date(dueDate),
        status: "PENDING",
        academicYear: academicYear || "2026-27",
      },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } },
      },
    });
    return NextResponse.json({ record }, { status: 201 });
  } catch (err) {
    console.error("create fee error", err);
    return NextResponse.json({ error: "Could not create fee record" }, { status: 500 });
  }
}
