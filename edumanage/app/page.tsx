import Link from "next/link";

const FEATURES = [
  {
    title: "Student Registers",
    body: "Admissions, class allocation and complete student dossiers in one bound register.",
  },
  {
    title: "Attendance Ledger",
    body: "Teachers mark present / absent / leave per class-day; students see their own record.",
  },
  {
    title: "Examinations & Gradebook",
    body: "Create exams, enter marks subject-wise, and issue printable report cards.",
  },
  {
    title: "Fee Books",
    body: "Dues, payments and printable receipts with unique receipt numbers — all in rupees.",
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      {/* Masthead */}
      <header className="border-b border-paper-line">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-sm bg-forest font-display text-xl font-bold text-gold-soft shadow-ledger">
              E
            </div>
            <div>
              <p className="font-display text-2xl font-semibold tracking-tight text-ink">
                EduManage
              </p>
              <p className="text-[11px] uppercase tracking-[0.22em] text-ink-faint">
                School Administration Ledger
              </p>
            </div>
          </div>
          <Link
            href="/login"
            className="rounded-sm bg-forest px-5 py-2.5 text-sm font-semibold text-paper shadow-ledger transition hover:bg-forest-deep"
          >
            Open the Ledger →
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="ledger-rule border-b border-paper-line">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <p className="mb-4 inline-block border border-gold-deep/40 bg-gold-mist px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-gold-deep">
            Est. for the 2026–27 session
          </p>
          <h1 className="max-w-3xl font-display text-5xl font-semibold leading-[1.05] tracking-tight text-ink md:text-7xl">
            The whole school,
            <br />
            kept in <span className="italic text-forest">one bound book</span>.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
            EduManage is a student management system styled like a classic academic
            register — admissions, attendance, examinations, gradebook and fee books
            for administrators, teachers and students.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="rounded-sm bg-forest px-7 py-3 font-semibold text-paper shadow-ledger transition hover:bg-forest-deep"
            >
              Sign in to the dashboard
            </Link>
            <a
              href="#features"
              className="rounded-sm border border-forest/30 bg-paper-card px-7 py-3 font-semibold text-forest transition hover:bg-forest-mist"
            >
              See what&apos;s inside
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="font-display text-3xl font-semibold text-ink">
          Chapters of the ledger
        </h2>
        <p className="mt-2 text-ink-soft">
          Everything a school office needs — nothing it doesn&apos;t.
        </p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="rounded-sm border border-paper-line bg-paper-card p-6 shadow-card"
            >
              <p className="font-display text-sm font-semibold uppercase tracking-[0.2em] text-gold-deep">
                Chapter {i + 1}
              </p>
              <h3 className="mt-2 font-display text-2xl font-semibold text-ink">
                {f.title}
              </h3>
              <p className="mt-2 leading-relaxed text-ink-soft">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Roles */}
      <section className="border-t border-paper-line bg-paper-deep/60">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="font-display text-3xl font-semibold text-ink">
            Three desks, one book
          </h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {[
              {
                role: "Administrator",
                body: "Admissions, staff, classes, fee books and a full analytics overview of the school.",
              },
              {
                role: "Teacher",
                body: "Mark attendance for your classes, enter examination marks, see your timetable at a glance.",
              },
              {
                role: "Student",
                body: "Your attendance record, report card and fee dues — with printable receipts.",
              },
            ].map((r) => (
              <div
                key={r.role}
                className="rounded-sm border-t-4 border-forest bg-paper-card p-6 shadow-card"
              >
                <h3 className="font-display text-xl font-semibold text-ink">{r.role}</h3>
                <p className="mt-2 text-ink-soft">{r.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 rounded-sm border border-gold-deep/30 bg-gold-mist/60 p-5 text-sm text-ink-soft">
            <span className="font-semibold text-gold-deep">Demo access — </span>
            sign in with <code className="font-semibold">admin@edumanage.local</code>,{" "}
            <code className="font-semibold">meera.iyer@edumanage.local</code> (teacher) or{" "}
            <code className="font-semibold">aarav.sharma@edumanage.local</code> (student)
            — password <code className="font-semibold">password123</code> for all three.
          </div>
        </div>
      </section>

      <footer className="border-t border-paper-line">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-8 text-sm text-ink-faint md:flex-row">
          <p className="font-display italic">EduManage — kept with care, like a good register.</p>
          <p>Built for the CodSoft internship programme · runs fully offline</p>
        </div>
      </footer>
    </main>
  );
}
