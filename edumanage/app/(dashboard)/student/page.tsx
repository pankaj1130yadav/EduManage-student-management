export const dynamic = "force-dynamic";

import { getSession, loadSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PageHeader, Card, CardHeader, Badge } from "@/components/ui";
import { Donut } from "@/components/charts";
import { inr, fmtDate, gradeFor } from "@/lib/utils";

export default async function StudentRecord() {
  const raw = getSession();
  if (!raw) redirect("/login");
  const session = await loadSessionUser(raw);
  if (!session.studentId) redirect("/login");

  const s = await prisma.student.findUnique({
    where: { id: session.studentId },
    include: {
      class: true,
      attendance: { orderBy: { date: "desc" }, take: 90 },
      marks: { include: { exam: true }, orderBy: { createdAt: "desc" }, take: 12 },
      fees: { where: { status: { not: "PAID" } }, orderBy: { dueDate: "asc" } },
    },
  });
  if (!s) redirect("/login");

  const present = s.attendance.filter((a) => a.status === "PRESENT").length;
  const attPct = s.attendance.length ? Math.round((present / s.attendance.length) * 1000) / 10 : 0;
  const totalObt = s.marks.reduce((a, m) => a + m.marksObtained, 0);
  const totalMax = s.marks.reduce((a, m) => a + m.exam.maxMarks, 0);
  const overallPct = totalMax ? (totalObt / totalMax) * 100 : 0;
  const due = s.fees.reduce((a, f) => a + (f.amount - f.paidAmount), 0);

  return (
    <div>
      <PageHeader
        title={`Hello, ${s.firstName}`}
        subtitle={`${s.class?.name ?? "Unassigned"} · Admission ${s.admissionNo} — your record for the 2026–27 session.`}
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <CardHeader title="Attendance" subtitle="Last 90 marked days" action={
            <Link href="/student/attendance" className="text-sm font-semibold text-forest underline underline-offset-4">Full record →</Link>
          } />
          <div className="p-5"><Donut pct={attPct} label={`${present}/${s.attendance.length} present`} /></div>
        </Card>

        <Card>
          <CardHeader title="Academics" subtitle="Recent examinations" action={
            <Link href="/student/report-card" className="text-sm font-semibold text-forest underline underline-offset-4">Report card →</Link>
          } />
          <div className="p-5">
            {s.marks.length === 0 ? (
              <p className="py-6 text-center text-sm italic text-ink-faint">No marks yet.</p>
            ) : (
              <>
                <p className="font-display text-4xl font-semibold text-ink">
                  {overallPct.toFixed(1)}%
                </p>
                <p className="mt-1 text-sm text-ink-soft">
                  Overall across recent exams · grade <Badge tone={overallPct >= 60 ? "green" : overallPct >= 33 ? "amber" : "red"}>{gradeFor(overallPct)}</Badge>
                </p>
                <ul className="mt-4 space-y-2">
                  {s.marks.slice(0, 4).map((m) => (
                    <li key={m.id} className="flex justify-between border-b border-dashed border-paper-line pb-2 text-sm">
                      <span className="text-ink-soft">{m.exam.subject}</span>
                      <span className="font-semibold text-ink">{m.marksObtained}/{m.exam.maxMarks}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Fee dues" action={
            <Link href="/student/fees" className="text-sm font-semibold text-forest underline underline-offset-4">Fee ledger →</Link>
          } />
          <div className="p-5">
            <p className={`font-display text-4xl font-semibold ${due > 0 ? "text-ledger-red" : "text-ledger-green"}`}>
              {inr(due)}
            </p>
            <p className="mt-1 text-sm text-ink-soft">
              {due > 0 ? `${s.fees.length} unpaid head${s.fees.length > 1 ? "s" : ""}` : "All clear — nothing due."}
            </p>
            {s.fees.length > 0 && (
              <ul className="mt-4 space-y-2">
                {s.fees.slice(0, 3).map((f) => (
                  <li key={f.id} className="flex justify-between border-b border-dashed border-paper-line pb-2 text-sm">
                    <span className="text-ink-soft">{f.title}<br /><span className="text-xs text-ink-faint">due {fmtDate(f.dueDate)}</span></span>
                    <span className="font-semibold text-ink">{inr(f.amount - f.paidAmount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </div>

      <Card className="mt-5">
        <CardHeader title="Personal details" />
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 p-5 text-sm sm:grid-cols-4">
          {[
            ["Date of birth", fmtDate(s.dateOfBirth)],
            ["Class", s.class?.name ?? "—"],
            ["Guardian", s.guardianName ?? "—"],
            ["Guardian phone", s.guardianPhone ?? "—"],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="text-[11px] font-semibold uppercase tracking-widest text-ink-faint">{k}</dt>
              <dd className="mt-0.5 font-medium text-ink">{v}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  );
}
