export const dynamic = "force-dynamic";

import { getSession, loadSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PageHeader, Card, CardHeader, Badge } from "@/components/ui";
import { fmtDate, todayISO } from "@/lib/utils";

export default async function TeacherDesk() {
  const raw = getSession();
  if (!raw) redirect("/login");
  const session = await loadSessionUser(raw);
  if (!session.teacherId) redirect("/login");

  const teacher = await prisma.teacher.findUnique({
    where: { id: session.teacherId },
    include: {
      user: { select: { name: true, email: true } },
      classes: { include: { _count: { select: { students: true } } } },
      classTeacherOf: { include: { _count: { select: { students: true } } } },
    },
  });
  if (!teacher) redirect("/login");

  const myClassIds = [...teacher.classes.map((c) => c.id), ...teacher.classTeacherOf.map((c) => c.id)];
  const totalStudents = myClassIds.length
    ? await prisma.student.count({ where: { classId: { in: myClassIds } } })
    : 0;

  const today = todayISO();
  const upcomingExams = await prisma.exam.findMany({
    where: { classId: { in: myClassIds }, examDate: { gte: new Date(today + "T00:00:00.000Z") } },
    include: { class: { select: { name: true } } },
    orderBy: { examDate: "asc" },
    take: 5,
  });

  const markedToday = await prisma.attendance.count({
    where: { classId: { in: myClassIds }, date: new Date(today + "T00:00:00.000Z") },
  });

  return (
    <div>
      <PageHeader
        title={`Namaste, ${teacher.user.name.split(" ")[0]}`}
        subtitle={`${teacher.subject} · ${teacher.employeeId} — your classes, roll and gradebook.`}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-t-4 border-t-forest p-5">
          <p className="font-display text-3xl font-semibold text-ink">{myClassIds.length}</p>
          <p className="mt-1 text-sm text-ink-soft">Classes assigned</p>
        </Card>
        <Card className="border-t-4 border-t-gold-soft p-5">
          <p className="font-display text-3xl font-semibold text-ink">{totalStudents}</p>
          <p className="mt-1 text-sm text-ink-soft">Students in your classes</p>
        </Card>
        <Card className="border-t-4 border-t-forest p-5">
          <p className="font-display text-3xl font-semibold text-ink">{markedToday}</p>
          <p className="mt-1 text-sm text-ink-soft">Attendance rows marked today</p>
        </Card>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Your classes"
            action={
              <Link href="/teacher/attendance" className="rounded-sm bg-forest px-3.5 py-2 text-sm font-semibold text-paper hover:bg-forest-deep">
                Mark attendance →
              </Link>
            }
          />
          <ul className="divide-y divide-paper-line/70">
            {myClassIds.length === 0 && (
              <li className="px-5 py-8 text-center text-sm italic text-ink-faint">
                No classes assigned yet — ask the administrator.
              </li>
            )}
            {[...teacher.classTeacherOf, ...teacher.classes.filter((c) => !teacher.classTeacherOf.some((x) => x.id === c.id))].map((c) => (
              <li key={c.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="font-display text-lg font-semibold text-ink">{c.name}</p>
                  <p className="text-xs text-ink-faint">{c._count.students} students</p>
                </div>
                <div className="flex gap-2">
                  {teacher.classTeacherOf.some((x) => x.id === c.id) && (
                    <Badge tone="gold">Class teacher</Badge>
                  )}
                  <Link href={`/teacher/attendance?class=${c.id}`} className="rounded-sm border border-forest/30 px-2.5 py-1 text-xs font-semibold text-forest hover:bg-forest-mist">
                    Take roll
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader
            title="Upcoming examinations"
            action={
              <Link href="/teacher/exams" className="rounded-sm border border-forest/30 px-3.5 py-2 text-sm font-semibold text-forest hover:bg-forest-mist">
                Gradebook →
              </Link>
            }
          />
          <ul className="divide-y divide-paper-line/70">
            {upcomingExams.length === 0 && (
              <li className="px-5 py-8 text-center text-sm italic text-ink-faint">
                No examinations scheduled for your classes.
              </li>
            )}
            {upcomingExams.map((x) => (
              <li key={x.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="font-semibold text-ink">{x.name} — {x.subject}</p>
                  <p className="text-xs text-ink-faint">{x.class.name} · {fmtDate(x.examDate)}</p>
                </div>
                <Link href="/teacher/exams" className="rounded-sm border border-paper-line px-2.5 py-1 text-xs font-semibold text-ink-soft hover:border-forest hover:text-forest">
                  Enter marks
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
