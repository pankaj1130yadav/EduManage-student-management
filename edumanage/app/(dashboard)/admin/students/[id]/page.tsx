export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader, Card, CardHeader, Badge, Th, Td, EmptyState } from "@/components/ui";
import { inr, fmtDate, gradeFor } from "@/lib/utils";

export default async function StudentDossier({ params }: { params: { id: string } }) {
  const s = await prisma.student.findUnique({
    where: { id: params.id },
    include: {
      class: true,
      user: { select: { email: true } },
      attendance: { orderBy: { date: "desc" }, take: 60 },
      marks: { include: { exam: true }, orderBy: { createdAt: "desc" } },
      fees: { orderBy: { dueDate: "asc" } },
    },
  });
  if (!s) notFound();

  const present = s.attendance.filter((a) => a.status === "PRESENT").length;
  const attPct = s.attendance.length ? Math.round((present / s.attendance.length) * 1000) / 10 : 0;
  const totalObt = s.marks.reduce((a, m) => a + m.marksObtained, 0);
  const totalMax = s.marks.reduce((a, m) => a + m.exam.maxMarks, 0);
  const overallPct = totalMax ? (totalObt / totalMax) * 100 : 0;
  const due = s.fees.filter((f) => f.status !== "PAID").reduce((a, f) => a + (f.amount - f.paidAmount), 0);

  return (
    <div>
      <PageHeader
        title={`${s.firstName} ${s.lastName}`}
        subtitle={`Admission ${s.admissionNo} · ${s.class?.name ?? "Unassigned"}`}
        actions={
          <Link href="/admin/students" className="rounded-sm border border-forest/30 bg-paper-card px-4 py-2 text-sm font-semibold text-forest hover:bg-forest-mist">
            ← Back to register
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { l: "Attendance (recent)", v: `${attPct}%` },
          { l: "Overall score", v: totalMax ? `${overallPct.toFixed(1)}% (${gradeFor(overallPct)})` : "—" },
          { l: "Fee due", v: inr(due) },
          { l: "Login", v: s.user ? s.user.email : "none" },
        ].map((x) => (
          <Card key={x.l} className="p-4">
            <p className="font-display text-2xl font-semibold text-ink">{x.v}</p>
            <p className="mt-1 text-sm text-ink-soft">{x.l}</p>
          </Card>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Personal details" />
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 p-5 text-sm">
            {[
              ["Date of birth", fmtDate(s.dateOfBirth)],
              ["Gender", s.gender],
              ["Phone", s.phone ?? "—"],
              ["Guardian", s.guardianName ?? "—"],
              ["Guardian phone", s.guardianPhone ?? "—"],
              ["Address", s.address ?? "—"],
              ["Admitted", fmtDate(s.admissionDate)],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-[11px] font-semibold uppercase tracking-widest text-ink-faint">{k}</dt>
                <dd className="mt-0.5 font-medium text-ink">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card>
          <CardHeader title="Recent attendance" subtitle="Latest 60 marked days" />
          {s.attendance.length === 0 ? (
            <EmptyState title="No attendance marked yet" />
          ) : (
            <div className="flex flex-wrap gap-1.5 p-5">
              {s.attendance.map((a) => (
                <span
                  key={a.id}
                  title={`${fmtDate(a.date)} — ${a.status}`}
                  className={`h-7 w-7 rounded-[4px] border text-[9px] font-bold leading-7 text-center ${
                    a.status === "PRESENT"
                      ? "border-ledger-green/40 bg-ledger-green/15 text-ledger-green"
                      : a.status === "LEAVE"
                      ? "border-ledger-amber/40 bg-ledger-amber/15 text-ledger-amber"
                      : "border-ledger-red/40 bg-ledger-red/15 text-ledger-red"
                  }`}
                >
                  {a.status[0]}
                </span>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Marks" subtitle="All examinations" />
          {s.marks.length === 0 ? (
            <EmptyState title="No marks entered yet" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr><Th>Exam</Th><Th>Subject</Th><Th>Marks</Th><Th>Grade</Th></tr></thead>
                <tbody>
                  {s.marks.map((m) => {
                    const pct = (m.marksObtained / m.exam.maxMarks) * 100;
                    return (
                      <tr key={m.id}>
                        <Td>{m.exam.name}</Td>
                        <Td className="text-ink-soft">{m.exam.subject}</Td>
                        <Td className="font-semibold">{m.marksObtained}/{m.exam.maxMarks}</Td>
                        <Td><Badge tone={pct >= 60 ? "green" : pct >= 33 ? "amber" : "red"}>{gradeFor(pct)}</Badge></Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Fee ledger" subtitle="Dues and payments" />
          {s.fees.length === 0 ? (
            <EmptyState title="No fee records" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr><Th>Title</Th><Th>Due</Th><Th>Amount</Th><Th>Status</Th></tr></thead>
                <tbody>
                  {s.fees.map((f) => (
                    <tr key={f.id}>
                      <Td>{f.title}</Td>
                      <Td className="text-ink-soft">{fmtDate(f.dueDate)}</Td>
                      <Td className="font-semibold">{inr(f.amount)}</Td>
                      <Td>
                        <Badge tone={f.status === "PAID" ? "green" : f.status === "OVERDUE" ? "red" : "amber"}>
                          {f.status}
                        </Badge>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
