"use client";

import { Suspense } from "react";
import AttendanceMarker from "@/components/AttendanceMarker";

export default function AdminAttendancePage() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-ink-faint">Opening the register…</div>}>
      <AttendanceMarker
        title="Attendance Ledger"
        subtitle="View or correct attendance for any class and day. Teachers mark only their own classes."
      />
    </Suspense>
  );
}
