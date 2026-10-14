"use client";

import ReceiptPrint from "@/components/ReceiptPrint";

export default function StudentReceiptPage({ params }: { params: { id: string } }) {
  return <ReceiptPrint feeId={params.id} backHref="/student/fees" />;
}
