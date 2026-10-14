export const dynamic = "force-dynamic";

import { getSession, loadSessionUser } from "@/lib/auth";
import { getAnalyticsData } from "@/lib/analytics";
import { PageHeader, Card, CardHeader, Badge } from "@/components/ui";
import { BarChart, Donut, HBar } from "@/components/charts";
import { inr } from "@/lib/utils";
import Link from "next/link";

export default async function AdminOverview() {
  const raw = getSession();
  const session = raw ? await loadSessionUser(raw) : null;
  const data = await getAnalyticsData();

  const stats = [
    { label: "Students on roll", value: data.counts.students, href: "/admin/students" },
    { label: "Teaching staff", value: data.counts.teachers, href: "/admin/teachers" },
    { label: "Classes", value: data.counts.classes, href: "/admin/classes" },
    { label: "Fee collected", value: inr(data.fees.collected), href: "/admin/fees" },
  ];

  return (
    <div>
      <PageHeader
        title={`Good day, ${session?.name.split(" ")[0] ?? "Principal"}`}
        subtitle="The school at a glance — rolls, attendance and the fee books for this session."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="border-t-4 border-t-forest p-5 transition hover:-translate-y-0.5 hover:shadow-ledger">
              <p className="font-display text-3xl font-semibold text-ink">{s.value}</p>
              <p className="mt-1 text-sm font-medium text-ink-soft">{s.label}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Fee collection"
            subtitle="Rupees collected each month — last six months"
          />
          <div className="p-5">
            {data.monthlyCollection.length > 0 ? (
              <BarChart
                data={data.monthlyCollection.map((m: { label: string; amount: number }) => ({
                  label: m.label,
                  value: m.amount,
                }))}
                formatY={(v) => (v >= 1000 ? `₹${Math.round(v / 1000)}k` : `₹${v}`)}
              />
            ) : (
              <p className="py-8 text-center text-sm italic text-ink-faint">
                No collections recorded yet this session.
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-dashed border-paper-line pt-4 text-sm">
              <span className="text-ink-soft">
                Billed: <strong className="text-ink">{inr(data.fees.billed)}</strong>
              </span>
              <span className="text-ink-soft">
                Outstanding: <strong className="text-ledger-red">{inr(data.fees.outstanding)}</strong>
              </span>
              {Object.entries(data.fees.byStatus as Record<string, number>).map(([k, v]) => (
                <Badge key={k} tone={k === "PAID" ? "green" : k === "OVERDUE" ? "red" : "amber"}>
                  {k}: {v}
                </Badge>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Attendance" subtitle="Last 30 days, all classes" />
          <div className="flex flex-col items-center gap-4 p-5">
            <Donut pct={data.attendancePct} label="present" />
            <p className="text-center text-xs text-ink-faint">
              Share of marked days on which students were present.
            </p>
          </div>
        </Card>
      </div>

      <Card className="mt-5">
        <CardHeader title="Attendance by class" subtitle="Last 30 days" />
        <div className="space-y-3 p-5">
          {data.attendanceByClass.length > 0 ? (
            data.attendanceByClass.map((c: { name: string; pct: number }) => (
              <HBar key={c.name} label={c.name} pct={c.pct} />
            ))
          ) : (
            <p className="py-6 text-center text-sm italic text-ink-faint">
              No attendance marked yet.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
