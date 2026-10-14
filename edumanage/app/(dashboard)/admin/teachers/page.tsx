"use client";

import { useEffect, useState } from "react";
import { api, inr } from "@/lib/utils";
import {
  PageHeader, Card, Button, Field, inputCls, Badge, Th, Td, EmptyState, Spinner,
} from "@/components/ui";

interface Teacher {
  id: string;
  employeeId: string;
  subject: string;
  phone?: string | null;
  qualification?: string | null;
  salary?: number | null;
  user: { id: string; email: string; name: string };
  classes: { id: string; name: string }[];
  classTeacherOf: { id: string; name: string }[];
}

interface ClassRow { id: string; name: string }

const EMPTY = {
  name: "", email: "", password: "", subject: "", phone: "",
  qualification: "", joiningDate: "", salary: "", employeeId: "", classIds: [] as string[],
};

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      const [t, c] = await Promise.all([
        api<{ teachers: Teacher[] }>(`/api/teachers?${params}`),
        api<{ classes: ClassRow[] }>("/api/classes"),
      ]);
      setTeachers(t.teachers);
      setClasses(c.classes);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load teachers");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(load, q ? 350 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function openAdd() {
    setEditing(null); setForm(EMPTY); setError(""); setShowForm(true);
  }

  function openEdit(t: Teacher) {
    setEditing(t);
    setForm({
      ...EMPTY,
      subject: t.subject, phone: t.phone ?? "", qualification: t.qualification ?? "",
      salary: t.salary ? String(t.salary) : "", classIds: t.classes.map((c) => c.id),
    });
    setError(""); setShowForm(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setBusy(true);
    try {
      if (editing) {
        await api(`/api/teachers/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            subject: form.subject, phone: form.phone, qualification: form.qualification,
            salary: form.salary, classIds: form.classIds,
          }),
        });
      } else {
        await api("/api/teachers", { method: "POST", body: JSON.stringify(form) });
      }
      setShowForm(false); load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function remove(t: Teacher) {
    if (!confirm(`Remove ${t.user.name} (${t.employeeId})? Their login will be deactivated.`)) return;
    try {
      await api(`/api/teachers/${t.id}`, { method: "DELETE" });
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    }
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  function toggleClass(id: string) {
    setForm((f) => ({
      ...f,
      classIds: f.classIds.includes(id) ? f.classIds.filter((c) => c !== id) : [...f.classIds, id],
    }));
  }

  return (
    <div>
      <PageHeader
        title="Staff Register"
        subtitle="Teachers, their subjects and class assignments. Every teacher gets a login."
        actions={<Button onClick={openAdd}>+ Add teacher</Button>}
      />

      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-3 p-4">
          <input
            value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, subject or employee ID…"
            className={`${inputCls} max-w-xs`}
          />
          <span className="ml-auto text-sm text-ink-faint">{teachers.length} teachers</span>
        </div>
      </Card>

      <Card>
        {loading ? <Spinner /> : teachers.length === 0 ? (
          <EmptyState title="No teachers on record" body="Add the first teacher to open the staff register." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px]">
              <thead><tr><Th>Employee ID</Th><Th>Name</Th><Th>Subject</Th><Th>Classes</Th><Th>Class teacher of</Th><Th className="text-right">Actions</Th></tr></thead>
              <tbody>
                {teachers.map((t) => (
                  <tr key={t.id} className="transition hover:bg-paper-deep/50">
                    <Td className="font-mono text-xs">{t.employeeId}</Td>
                    <Td>
                      <p className="font-semibold">{t.user.name}</p>
                      <p className="text-xs text-ink-faint">{t.user.email}</p>
                    </Td>
                    <Td><Badge tone="gold">{t.subject}</Badge></Td>
                    <Td className="text-ink-soft">{t.classes.map((c) => c.name).join(", ") || "—"}</Td>
                    <Td className="text-ink-soft">{t.classTeacherOf.map((c) => c.name).join(", ") || "—"}</Td>
                    <Td className="text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEdit(t)} className="rounded-sm border border-paper-line px-2.5 py-1 text-xs font-semibold text-ink-soft hover:border-forest hover:text-forest">Edit</button>
                        <button onClick={() => remove(t)} className="rounded-sm border border-paper-line px-2.5 py-1 text-xs font-semibold text-ledger-red hover:border-ledger-red">Remove</button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/50 p-4">
          <form onSubmit={save} className="my-8 w-full max-w-2xl rounded-sm border border-paper-line bg-paper-card p-6 shadow-ledger">
            <h2 className="font-display text-2xl font-semibold text-ink">
              {editing ? `Edit — ${editing.user.name}` : "New teacher"}
            </h2>
            <p className="mb-5 text-sm text-ink-faint">
              {editing ? "Login email and name cannot be changed here." : "A login is created automatically."}
            </p>
            {error && <p className="mb-4 rounded-sm border border-ledger-red/30 bg-ledger-red/5 px-3 py-2 text-sm text-ledger-red">{error}</p>}

            <div className="grid gap-4 sm:grid-cols-2">
              {!editing && (
                <>
                  <Field label="Full name *"><input required value={form.name} onChange={set("name")} className={inputCls} /></Field>
                  <Field label="Login email *"><input required type="email" value={form.email} onChange={set("email")} className={inputCls} placeholder="name@edumanage.local" /></Field>
                  <Field label="Password *"><input required type="password" value={form.password} onChange={set("password")} className={inputCls} /></Field>
                  <Field label="Employee ID (auto if blank)"><input value={form.employeeId} onChange={set("employeeId")} className={inputCls} /></Field>
                </>
              )}
              <Field label="Subject *"><input required value={form.subject} onChange={set("subject")} className={inputCls} placeholder="Mathematics" /></Field>
              <Field label="Phone"><input value={form.phone} onChange={set("phone")} className={inputCls} /></Field>
              <Field label="Qualification"><input value={form.qualification} onChange={set("qualification")} className={inputCls} placeholder="M.Sc, B.Ed" /></Field>
              <Field label="Joining date"><input type="date" value={form.joiningDate} onChange={set("joiningDate")} className={inputCls} /></Field>
              <Field label="Monthly salary (₹)"><input type="number" min="0" value={form.salary} onChange={set("salary")} className={inputCls} placeholder={inr(45000)} /></Field>
            </div>

            <div className="mt-5">
              <p className="mb-2 text-sm font-semibold text-ink">Assigned classes</p>
              <div className="flex flex-wrap gap-2">
                {classes.map((c) => (
                  <button
                    key={c.id} type="button" onClick={() => toggleClass(c.id)}
                    className={`rounded-sm border px-3 py-1.5 text-sm font-medium transition ${
                      form.classIds.includes(c.id)
                        ? "border-forest bg-forest text-paper"
                        : "border-paper-line bg-paper text-ink-soft hover:border-forest"
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
                {classes.length === 0 && <p className="text-sm italic text-ink-faint">Create classes first.</p>}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" disabled={busy}>{busy ? "Writing…" : editing ? "Save changes" : "Add teacher"}</Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
