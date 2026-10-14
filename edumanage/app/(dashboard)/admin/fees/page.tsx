"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, inr, fmtDate } from "@/lib/utils";
import {
  PageHeader, Card, Button, Field, inputCls, Badge, Th, Td, EmptyState, Spinner,
} from "@/components/ui";

interface FeeRecord {
  id: string;
  title: string;
  amount: number;
  paidAmount: number;
  dueDate: string;
  status: "PENDING" | "PAID" | "OVERDUE";
  paymentMode?: string | null;
  receiptNo?: string | null;
  paidAt?: string | null;
  student: { id: string; firstName: string; lastName: string; admissionNo: string };
}

interface StudentRow {
  id: string;
  firstName: string;
  lastName: string;
  admissionNo: string;
  class?: { name: string } | null;
}

const EMPTY_FEE = { studentId: "", title: "", amount: "", dueDate: "", academicYear: "2026-27" };

export default function FeeBooksPage() {
  const [records, setRecords] = useState<FeeRecord[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newFee, setNewFee] = useState(EMPTY_FEE);
  const [payFor, setPayFor] = useState<FeeRecord | null>(null);
  const [payAmt, setPayAmt] = useState("");
  const [payMode, setPayMode] = useState("UPI");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      const [f, s] = await Promise.all([
        api<{ records: FeeRecord[] }>(`/api/fees?${params}`),
        api<{ students: StudentRow[] }>("/api/students"),
      ]);
      setRecords(f.records);
      setStudents(s.students);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load fee records");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [status]);

  const filtered = records.filter((r) =>
    q === "" ||
    `${r.student.firstName} ${r.student.lastName}`.toLowerCase().includes(q.toLowerCase()) ||
    r.student.admissionNo.toLowerCase().includes(q.toLowerCase()) ||
    (r.receiptNo ?? "").toLowerCase().includes(q.toLowerCase())
  );

  const outstanding = filtered.filter((r) => r.status !== "PAID").reduce((a, r) => a + (r.amount - r.paidAmount), 0);
  const collected = filtered.filter((r) => r.status === "PAID").reduce((a, r) => a + r.paidAmount, 0);

  async function createFee(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setBusy(true);
    try {
      await api("/api/fees", { method: "POST", body: JSON.stringify({ ...newFee, amount: Number(newFee.amount) }) });
      setShowNew(false);
      setNewFee(EMPTY_FEE);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create fee record");
    } finally {
      setBusy(false);
    }
  }

  async function recordPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!payFor) return;
    setError(""); setBusy(true);
    try {
      const updated = await api<{ record: FeeRecord }>(`/api/fees/${payFor.id}/pay`, {
        method: "POST",
        body: JSON.stringify({ paidAmount: Number(payAmt), paymentMode: payMode }),
      });
      setPayFor(null);
      load();
      window.location.href = `/admin/fees/receipt/${updated.record.id}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not record payment");
    } finally {
      setBusy(false);
    }
  }

  async function remove(r: FeeRecord) {
    if (!confirm(`Delete the unpaid fee record "${r.title}" for ${r.student.firstName} ${r.student.lastName}?`)) return;
    try {
      await api(`/api/fees/${r.id}`, { method: "DELETE" });
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    }
  }

  const setN = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setNewFee((f) => ({ ...f, [k]: e.target.value }));

  const tone = (s: string) => (s === "PAID" ? "green" : s === "OVERDUE" ? "red" : "amber") as "green" | "red" | "amber";

  return (
    <div>
      <PageHeader
        title="Fee Books"
        subtitle="Dues, payments and printable receipts — all amounts in Indian rupees."
        actions={<Button onClick={() => { setError(""); setNewFee(EMPTY_FEE); setShowNew(true); }}>+ New fee record</Button>}
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <Card className="p-4"><p className="font-display text-2xl font-semibold text-ledger-green">{inr(collected)}</p><p className="text-sm text-ink-soft">Collected (in view)</p></Card>
        <Card className="p-4"><p className="font-display text-2xl font-semibold text-ledger-red">{inr(outstanding)}</p><p className="text-sm text-ink-soft">Outstanding (in view)</p></Card>
        <Card className="p-4"><p className="font-display text-2xl font-semibold text-ink">{filtered.length}</p><p className="text-sm text-ink-soft">Records (in view)</p></Card>
      </div>

      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-3 p-4">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search student, admission no, receipt…" className={`${inputCls} max-w-xs`} />
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${inputCls} max-w-[200px]`}>
            <option value="">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="OVERDUE">Overdue</option>
            <option value="PAID">Paid</option>
          </select>
        </div>
      </Card>

      {error && !showNew && !payFor && (
        <p className="mb-4 rounded-sm border border-ledger-red/30 bg-ledger-red/5 px-3 py-2 text-sm text-ledger-red">{error}</p>
      )}

      <Card>
        {loading ? <Spinner /> : filtered.length === 0 ? (
          <EmptyState title="No fee records" body="Create the first fee record to open the fee books." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px]">
              <thead><tr><Th>Student</Th><Th>Fee head</Th><Th>Due date</Th><Th className="text-right">Amount</Th><Th>Status</Th><Th className="text-right">Actions</Th></tr></thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="transition hover:bg-paper-deep/50">
                    <Td>
                      <p className="font-semibold">{r.student.firstName} {r.student.lastName}</p>
                      <p className="font-mono text-xs text-ink-faint">{r.student.admissionNo}</p>
                    </Td>
                    <Td>{r.title}</Td>
                    <Td className="text-ink-soft">{fmtDate(r.dueDate)}</Td>
                    <Td className="text-right font-semibold">
                      {inr(r.amount)}
                      {r.status === "PAID" && r.paidAmount !== r.amount && (
                        <span className="block text-xs font-normal text-ink-faint">paid {inr(r.paidAmount)}</span>
                      )}
                    </Td>
                    <Td>
                      <Badge tone={tone(r.status)}>{r.status}</Badge>
                      {r.receiptNo && <p className="mt-1 font-mono text-[11px] text-ink-faint">{r.receiptNo}</p>}
                    </Td>
                    <Td className="text-right">
                      <div className="flex justify-end gap-2">
                        {r.status !== "PAID" ? (
                          <button
                            onClick={() => { setPayFor(r); setPayAmt(String(r.amount)); setPayMode("UPI"); setError(""); }}
                            className="rounded-sm bg-forest px-2.5 py-1 text-xs font-semibold text-paper hover:bg-forest-deep"
                          >
                            Record payment
                          </button>
                        ) : (
                          <Link href={`/admin/fees/receipt/${r.id}`} className="rounded-sm border border-gold-deep/40 bg-gold-mist px-2.5 py-1 text-xs font-semibold text-gold-deep hover:opacity-80">
                            Receipt
                          </Link>
                        )}
                        {r.status !== "PAID" && (
                          <button onClick={() => remove(r)} className="rounded-sm border border-paper-line px-2.5 py-1 text-xs font-semibold text-ledger-red hover:border-ledger-red">
                            Delete
                          </button>
                        )}
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* New fee modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/50 p-4">
          <form onSubmit={createFee} className="my-8 w-full max-w-lg rounded-sm border border-paper-line bg-paper-card p-6 shadow-ledger">
            <h2 className="font-display text-2xl font-semibold text-ink">New fee record</h2>
            <p className="mb-5 text-sm text-ink-faint">Raise a due against a student.</p>
            {error && <p className="mb-4 rounded-sm border border-ledger-red/30 bg-ledger-red/5 px-3 py-2 text-sm text-ledger-red">{error}</p>}
            <div className="grid gap-4">
              <Field label="Student *">
                <select required value={newFee.studentId} onChange={setN("studentId")} className={inputCls}>
                  <option value="">— Select student —</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} · {s.admissionNo}{s.class ? ` · ${s.class.name}` : ""}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Fee head *"><input required value={newFee.title} onChange={setN("title")} className={inputCls} placeholder="Tuition Fee — Term 2" /></Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Amount (₹) *"><input required type="number" min="1" value={newFee.amount} onChange={setN("amount")} className={inputCls} placeholder="12500" /></Field>
                <Field label="Due date *"><input required type="date" value={newFee.dueDate} onChange={setN("dueDate")} className={inputCls} /></Field>
              </div>
              <Field label="Academic year"><input value={newFee.academicYear} onChange={setN("academicYear")} className={inputCls} /></Field>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button type="submit" disabled={busy}>{busy ? "Writing…" : "Raise fee"}</Button>
            </div>
          </form>
        </div>
      )}

      {/* Record payment modal */}
      {payFor && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/50 p-4">
          <form onSubmit={recordPayment} className="my-8 w-full max-w-md rounded-sm border border-paper-line bg-paper-card p-6 shadow-ledger">
            <h2 className="font-display text-2xl font-semibold text-ink">Record payment</h2>
            <p className="mb-5 text-sm text-ink-faint">
              {payFor.title} — {payFor.student.firstName} {payFor.student.lastName} ({payFor.student.admissionNo})
            </p>
            {error && <p className="mb-4 rounded-sm border border-ledger-red/30 bg-ledger-red/5 px-3 py-2 text-sm text-ledger-red">{error}</p>}
            <div className="grid gap-4">
              <Field label={`Amount received (₹) — due ${inr(payFor.amount)}`}>
                <input required type="number" min="1" value={payAmt} onChange={(e) => setPayAmt(e.target.value)} className={`${inputCls} font-display text-xl font-semibold`} />
              </Field>
              <Field label="Mode of payment">
                <select value={payMode} onChange={(e) => setPayMode(e.target.value)} className={inputCls}>
                  <option value="UPI">UPI</option>
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">Bank transfer</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </Field>
            </div>
            <p className="mt-4 rounded-sm bg-gold-mist/70 px-3 py-2 text-xs text-gold-deep">
              A receipt number (e.g. RCP-2026-482913) is issued automatically and a printable receipt opens next.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setPayFor(null)}>Cancel</Button>
              <Button type="submit" disabled={busy}>{busy ? "Recording…" : "Record & open receipt"}</Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
