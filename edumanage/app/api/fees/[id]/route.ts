import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-guard";
import type { PaymentMode } from "@prisma/client";

function nextReceiptNo(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `RCP-${year}-${rand}`;
}

/**
 * POST /api/fees/[id]/pay — record a payment against a fee record (admin).
 * Body: { paidAmount, paymentMode }. Sets status PAID and issues a receipt number.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const gate = await requireRole("ADMIN");
  if ("response" in gate) return gate.response;

  try {
    const record = await prisma.feeRecord.findUnique({ where: { id: params.id } });
    if (!record) return NextResponse.json({ error: "Fee record not found" }, { status: 404 });
    if (record.status === "PAID") {
      return NextResponse.json({ error: "This fee is already paid" }, { status: 409 });
    }

    const body = await req.json();
    const paidAmount = Math.round(Number(body.paidAmount ?? record.amount));
    const paymentMode = (body.paymentMode as PaymentMode) ?? "CASH";
    if (!paidAmount || paidAmount <= 0) {
      return NextResponse.json({ error: "Enter a valid amount" }, { status: 400 });
    }

    const updated = await prisma.feeRecord.update({
      where: { id: params.id },
      data: {
        paidAmount,
        paymentMode,
        paidAt: new Date(),
        status: "PAID",
        receiptNo: record.receiptNo ?? nextReceiptNo(),
      },
      include: {
        student: {
          select: {
            id: true, firstName: true, lastName: true, admissionNo: true,
            class: { select: { name: true } },
          },
        },
      },
    });
    return NextResponse.json({ record: updated });
  } catch (err) {
    console.error("record payment error", err);
    return NextResponse.json({ error: "Could not record payment" }, { status: 500 });
  }
}

/** GET /api/fees/[id]/receipt — receipt data for printing (admin, or the student it belongs to). */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const gate = await requireRole(["ADMIN", "STUDENT"]);
  if ("response" in gate) return gate.response;
  const { session } = gate;

  const record = await prisma.feeRecord.findUnique({
    where: { id: params.id },
    include: {
      student: {
        select: {
          firstName: true, lastName: true, admissionNo: true,
          class: { select: { name: true } }, guardianName: true,
        },
      },
    },
  });
  if (!record) return NextResponse.json({ error: "Fee record not found" }, { status: 404 });
  if (session.role === "STUDENT" && record.studentId !== session.studentId) {
    return NextResponse.json({ error: "Not permitted" }, { status: 403 });
  }
  return NextResponse.json({ record });
}

/** DELETE /api/fees/[id] — remove an unpaid record (admin). */
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const gate = await requireRole("ADMIN");
  if ("response" in gate) return gate.response;

  try {
    const record = await prisma.feeRecord.findUnique({ where: { id: params.id } });
    if (!record) return NextResponse.json({ error: "Fee record not found" }, { status: 404 });
    if (record.status === "PAID") {
      return NextResponse.json({ error: "Paid records cannot be deleted" }, { status: 409 });
    }
    await prisma.feeRecord.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("delete fee error", err);
    return NextResponse.json({ error: "Could not delete record" }, { status: 500 });
  }
}
