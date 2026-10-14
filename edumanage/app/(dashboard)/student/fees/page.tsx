"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, inr, fmtDate } from "@/lib/utils";
import { PageHeader, Card, CardHeader, Badge, Th, Td, EmptyState, Spinner } from "@/components/ui";

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
}

export default function StudentFeesPage() {
  const [records, setRecords] = useState<FeeRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ user: { studentId?: string } }>("/api/auth/me").then(async (d) => {
      const sid = d.user.studentId;
      if (sid) {
        const r = await api<{ records: FeeRecord[] }>(`/api/fees?studentId=${sid}`);
        setRecords(r.records);
      }
      setLoading(false);
    });
  }, []);

  const due = records.filter((r) => r.status !== "PAID").reduce((a, r) => a + (r.amount - r.paidAmount), 0);
  const paid = records.filter((r) => r.status === "PAID").reduce((a, r) => a + r.paidAmount, 0);

  const tone = (s: string) => (s === "PAID" ? "green" : s === "OVERDUE" ? "red" : "amber") as "green" | "red" | "amber";

  return (
    <div>
      <PageHeader title="Fees & Receipts" subtitle="Your dues and every payment receipt — printable." />

      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <p className={`font-display text-3xl font-semibold ${due > 0 ? "text-ledger-red" : "text-ledger-green"}`}>{inr(due)}</p>
          <p className="mt-1 text-sm text-ink-soft">Currently due</p>
        </Card>
        <Card className="p-5">
          <p className="font-display text-3xl font-semibold text-ink">{inr(paid)}</p>
          <p className="mt-1 text-sm text-ink-soft">Paid this session</p>
        </Card>
      </div>

      <Card>
        <CardHeader title="Fee ledger" />
        {loading ? <Spinner /> : records.length === 0 ? (
          <EmptyState title="No fee records" body="The school office raises fee heads here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px]">
              <thead><tr><Th>Fee head</Th><Th>Due date</Th><Th className="text-right">Amount</Th><Th>Status</Th><Th className="text-right">Receipt</Th></tr></thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id} className="transition hover:bg-paper-deep/50">
                    <Td className="font-medium">{r.title}</Td>
                    <Td className="text-ink-soft">{fmtDate(r.dueDate)}</Td>
                    <Td className="text-right font-semibold">{inr(r.amount)}</Td>
                    <Td><Badge tone={tone(r.status)}>{r.status}</Badge></Td>
                    <Td className="text-right">
                      {r.status === "PAID" ? (
                        <Link href={`/student/fees/receipt/${r.id}`} className="rounded-sm border border-gold-deep/40 bg-gold-mist px-2.5 py-1 text-xs font-semibold text-gold-deep hover:opacity-80">
                          View / print
                        </Link>
                      ) : (
                        <span className="text-xs italic text-ink-faint">Pay at the school office</span>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <p className="mt-3 text-xs italic text-ink-faint">
        Payments are recorded by the school office against cash, UPI, bank transfer or cheque.
      </p>
    </div>
  );
}
