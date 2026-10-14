"use client";

import { useEffect, useState } from "react";
import { api, fmtDate } from "@/lib/utils";
import { PageHeader, Card, CardHeader, Badge, Spinner, EmptyState } from "@/components/ui";
import { Donut } from "@/components/charts";

interface Row {
  id: string;
  date: string;
  status: "PRESENT" | "ABSENT" | "LEAVE";
  remark?: string | null;
}

export default function StudentAttendancePage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ user: { studentId?: string } }>("/api/auth/me").then(async (d) => {
      const sid = d.user.studentId;
      setStudentId(sid ?? null);
      if (sid) {
        const r = await api<{ rows: Row[] }>(`/api/attendance?studentId=${sid}`);
        setRows(r.rows);
      }
      setLoading(false);
    });
  }, []);

  if (loading) return <Spinner />;

  const present = rows.filter((r) => r.status === "PRESENT").length;
  const leave = rows.filter((r) => r.status === "LEAVE").length;
  const pct = rows.length ? Math.round((present / rows.length) * 1000) / 10 : 0;

  // Group by month for a readable ledger
  const byMonth = new Map<string, Row[]>();
  for (const r of rows) {
    const d = new Date(r.date);
    const key = d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
    if (!byMonth.has(key)) byMonth.set(key, []);
    byMonth.get(key)!.push(r);
  }

  return (
    <div>
      <PageHeader title="My Attendance" subtitle="Every day marked for you this session." />

      <div className="grid gap-5 lg:grid-cols-3">
        <Card>
          <CardHeader title="Summary" />
          <div className="p-5">
            <Donut pct={pct} label="present" />
            <div className="mt-4 flex justify-center gap-3 text-xs">
              <Badge tone="green">Present {present}</Badge>
              <Badge tone="red">Absent {rows.length - present - leave}</Badge>
              <Badge tone="amber">Leave {leave}</Badge>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Day ledger" />
          <div className="max-h-[480px] overflow-y-auto p-5">
            {rows.length === 0 ? (
              <EmptyState title="No attendance marked yet" />
            ) : (
              [...byMonth.entries()].map(([month, items]) => (
                <div key={month} className="mb-6">
                  <p className="mb-2 font-display text-sm font-semibold uppercase tracking-[0.2em] text-gold-deep">
                    {month}
                  </p>
                  <ul className="divide-y divide-paper-line/60">
                    {items.map((r) => (
                      <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                        <span className="text-ink-soft">{fmtDate(r.date)}</span>
                        <Badge tone={r.status === "PRESENT" ? "green" : r.status === "LEAVE" ? "amber" : "red"}>
                          {r.status}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
