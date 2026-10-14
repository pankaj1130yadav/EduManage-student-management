"use client";

import ReceiptPrint from "@/components/ReceiptPrint";

export default function AdminReceiptPage({ params }: { params: { id: string } }) {
  return <ReceiptPrint feeId={params.id} backHref="/admin/fees" />;
}
