"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/utils";
import {
  PageHeader, Card, Button, Field, inputCls, Badge, Th, Td, EmptyState, Spinner,
} from "@/components/ui";

interface Student {
  id: string;
  admissionNo: string;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  phone?: string | null;
  guardianName?: string | null;
  guardianPhone?: string | null;
  address?: string | null;
  classId?: string | null;
  class?: { id: string; name: string } | null;
  user?: { id: string; email: string } | null;
}

interface ClassRow { id: string; name: string }

const EMPTY_FORM = {
  firstName: "", lastName: "", gender: "MALE", dateOfBirth: "",
  classId: "", phone: "", guardianName: "", guardianPhone: "", address: "",
  admissionNo: "", createLogin: false, email: "", password: "",
};

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [q, setQ] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (classFilter) params.set("classId", classFilter);
      const [s, c] = await Promise.all([
        api<{ students: Student[] }>(`/api/students?${params}`),
        api<{ classes: ClassRow[] }>("/api/classes"),
      ]);
      setStudents(s.students);
      setClasses(c.classes);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load students");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(load, q ? 350 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, classFilter]);

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError("");
    setShowForm(true);
  }

  function openEdit(s: Student) {
    setEditing(s);
    setForm({
      ...EMPTY_FORM,
      firstName: s.firstName, lastName: s.lastName, gender: s.gender,
      dateOfBirth: s.dateOfBirth.slice(0, 10), classId: s.classId ?? "",
      phone: s.phone ?? "", guardianName: s.guardianName ?? "",
      guardianPhone: s.guardianPhone ?? "", address: s.address ?? "",
      admissionNo: s.admissionNo,
    });
    setError("");
    setShowForm(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (editing) {
        await api(`/api/students/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify(form),
        });
      } else {
        await api("/api/students", { method: "POST", body: JSON.stringify(form) });
      }
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function remove(s: Student) {
    if (!confirm(`Remove ${s.firstName} ${s.lastName} (${s.admissionNo}) from the roll? This deletes their attendance, marks and fee records.`)) return;
    try {
      await api(`/api/students/${s.id}`, { method: "DELETE" });
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    }
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value }));

  return (
    <div>
      <PageHeader
        title="Student Register"
        subtitle="Admissions, class allocation and dossiers. Teachers can view students of their own classes only."
        actions={<Button onClick={openAdd}>+ Admit student</Button>}
      />

      <Card className="mb-4">
        <div className="flex flex-wrap gap-3 p-4">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name or admission no…"
            className={`${inputCls} max-w-xs`}
          />
          <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className={`${inputCls} max-w-[220px]`}>
            <option value="">All classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <span className="ml-auto self-center text-sm text-ink-faint">
            {students.length} on roll
          </span>
        </div>
      </Card>

      <Card>
        {loading ? <Spinner /> : students.length === 0 ? (
          <EmptyState title="No students found" body="Admit the first student to open this register." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead><tr><Th>Admission No</Th><Th>Name</Th><Th>Class</Th><Th>Guardian</Th><Th>Login</Th><Th className="text-right">Actions</Th></tr></thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="transition hover:bg-paper-deep/50">
                    <Td className="font-mono text-xs">{s.admissionNo}</Td>
                    <Td className="font-semibold">{s.firstName} {s.lastName}</Td>
                    <Td>{s.class ? <Badge tone="gold">{s.class.name}</Badge> : <span className="text-ink-faint">—</span>}</Td>
                    <Td className="text-ink-soft">{s.guardianName ?? "—"}</Td>
                    <Td>{s.user ? <Badge tone="green">active</Badge> : <span className="text-ink-faint text-xs">none</span>}</Td>
                    <Td className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/admin/students/${s.id}`} className="rounded-sm border border-forest/30 px-2.5 py-1 text-xs font-semibold text-forest hover:bg-forest-mist">
                          Dossier
                        </Link>
                        <button onClick={() => openEdit(s)} className="rounded-sm border border-paper-line px-2.5 py-1 text-xs font-semibold text-ink-soft hover:border-forest hover:text-forest">
                          Edit
                        </button>
                        <button onClick={() => remove(s)} className="rounded-sm border border-paper-line px-2.5 py-1 text-xs font-semibold text-ledger-red hover:border-ledger-red">
                          Remove
                        </button>
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
              {editing ? "Edit student record" : "New admission"}
            </h2>
            <p className="mb-5 text-sm text-ink-faint">Fields marked * are required.</p>
            {error && <p className="mb-4 rounded-sm border border-ledger-red/30 bg-ledger-red/5 px-3 py-2 text-sm text-ledger-red">{error}</p>}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="First name *"><input required value={form.firstName} onChange={set("firstName")} className={inputCls} /></Field>
              <Field label="Last name *"><input required value={form.lastName} onChange={set("lastName")} className={inputCls} /></Field>
              <Field label="Gender *">
                <select value={form.gender} onChange={set("gender")} className={inputCls}>
                  <option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option>
                </select>
              </Field>
              <Field label="Date of birth *"><input required type="date" value={form.dateOfBirth} onChange={set("dateOfBirth")} className={inputCls} /></Field>
              <Field label="Class">
                <select value={form.classId} onChange={set("classId")} className={inputCls}>
                  <option value="">— Unassigned —</option>
                  {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="Admission no (auto if blank)"><input value={form.admissionNo} onChange={set("admissionNo")} className={inputCls} placeholder="ADM-2026-0042" /></Field>
              <Field label="Phone"><input value={form.phone} onChange={set("phone")} className={inputCls} /></Field>
              <Field label="Guardian name"><input value={form.guardianName} onChange={set("guardianName")} className={inputCls} /></Field>
              <Field label="Guardian phone"><input value={form.guardianPhone} onChange={set("guardianPhone")} className={inputCls} /></Field>
              <Field label="Address" className="sm:col-span-2"><input value={form.address} onChange={set("address")} className={inputCls} /></Field>
            </div>

            {!editing && (
              <div className="mt-5 rounded-sm border border-dashed border-paper-line bg-paper p-4">
                <label className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <input type="checkbox" checked={form.createLogin} onChange={set("createLogin")} className="h-4 w-4 accent-[#1d4a35]" />
                  Create a student login for this admission
                </label>
                {form.createLogin && (
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <Field label="Login email *"><input type="email" value={form.email} onChange={set("email")} className={inputCls} placeholder="name@edumanage.local" /></Field>
                    <Field label="Password *"><input type="password" value={form.password} onChange={set("password")} className={inputCls} placeholder="password123" /></Field>
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" disabled={busy}>{busy ? "Writing…" : editing ? "Save changes" : "Admit student"}</Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
