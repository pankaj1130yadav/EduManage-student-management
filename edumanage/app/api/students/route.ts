import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-guard";
import { hashPassword } from "@/lib/auth";

const studentInclude = {
  class: { select: { id: true, name: true } },
  user: { select: { id: true, email: true } },
};

export async function GET(req: NextRequest) {
  const gate = await requireRole(["ADMIN", "TEACHER"]);
  if ("response" in gate) return gate.response;
  const { session } = gate;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const classId = searchParams.get("classId");

  // Teachers may only list students of classes they are assigned to.
  let allowedClassIds: string[] | undefined;
  if (session.role === "TEACHER") {
    const t = await prisma.teacher.findUnique({
      where: { id: session.teacherId! },
      include: { classes: { select: { id: true } }, classTeacherOf: { select: { id: true } } },
    });
    allowedClassIds = [
      ...t!.classes.map((c) => c.id),
      ...t!.classTeacherOf.map((c) => c.id),
    ];
  }

  const students = await prisma.student.findMany({
    where: {
      ...(classId ? { classId } : {}),
      ...(allowedClassIds ? { classId: { in: allowedClassIds } } : {}),
      ...(q
        ? {
            OR: [
              { firstName: { contains: q, mode: "insensitive" } },
              { lastName: { contains: q, mode: "insensitive" } },
              { admissionNo: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: studentInclude,
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    take: 500,
  });
  return NextResponse.json({ students });
}

export async function POST(req: NextRequest) {
  const gate = await requireRole("ADMIN");
  if ("response" in gate) return gate.response;

  try {
    const body = await req.json();
    const {
      firstName, lastName, gender, dateOfBirth, classId,
      phone, address, guardianName, guardianPhone,
      admissionNo, createLogin, email, password,
    } = body;

    if (!firstName || !lastName || !gender || !dateOfBirth) {
      return NextResponse.json(
        { error: "First name, last name, gender and date of birth are required" },
        { status: 400 }
      );
    }

    let userId: string | undefined;
    if (createLogin) {
      if (!email || !password) {
        return NextResponse.json(
          { error: "Email and password are required to create a student login" },
          { status: 400 }
        );
      }
      const existing = await prisma.user.findUnique({
        where: { email: String(email).toLowerCase().trim() },
      });
      if (existing) {
        return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
      }
      const user = await prisma.user.create({
        data: {
          email: String(email).toLowerCase().trim(),
          passwordHash: await hashPassword(String(password)),
          role: "STUDENT",
          name: `${firstName} ${lastName}`,
        },
      });
      userId = user.id;
    }

    const admNo =
      admissionNo ||
      `ADM-${new Date().getFullYear()}-${String(
        await prisma.student.count()
      ).padStart(4, "0")}`;

    const student = await prisma.student.create({
      data: {
        userId,
        admissionNo: String(admNo),
        firstName: String(firstName),
        lastName: String(lastName),
        gender,
        dateOfBirth: new Date(dateOfBirth),
        classId: classId || null,
        phone: phone || null,
        address: address || null,
        guardianName: guardianName || null,
        guardianPhone: guardianPhone || null,
      },
      include: studentInclude,
    });
    return NextResponse.json({ student }, { status: 201 });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "P2002") {
      return NextResponse.json({ error: "Admission number already exists" }, { status: 409 });
    }
    console.error("create student error", err);
    return NextResponse.json({ error: "Could not create student" }, { status: 500 });
  }
}
