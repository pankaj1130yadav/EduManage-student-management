import { prisma } from "./prisma";

export interface AnalyticsData {
  counts: { students: number; teachers: number; classes: number };
  attendancePct: number;
  fees: {
    billed: number;
    collected: number;
    outstanding: number;
    byStatus: Record<string, number>;
  };
  monthlyCollection: { label: string; amount: number }[];
  attendanceByClass: { name: string; pct: number }[];
}

export async function getAnalyticsData(): Promise<AnalyticsData> {
  const [students, teachers, classes] = await Promise.all([
    prisma.student.count(),
    prisma.teacher.count(),
    prisma.class.count(),
  ]);

  const since = new Date();
  since.setDate(since.getDate() - 30);
  const [present, total] = await Promise.all([
    prisma.attendance.count({ where: { date: { gte: since }, status: "PRESENT" } }),
    prisma.attendance.count({ where: { date: { gte: since } } }),
  ]);
  const attendancePct = total ? Math.round((present / total) * 1000) / 10 : 0;

  const feeAgg = await prisma.feeRecord.aggregate({
    _sum: { amount: true, paidAmount: true },
  });
  const collected = feeAgg._sum.paidAmount ?? 0;
  const billed = feeAgg._sum.amount ?? 0;
  const feeStatusCounts = await prisma.feeRecord.groupBy({ by: ["status"], _count: true });

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5, 1);
  const paid = await prisma.feeRecord.findMany({
    where: { status: "PAID", paidAt: { gte: sixMonthsAgo } },
    select: { paidAmount: true, paidAt: true },
  });
  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const buckets = new Map<string, number>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i, 1);
    buckets.set(`${d.getFullYear()}-${d.getMonth()}`, 0);
  }
  for (const p of paid) {
    if (!p.paidAt) continue;
    const key = `${p.paidAt.getFullYear()}-${p.paidAt.getMonth()}`;
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + p.paidAmount);
  }
  const monthlyCollection = [...buckets.entries()].map(([key, amount]) => {
    const [y, m] = key.split("-").map(Number);
    return { label: `${monthLabels[m]} '${String(y).slice(2)}`, amount };
  });

  const classesList = await prisma.class.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  const attendanceByClass = await Promise.all(
    classesList.map(async (c) => {
      const [p, t] = await Promise.all([
        prisma.attendance.count({ where: { classId: c.id, date: { gte: since }, status: "PRESENT" } }),
        prisma.attendance.count({ where: { classId: c.id, date: { gte: since } } }),
      ]);
      return { name: c.name, pct: t ? Math.round((p / t) * 1000) / 10 : 0 };
    })
  );

  return {
    counts: { students, teachers, classes },
    attendancePct,
    fees: {
      billed,
      collected,
      outstanding: billed - collected,
      byStatus: Object.fromEntries(feeStatusCounts.map((f) => [f.status, f._count])),
    },
    monthlyCollection,
    attendanceByClass,
  };
}
