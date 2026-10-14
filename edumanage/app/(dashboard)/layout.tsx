import { getSession, loadSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar, { type NavItem } from "@/components/Sidebar";

const NAV: Record<string, NavItem[]> = {
  ADMIN: [
    { href: "/admin", label: "Overview" },
    { href: "/admin/students", label: "Students" },
    { href: "/admin/teachers", label: "Teachers" },
    { href: "/admin/classes", label: "Classes" },
    { href: "/admin/attendance", label: "Attendance" },
    { href: "/admin/exams", label: "Exams & Gradebook" },
    { href: "/admin/fees", label: "Fee Books" },
  ],
  TEACHER: [
    { href: "/teacher", label: "My Desk" },
    { href: "/teacher/attendance", label: "Mark Attendance" },
    { href: "/teacher/exams", label: "Exams & Marks" },
    { href: "/teacher/students", label: "My Students" },
  ],
  STUDENT: [
    { href: "/student", label: "My Record" },
    { href: "/student/attendance", label: "Attendance" },
    { href: "/student/report-card", label: "Report Card" },
    { href: "/student/fees", label: "Fees & Receipts" },
  ],
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const raw = getSession();
  if (!raw) redirect("/login");
  const session = await loadSessionUser(raw);

  return (
    <div className="min-h-screen">
      <Sidebar role={session.role} userName={session.name} items={NAV[session.role]} />
      <div className="lg:pl-64">
        <main className="mx-auto max-w-6xl px-4 py-8 md:px-8">{children}</main>
      </div>
    </div>
  );
}
