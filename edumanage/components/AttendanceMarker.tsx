"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api, todayISO, fmtDate } from "@/lib/utils";
import {
  Card, CardHeader, Button, Field, inputCls, Badge, EmptyState, Spinner,
} from "@/components/ui";

interface StudentRow {
  id: string;
  firstName: string;
  lastName: string;
  admissionNo: string;
  attendance: { id: string; status: "PRESENT" | "ABSENT" | "LEAVE"; remark?: string | null } | null;
}

interface ClassRow { id: string; name: string }

type Status = "PRESENT" | "ABSENT" | "LEAVE";

export default function AttendanceMarker({ title, subtitle }: { title: string; subtitle: string }) {
  const searchParams = useSearchParams();
  const preselect = searchParams.get("class");
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [mine, setMine] = useState<string[]>([]);
  const [classId, setClassId] = useState("");
  const [date, setDate] = useState(todayISO());
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [marks, setMarks] = useState<Record<string, Status>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ classes: ClassRow[]; mine?: string[] }>("/api/classes")
      .then((d) => {
        setClasses(d.classes);
        setMine(d.mine ?? []);
        if (d.classes.length > 0 && !classId) {
          const pre = preselect && d.classes.some((c) => c.id === preselect) ? preselect : null;
          setClassId(pre ?? (d.mine && d.mine.length > 0 ? d.mine[0] : d.classes[0].id));
        }
      })
      .catch(() => setError("Could not load classes"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadDay() {
    if (!classId || !date) return;
    setLoading(true);
    setError(""); setMessage("");
    try {
      const d = await api<{ students: StudentRow[] }>(
        `/api/attendance?classId=${classId}&date=${date}`
      );
      setStudents(d.students);
      const m: Record<string, Status> = {};
      d.students.forEach((s) => {
        m[s.id] = s.attendance?.status ?? "PRESENT";
      });
      setMarks(m);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load attendance");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (classId && date) loadDay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, date]);

  function markAll(status: Status) {
    const m: Record<string, Status> = {};
    students.forEach((s) => { m[s.id] = status; });
    setMarks(m);
  }

  async function save() {
    setSaving(true);
    setError(""); setMessage("");
    try {
      await api("/api/attendance", {
        method: "POST",
        body: JSON.stringify({
          classId,
          date,
          entries: students.map((s) => ({ studentId: s.id, status: marks[s.id] ?? "PRESENT" })),
        }),
      });
      setMessage(`Attendance for ${fmtDate(date)} saved — ${students.length} students marked.`);
      loadDay();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save attendance");
    } finally {
      setSaving(false);
    }
  }

  const counts = { PRESENT: 0, ABSENT: 0, LEAVE: 0 };
  students.forEach((s) => { counts[marks[s.id] ?? "PRESENT"]++; });

  const statusBtn = (s: StudentRow, st: Status, label: string) => (
    <button
      key={st}
      type="button"
      onClick={() => setMarks((m) => ({ ...m, [s.id]: st }))}
      className={`flex-1 rounded-sm border px-2 py-1.5 text-xs font-bold transition sm:flex-none sm:px-4 ${
        (marks[s.id] ?? "PRESENT") === st
          ? st === "PRESENT"
            ? "border-ledger-green bg-ledger-green text-white"
            : st === "ABSENT"
            ? "border-ledger-red bg-ledger-red text-white"
            : "border-ledger-amber bg-ledger-amber text-white"
          : "border-paper-line bg-paper text-ink-faint hover:border-ink-faint"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div>
      <div className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-gold-deep">EduManage Ledger</p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-ink md:text-4xl">{title}</h1>
        <p className="mt-1.5 max-w-2xl text-ink-soft">{subtitle}</p>
      </div>

      <Card className="mb-4">
        <div className="flex flex-wrap items-end gap-4 p-4">
          <Field label="Class">
            <select value={classId} onChange={(e) => setClassId(e.target.value)} className={`${inputCls} min-w-[180px]`}>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}{mine.includes(c.id) ? " ★" : ""}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Date">
            <input type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} className={inputCls} />
          </Field>
          <div className="ml-auto flex gap-2 pb-0.5">
            <Button variant="secondary" onClick={() => markAll("PRESENT")}>All present</Button>
            <Button variant="secondary" onClick={() => markAll("ABSENT")}>All absent</Button>
            <Button onClick={save} disabled={saving || students.length === 0}>
              {saving ? "Saving…" : "Save attendance"}
            </Button>
          </div>
        </div>
        {message && <p className="border-t border-paper-line bg-ledger-green/5 px-4 py-2.5 text-sm font-medium text-ledger-green">{message}</p>}
        {error && <p className="border-t border-paper-line bg-ledger-red/5 px-4 py-2.5 text-sm font-medium text-ledger-red">{error}</p>}
      </Card>

      <Card>
        <CardHeader
          title={`Roll — ${fmtDate(date)}`}
          subtitle={`${students.length} students`}
          action={
            <div className="flex gap-2 text-xs">
              <Badge tone="green">Present: {counts.PRESENT}</Badge>
              <Badge tone="red">Absent: {counts.ABSENT}</Badge>
              <Badge tone="amber">Leave: {counts.LEAVE}</Badge>
            </div>
          }
        />
        {loading ? <Spinner /> : students.length === 0 ? (
          <EmptyState title="No students in this class" body="Admit students to this class first." />
        ) : (
          <ul className="divide-y divide-paper-line/70">
            {students.map((s, i) => (
              <li key={s.id} className="flex flex-col gap-3 px-5 py-3.5 transition hover:bg-paper-deep/40 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-forest-mist font-display text-sm font-bold text-forest">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">{s.firstName} {s.lastName}</p>
                    <p className="font-mono text-xs text-ink-faint">{s.admissionNo}</p>
                  </div>
                  {s.attendance && (
                    <span className="ml-1 hidden text-[11px] italic text-ink-faint sm:inline">
                      previously: {s.attendance.status.toLowerCase()}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  {statusBtn(s, "PRESENT", "Present")}
                  {statusBtn(s, "ABSENT", "Absent")}
                  {statusBtn(s, "LEAVE", "Leave")}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
