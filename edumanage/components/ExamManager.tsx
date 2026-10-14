"use client";

import { useEffect, useState } from "react";
import { api, fmtDate } from "@/lib/utils";
import {
  Card, CardHeader, Button, Field, inputCls, Badge, Th, Td, EmptyState, Spinner,
} from "@/components/ui";

interface ExamRow {
  id: string;
  name: string;
  subject: string;
  maxMarks: number;
  examDate: string;
  term?: string | null;
  class: { id: string; name: string };
  _count: { marks: number };
}

interface StudentMark {
  id: string;
  firstName: string;
  lastName: string;
  admissionNo: string;
  mark: { marksObtained: number; remark?: string | null } | null;
}

interface ClassRow { id: string; name: string }

const EMPTY_EXAM = { name: "", classId: "", subject: "", maxMarks: "100", examDate: "", term: "" };

export default function ExamManager({ title, subtitle }: { title: string; subtitle: string }) {
  const [exams, setExams] = useState<ExamRow[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [classFilter, setClassFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_EXAM);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // marks drawer
  const [activeExam, setActiveExam] = useState<ExamRow | null>(null);
  const [marks, setMarks] = useState<StudentMark[]>([]);
  const [markVals, setMarkVals] = useState<Record<string, string>>({});
  const [marksLoading, setMarksLoading] = useState(false);
  const [marksSaved, setMarksSaved] = useState("");

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (classFilter) params.set("classId", classFilter);
      const [e, c] = await Promise.all([
        api<{ exams: ExamRow[] }>(`/api/exams?${params}`),
        api<{ classes: ClassRow[] }>("/api/classes"),
      ]);
      setExams(e.exams);
      setClasses(c.classes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load exams");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [classFilter]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function createExam(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setBusy(true);
    try {
      const created = await api<{ exam: ExamRow }>("/api/exams", {
        method: "POST",
        body: JSON.stringify({ ...form, maxMarks: Number(form.maxMarks) || 100 }),
      });
      setShowForm(false);
      setForm(EMPTY_EXAM);
      setClassFilter(created.exam.class.id);
      openMarks(created.exam);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create exam");
    } finally {
      setBusy(false);
    }
  }

  async function openMarks(exam: ExamRow) {
    setActiveExam(exam);
    setMarksSaved("");
    setMarksLoading(true);
    try {
      const d = await api<{ students: StudentMark[] }>(`/api/exams/${exam.id}/marks`);
      setMarks(d.students);
      const v: Record<string, string> = {};
      d.students.forEach((s) => { v[s.id] = s.mark ? String(s.mark.marksObtained) : ""; });
      setMarkVals(v);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load marks");
    } finally {
      setMarksLoading(false);
    }
  }

  async function saveMarks() {
    if (!activeExam) return;
    setBusy(true);
    setMarksSaved("");
    try {
      const entries = marks.map((s) => ({
        studentId: s.id,
        marksObtained: markVals[s.id] === "" ? null : Number(markVals[s.id]),
      })).filter((e) => e.marksObtained !== null);
      await api(`/api/exams/${activeExam.id}/marks`, {
        method: "POST",
        body: JSON.stringify({ entries }),
      });
      setMarksSaved(`Marks saved for ${entries.length} students.`);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save marks");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-gold-deep">EduManage Ledger</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-ink md:text-4xl">{title}</h1>
          <p className="mt-1.5 max-w-2xl text-ink-soft">{subtitle}</p>
        </div>
        <Button onClick={() => { setError(""); setForm(EMPTY_EXAM); setShowForm(true); }}>+ New exam</Button>
      </div>

      <Card className="mb-4">
        <div className="flex items-center gap-3 p-4">
          <Field label="">
            <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className={`${inputCls} max-w-[220px]`}>
              <option value="">All classes</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <span className="ml-auto text-sm text-ink-faint">{exams.length} exams</span>
        </div>
      </Card>

      <Card>
        {loading ? <Spinner /> : exams.length === 0 ? (
          <EmptyState title="No examinations scheduled" body="Create the first exam to open the gradebook." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead><tr><Th>Examination</Th><Th>Class</Th><Th>Subject</Th><Th>Date</Th><Th>Marks entered</Th><Th className="text-right">Gradebook</Th></tr></thead>
              <tbody>
                {exams.map((x) => (
                  <tr key={x.id} className="transition hover:bg-paper-deep/50">
                    <Td>
                      <p className="font-semibold">{x.name}</p>
                      {x.term && <p className="text-xs text-ink-faint">{x.term}</p>}
                    </Td>
                    <Td><Badge tone="gold">{x.class.name}</Badge></Td>
                    <Td>{x.subject}</Td>
                    <Td className="text-ink-soft">{fmtDate(x.examDate)}</Td>
                    <Td>
                      <Badge tone={x._count.marks > 0 ? "green" : "neutral"}>{x._count.marks}</Badge>
                    </Td>
                    <Td className="text-right">
                      <Button variant="secondary" onClick={() => openMarks(x)}>Enter marks</Button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* New exam modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/50 p-4">
          <form onSubmit={createExam} className="my-8 w-full max-w-lg rounded-sm border border-paper-line bg-paper-card p-6 shadow-ledger">
            <h2 className="font-display text-2xl font-semibold text-ink">Schedule examination</h2>
            <p className="mb-5 text-sm text-ink-faint">One row per subject — e.g. “Mid-Term” × Mathematics.</p>
            {error && <p className="mb-4 rounded-sm border border-ledger-red/30 bg-ledger-red/5 px-3 py-2 text-sm text-ledger-red">{error}</p>}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Exam name *"><input required value={form.name} onChange={set("name")} className={inputCls} placeholder="Mid-Term Examination" /></Field>
              <Field label="Term"><input value={form.term} onChange={set("term")} className={inputCls} placeholder="Term 1" /></Field>
              <Field label="Class *">
                <select required value={form.classId} onChange={set("classId")} className={inputCls}>
                  <option value="">— Select —</option>
                  {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="Subject *"><input required value={form.subject} onChange={set("subject")} className={inputCls} placeholder="Mathematics" /></Field>
              <Field label="Max marks *"><input required type="number" min="1" value={form.maxMarks} onChange={set("maxMarks")} className={inputCls} /></Field>
              <Field label="Exam date *"><input required type="date" value={form.examDate} onChange={set("examDate")} className={inputCls} /></Field>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" disabled={busy}>{busy ? "Writing…" : "Schedule exam"}</Button>
            </div>
          </form>
        </div>
      )}

      {/* Marks drawer */}
      {activeExam && (
        <div className="fixed inset-0 z-50 flex justify-end bg-ink/50">
          <div className="flex h-full w-full max-w-xl flex-col bg-paper-card shadow-ledger">
            <div className="border-b border-paper-line p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl font-semibold text-ink">Gradebook</h2>
                  <p className="text-sm text-ink-soft">
                    {activeExam.name} · {activeExam.subject} · {activeExam.class.name} · max {activeExam.maxMarks}
                  </p>
                </div>
                <button onClick={() => setActiveExam(null)} className="rounded-sm border border-paper-line px-2.5 py-1 text-sm font-semibold text-ink-soft hover:border-ledger-red hover:text-ledger-red">
                  Close ✕
                </button>
              </div>
              {marksSaved && <p className="mt-2 text-sm font-medium text-ledger-green">{marksSaved}</p>}
            </div>
            <div className="flex-1 overflow-y-auto">
              {marksLoading ? <Spinner /> : marks.length === 0 ? (
                <EmptyState title="No students in this class" />
              ) : (
                <table className="w-full">
                  <thead><tr><Th>Student</Th><Th className="w-32">Marks</Th><Th className="w-20">%</Th></tr></thead>
                  <tbody>
                    {marks.map((s) => {
                      const v = markVals[s.id];
                      const pct = v !== "" && !isNaN(Number(v)) ? Math.round((Number(v) / activeExam.maxMarks) * 100) : null;
                      return (
                        <tr key={s.id}>
                          <Td>
                            <p className="font-medium">{s.firstName} {s.lastName}</p>
                            <p className="font-mono text-xs text-ink-faint">{s.admissionNo}</p>
                          </Td>
                          <Td>
                            <input
                              type="number" min="0" max={activeExam.maxMarks} step="0.5"
                              value={v}
                              onChange={(e) => setMarkVals((m) => ({ ...m, [s.id]: e.target.value }))}
                              className={`${inputCls} text-center font-semibold`}
                              placeholder="—"
                            />
                          </Td>
                          <Td className="text-sm font-semibold text-ink-soft">{pct !== null ? `${pct}%` : "—"}</Td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
            <div className="border-t border-paper-line p-4">
              <Button onClick={saveMarks} disabled={busy} className="w-full">
                {busy ? "Saving…" : "Save all marks"}
              </Button>
              <p className="mt-2 text-center text-xs text-ink-faint">
                Marks are clamped to 0 – {activeExam.maxMarks}. Blank rows are skipped.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
