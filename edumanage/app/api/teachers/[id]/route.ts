import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-guard";

const teacherInclude = {
  user: { select: { id: true, email: true, name: true } },
  classes: { select: { id: true, name: true } },
  classTeacherOf: { select: { id: true, name: true } },
};

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const gate = await requireRole("ADMIN");
  if ("response" in gate) return gate.response;

  try {
    const body = await req.json();
    const teacher = await prisma.teacher.update({
      where: { id: params.id },
      data: {
        ...(body.subject ? { subject: String(body.subject) } : {}),
        ...(body.phone !== undefined ? { phone: body.phone || null } : {}),
        ...(body.qualification !== undefined ? { qualification: body.qualification || null } : {}),
        ...(body.salary !== undefined ? { salary: body.salary ? Number(body.salary) : null } : {}),
        ...(Array.isArray(body.classIds)
          ? { classes: { set: body.classIds.map((id: string) => ({ id })) } }
          : {}),
      },
      include: teacherInclude,
    });
    return NextResponse.json({ teacher });
  } catch (err) {
    console.error("update teacher error", err);
    return NextResponse.json({ error: "Could not update teacher" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const gate = await requireRole("ADMIN");
  if ("response" in gate) return gate.response;

  try {
    const teacher = await prisma.teacher.findUnique({
      where: { id: params.id },
      select: { userId: true },
    });
    if (!teacher) return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    // Deleting the user cascades to the teacher profile.
    await prisma.user.delete({ where: { id: teacher.userId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("delete teacher error", err);
    return NextResponse.json({ error: "Could not delete teacher" }, { status: 500 });
  }
}
