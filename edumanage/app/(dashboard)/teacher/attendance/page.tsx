"use client";

import { Suspense } from "react";
import AttendanceMarker from "@/components/AttendanceMarker";

export default function TeacherAttendancePage() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-ink-faint">Opening the register…</div>}>
      <AttendanceMarker
        title="Mark Attendance"
        subtitle="Tick the roll for your class. Present / Absent / Leave — saved per class-day, and students see their own record."
      />
    </Suspense>
  );
}
