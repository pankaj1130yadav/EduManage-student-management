"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, inr, fmtDate } from "@/lib/utils";

interface ReceiptRecord {
  id: string;
  title: string;
  amount: number;
  paidAmount: number;
  dueDate: string;
  paidAt: string | null;
  paymentMode: string | null;
  receiptNo: string | null;
  status: string;
  student: {
    firstName: string;
    lastName: string;
    admissionNo: string;
    guardianName?: string | null;
    class?: { name: string } | null;
  };
}

function amountInWords(n: number): string {
  // Simple Indian-system words for receipt display (whole rupees).
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  function two(d: number): string {
    return d < 20 ? ones[d] : tens[Math.floor(d / 10)] + (d % 10 ? " " + ones[d % 10] : "");
  }
  function three(d: number): string {
    const h = Math.floor(d / 100);
    const r = d % 100;
    return (h ? ones[h] + " Hundred" + (r ? " " : "") : "") + (r ? two(r) : "");
  }
  if (n === 0) return "Zero";
  let out = "";
  const cr = Math.floor(n / 10000000);
  const lk = Math.floor((n % 10000000) / 100000);
  const th = Math.floor((n % 100000) / 1000);
  const rest = n % 1000;
  if (cr) out += two(cr) + " Crore ";
  if (lk) out += two(lk) + " Lakh ";
  if (th) out += two(th) + " Thousand ";
  if (rest) out += three(rest);
  return out.trim();
}

export default function ReceiptPrint({ feeId, backHref }: { feeId: string; backHref: string }) {
  const router = useRouter();
  const [record, setRecord] = useState<ReceiptRecord | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ record: ReceiptRecord }>(`/api/fees/${feeId}/receipt`)
      .then((d) => setRecord(d.record))
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load receipt"));
  }, [feeId]);

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-ledger-red">{error}</p>
        <button onClick={() => router.push(backHref)} className="mt-4 underline">Go back</button>
      </div>
    );
  }
  if (!record) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-paper-line border-t-forest" />
      </div>
    );
  }

  return (
    <div>
      <div className="no-print mb-6 flex items-center justify-between">
        <button
          onClick={() => router.push(backHref)}
          className="rounded-sm border border-forest/30 bg-paper-card px-4 py-2 text-sm font-semibold text-forest hover:bg-forest-mist"
        >
          ← Back
        </button>
        <button
          onClick={() => window.print()}
          className="rounded-sm bg-forest px-6 py-2.5 text-sm font-semibold text-paper shadow-ledger hover:bg-forest-deep"
        >
          🖨 Print receipt
        </button>
      </div>

      <div className="print-sheet mx-auto max-w-2xl rounded-sm border border-paper-line bg-white p-8 shadow-ledger md:p-10">
        {/* Letterhead */}
        <div className="border-b-4 border-double border-forest pb-5 text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-sm bg-forest font-display text-xl font-bold text-gold-soft">
            E
          </div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">EduManage School</h1>
          <p className="mt-1 text-sm text-ink-soft">
            14 Vidya Marg, Roorkee, Uttarakhand 247667 · Ph: 01332-000000
          </p>
          <p className="mt-2 inline-block border border-gold-deep/50 bg-gold-mist px-4 py-1 font-display text-sm font-semibold uppercase tracking-[0.25em] text-gold-deep">
            Fee Receipt
          </p>
        </div>

        <div className="mt-6 flex items-center justify-between text-sm">
          <p><span className="font-semibold">Receipt No:</span> <span className="font-mono">{record.receiptNo ?? "—"}</span></p>
          <p><span className="font-semibold">Date:</span> {record.paidAt ? fmtDate(record.paidAt) : "—"}</p>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 border-y border-paper-line py-5 text-sm">
          <div><dt className="text-[11px] font-semibold uppercase tracking-widest text-ink-faint">Received from</dt><dd className="mt-0.5 font-semibold text-ink">{record.student.firstName} {record.student.lastName}</dd></div>
          <div><dt className="text-[11px] font-semibold uppercase tracking-widest text-ink-faint">Admission No</dt><dd className="mt-0.5 font-mono text-ink">{record.student.admissionNo}</dd></div>
          <div><dt className="text-[11px] font-semibold uppercase tracking-widest text-ink-faint">Class</dt><dd className="mt-0.5 text-ink">{record.student.class?.name ?? "—"}</dd></div>
          <div><dt className="text-[11px] font-semibold uppercase tracking-widest text-ink-faint">Towards</dt><dd className="mt-0.5 text-ink">{record.title}</dd></div>
        </dl>

        <div className="mt-6 flex items-end justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-faint">Amount in words</p>
            <p className="mt-1 max-w-sm font-display text-lg italic text-ink">
              Rupees {amountInWords(record.paidAmount)} Only
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-faint">Amount paid</p>
            <p className="font-display text-4xl font-bold text-forest">{inr(record.paidAmount)}</p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-dashed border-paper-line pt-4 text-sm text-ink-soft">
          <p>Mode of payment: <strong className="text-ink">{record.paymentMode?.replace("_", " ") ?? "—"}</strong></p>
          <p>Due date was: <strong className="text-ink">{fmtDate(record.dueDate)}</strong></p>
        </div>

        <div className="mt-12 flex items-end justify-between">
          <p className="text-xs italic text-ink-faint">This is a computer-generated receipt.</p>
          <div className="text-center">
            <div className="mb-1 h-10 w-44 border-b border-ink/60" />
            <p className="text-xs font-semibold uppercase tracking-widest text-ink-faint">Authorised signatory</p>
          </div>
        </div>
      </div>
    </div>
  );
}
