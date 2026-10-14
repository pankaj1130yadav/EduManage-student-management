"use client";

import { useEffect, useState } from "react";
import { api, gradeFor } from "@/lib/utils";
import { PageHeader, Card, Badge, Spinner, EmptyState } from "@/components/ui";

interface SubjectRow { subject: string; max: number; obtained: number | null }
interface ExamGroup {
  name: string;
  term: string | null;
  subjects: SubjectRow[];
  totalMax: number;
  totalObtained: number;
  percentage: number;
}

export default function ReportCardPage() {
  const [groups, setGroups] = useState<ExamGroup[]>([]);
  const [studentName, setStudentName] = useState("");
  const [className, setClassName] = useState("");
  const [admissionNo, setAdmissionNo] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ user: { studentId?: string } }>("/api/auth/me").then(async (d) => {
      const sid = d.user.studentId;
      if (sid) {
        const r = await api<{
          student: { firstName: string; lastName: string; admissionNo: string; class?: { name: string } | null };
          reportCard: ExamGroup[];
        }>(`/api/report-card?studentId=${sid}`);
        setGroups(r.reportCard);
        setStudentName(`${r.student.firstName} ${r.student.lastName}`);
        setClassName(r.student.class?.name ?? "");
        setAdmissionNo(r.student.admissionNo);
      }
      setLoading(false);
    });
  }, []);

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="no-print">
        <PageHeader
          title="Report Card"
          subtitle="Your examination results, examination-wise. Use your browser's print to keep a copy."
          actions={
            <button
              onClick={() => window.print()}
              className="rounded-sm bg-forest px-5 py-2.5 text-sm font-semibold text-paper shadow-ledger hover:bg-forest-deep"
            >
              🖨 Print report card
            </button>
          }
        />
      </div>

      {groups.length === 0 ? (
        <Card><EmptyState title="No results published yet" body="Your report card will appear here once marks are entered." /></Card>
      ) : (
        <div className="space-y-6">
          {groups.map((g) => (
            <div key={g.name} className="print-sheet rounded-sm border border-paper-line bg-paper-card p-6 shadow-card md:p-8">
              <div className="border-b-2 border-forest pb-4 text-center">
                <h2 className="font-display text-2xl font-semibold text-ink">EduManage School</h2>
                <p className="text-sm text-ink-soft">
                  {studentName} · {className} · Adm. {admissionNo}
                </p>
                <p className="mt-1 inline-block bg-forest px-4 py-1 font-display text-sm font-semibold uppercase tracking-[0.2em] text-paper">
                  {g.name}{g.term ? ` — ${g.term}` : ""}
                </p>
              </div>

              <table className="mt-4 w-full">
                <thead>
                  <tr className="border-b border-paper-line">
                    <th className="py-2 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-soft">Subject</th>
                    <th className="py-2 text-right text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-soft">Max</th>
                    <th className="py-2 text-right text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-soft">Obtained</th>
                    <th className="py-2 text-right text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-soft">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {g.subjects.map((s) => {
                    const pct = s.obtained !== null ? (s.obtained / s.max) * 100 : null;
                    return (
                      <tr key={s.subject} className="border-b border-paper-line/60">
                        <td className="py-2.5 font-medium text-ink">{s.subject}</td>
                        <td className="py-2.5 text-right text-ink-soft">{s.max}</td>
                        <td className="py-2.5 text-right font-display text-lg font-semibold text-ink">
                          {s.obtained !== null ? s.obtained : "—"}
                        </td>
                        <td className="py-2.5 text-right">
                          {pct !== null ? (
                            <Badge tone={pct >= 60 ? "green" : pct >= 33 ? "amber" : "red"}>{gradeFor(pct)}</Badge>
                          ) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td className="py-3 font-display text-lg font-semibold text-ink">Total</td>
                    <td className="py-3 text-right font-semibold text-ink-soft">{g.totalMax}</td>
                    <td className="py-3 text-right font-display text-xl font-bold text-forest">{g.totalObtained}</td>
                    <td className="py-3 text-right">
                      <span className="font-display text-lg font-semibold text-ink">{g.percentage.toFixed(1)}%</span>{" "}
                      <Badge tone={g.percentage >= 60 ? "green" : g.percentage >= 33 ? "amber" : "red"}>
                        {gradeFor(g.percentage)}
                      </Badge>
                    </td>
                  </tr>
                </tfoot>
              </table>

              <p className="mt-4 text-center text-xs italic text-ink-faint">
                Grading: A+ ≥90 · A ≥80 · B ≥70 · C ≥60 · D ≥50 · E ≥33 · F below 33
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
