"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/utils";
import { PageHeader, Card, Field, inputCls, Badge, Th, Td, EmptyState, Spinner } from "@/components/ui";

interface Student {
  id: string;
  admissionNo: string;
  firstName: string;
  lastName: string;
  class?: { id: string; name: string } | null;
  guardianName?: string | null;
  guardianPhone?: string | null;
}

interface ClassRow { id: string; name: string }

export default function TeacherStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [classId, setClassId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ classes: ClassRow[]; mine: string[] }>("/api/classes").then((d) => {
      setClasses(d.classes.filter((c) => d.mine.includes(c.id)));
      if (d.mine.length > 0) setClassId(d.mine[0]);
    });
  }, []);

  useEffect(() => {
    if (!classId) return;
    setLoading(true);
    api<{ students: Student[] }>(`/api/students?classId=${classId}`)
      .then((d) => setStudents(d.students))
      .finally(() => setLoading(false));
  }, [classId]);

  return (
    <div>
      <PageHeader
        title="My Students"
        subtitle="Read-only roll of the classes assigned to you."
      />
      <Card className="mb-4">
        <div className="p-4">
          <Field label="Class">
            <select value={classId} onChange={(e) => setClassId(e.target.value)} className={`${inputCls} max-w-[220px]`}>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
        </div>
      </Card>
      <Card>
        {loading ? <Spinner /> : students.length === 0 ? (
          <EmptyState title="No students in this class" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead><tr><Th>Admission No</Th><Th>Name</Th><Th>Guardian</Th><Th>Guardian phone</Th></tr></thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="transition hover:bg-paper-deep/50">
                    <Td className="font-mono text-xs">{s.admissionNo}</Td>
                    <Td className="font-semibold">{s.firstName} {s.lastName}</Td>
                    <Td className="text-ink-soft">{s.guardianName ?? "—"}</Td>
                    <Td className="text-ink-soft">{s.guardianPhone ?? "—"}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <p className="mt-3 text-xs italic text-ink-faint">
        Student records are edited by the school office — teachers have read-only access here.
      </p>
    </div>
  );
}
