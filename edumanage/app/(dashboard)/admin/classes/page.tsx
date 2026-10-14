"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/utils";
import {
  PageHeader, Card, Button, Field, inputCls, Badge, Th, Td, EmptyState, Spinner,
} from "@/components/ui";

interface ClassRow {
  id: string;
  name: string;
  grade: string;
  section: string;
  academicYear: string;
  classTeacher?: { user: { name: string } } | null;
  _count: { students: number };
}

interface TeacherRow {
  id: string;
  user: { name: string };
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", grade: "", section: "", academicYear: "2026-27", classTeacherId: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [c, t] = await Promise.all([
        api<{ classes: ClassRow[] }>("/api/classes"),
        api<{ teachers: TeacherRow[] }>("/api/teachers"),
      ]);
      setClasses(c.classes);
      setTeachers(t.teachers);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load classes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setBusy(true);
    try {
      await api("/api/classes", { method: "POST", body: JSON.stringify(form) });
      setShowForm(false);
      setForm({ name: "", grade: "", section: "", academicYear: "2026-27", classTeacherId: "" });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Classes"
        subtitle="Sections of the school for this academic session."
        actions={<Button onClick={() => { setError(""); setShowForm(true); }}>+ New class</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <Card className="sm:col-span-2 lg:col-span-3"><Spinner /></Card>
        ) : classes.length === 0 ? (
          <Card className="sm:col-span-2 lg:col-span-3">
            <EmptyState title="No classes yet" body="Create the first class to start admitting students." />
          </Card>
        ) : (
          classes.map((c) => (
            <Card key={c.id} className="border-t-4 border-t-gold-soft p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display text-2xl font-semibold text-ink">{c.name}</h3>
                  <p className="text-sm text-ink-faint">
                    Grade {c.grade} · Section {c.section} · {c.academicYear}
                  </p>
                </div>
                <Badge tone="green">{c._count.students} students</Badge>
              </div>
              <p className="mt-3 text-sm text-ink-soft">
                Class teacher:{" "}
                <span className="font-semibold text-ink">
                  {c.classTeacher?.user.name ?? "Not assigned"}
                </span>
              </p>
            </Card>
          ))
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/50 p-4">
          <form onSubmit={save} className="my-8 w-full max-w-lg rounded-sm border border-paper-line bg-paper-card p-6 shadow-ledger">
            <h2 className="font-display text-2xl font-semibold text-ink">New class</h2>
            <p className="mb-5 text-sm text-ink-faint">Fields marked * are required.</p>
            {error && <p className="mb-4 rounded-sm border border-ledger-red/30 bg-ledger-red/5 px-3 py-2 text-sm text-ledger-red">{error}</p>}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Class name *"><input required value={form.name} onChange={set("name")} className={inputCls} placeholder="Class 10-A" /></Field>
              <Field label="Grade *"><input required value={form.grade} onChange={set("grade")} className={inputCls} placeholder="10" /></Field>
              <Field label="Section *"><input required value={form.section} onChange={set("section")} className={inputCls} placeholder="A" /></Field>
              <Field label="Academic year"><input value={form.academicYear} onChange={set("academicYear")} className={inputCls} /></Field>
              <Field label="Class teacher" className="sm:col-span-2">
                <select value={form.classTeacherId} onChange={set("classTeacherId")} className={inputCls}>
                  <option value="">— Not assigned —</option>
                  {teachers.map((t) => <option key={t.id} value={t.id}>{t.user.name}</option>)}
                </select>
              </Field>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" disabled={busy}>{busy ? "Writing…" : "Create class"}</Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
