# EduManage — School Administration Ledger

A **student management system** for schools, styled like a classic academic
register: warm paper backgrounds, deep forest green + gold accents, Fraunces
serif display type paired with Inter. Students, teachers and administrators
each get their own desk.

Built for the **CodSoft internship programme** (Project 1 of 5).

---

## Features

| Area | What works |
|---|---|
| **Auth & roles** | JWT sessions stored in an `httpOnly` cookie (`edumanage_token`, 7-day expiry). Roles: `ADMIN`, `TEACHER`, `STUDENT`. Next.js middleware redirects unauthenticated users to `/login` and enforces per-role route prefixes (`/admin/*`, `/teacher/*`, `/student/*`); admins may visit all desks. Passwords hashed with bcrypt. |
| **Students (admin CRUD)** | Admit / edit / remove students, search by name or admission number, filter by class, optional student login creation. Teachers see **read-only** lists of *their own classes only*. |
| **Teachers (admin)** | Add / edit / remove teachers (each gets a login), assign classes, class-teacher designation, subject, qualification, salary. |
| **Classes (admin)** | Create classes with grade / section / academic year / class teacher. |
| **Attendance** | Teachers mark **Present / Absent / Leave** per student per class-day (batch upsert, mark-all shortcuts, previously-marked hint). Teachers can only mark their assigned classes. Students see their own day ledger + summary. Admin can view/correct any class-day. |
| **Exams & gradebook** | Create exams per class × subject (name, term, max marks, date). Batch marks entry in a slide-over gradebook (clamped to max marks). Students see a **report card** grouped by examination with totals, percentages and grades — printable via browser print. |
| **Fee books** | Raise fee dues per student (₹ amounts), record payments (UPI / cash / bank transfer / cheque) with auto-issued receipt numbers (`RCP-YYYY-######`), and open a **printable receipt** (amount in words, Indian numbering) via browser print. Students see their dues and receipts. |
| **Admin analytics** | Counts, attendance % (donut, last 30 days), monthly fee-collection bar chart, attendance % by class. Charts are hand-rolled SVG/CSS — no chart library. |

### Honest feature status

| Item | Status |
|---|---|
| Everything listed above | **Real** — works end-to-end against PostgreSQL via Prisma |
| Email / SMS notifications (e.g. fee reminders) | **Not built** — deliberately omitted; no stub, no claim |
| Payment gateway integration | **Not built** — payments are recorded manually by the school office (cash/UPI/bank/cheque), which is how most schools actually work |
| PDF export of receipts | **Not built** — receipts/report cards print cleanly via the browser's Print → Save as PDF (print CSS included) |

---

## Tech stack

- **Next.js 14** (App Router, API routes, middleware) + **TypeScript**
- **Prisma 5** ORM + **PostgreSQL 16** (docker-compose provided)
- **Tailwind CSS 3** with a custom paper/ink/forest/gold theme
- Auth: `jsonwebtoken` + `bcryptjs`, httpOnly cookie sessions
- No external services, no third-party accounts, no real secrets — runs fully local

## Project structure

```
edumanage/
├── app/
│   ├── page.tsx / login/          # landing + sign-in
│   ├── (dashboard)/               # role desks (middleware-protected)
│   │   ├── admin/                 # overview, students, teachers, classes,
│   │   │                          # attendance, exams, fees, receipt print
│   │   ├── teacher/               # desk, mark attendance, exams, my students
│   │   └── student/               # record, attendance, report card, fees
│   └── api/                       # REST routes (role-guarded)
├── components/                    # ui primitives, Sidebar, charts (SVG),
│                                  # AttendanceMarker, ExamManager, ReceiptPrint
├── lib/                           # prisma client, auth (JWT/cookie), api-guard,
│                                  # analytics queries, utils
├── prisma/
│   ├── schema.prisma
│   ├── migrations/0001_init/      # generated SQL migration
│   └── seed.ts                    # ~40 students, 6 teachers, 4 classes,
│                                  # 20 days attendance, exams+marks, fee records
├── docker-compose.yml             # PostgreSQL 16
└── .env.example
```

---

## Setup (Windows PowerShell)

Prerequisites: **Node.js 18+**, **Docker Desktop**, **Git**.

```powershell
# 1. Enter the project
cd ~/workspace/codsoft/edumanage   # or wherever you placed it

# 2. Install dependencies
npm install

# 3. Start PostgreSQL
docker-compose up -d

# 4. Configure environment
Copy-Item .env.example .env
# .env already points at the docker-compose database:
#   DATABASE_URL="postgresql://edumanage:edumanage@localhost:5432/edumanage?schema=public"
# Set JWT_SECRET to any long random string.

# 5. Run the migration and seed the demo data
npx prisma migrate dev
npm run db:seed

# 6. Start the app
npm run dev
# → http://localhost:3000
```

Production build check: `npm run build` · start: `npm start`.

## Demo logins

All passwords: **`password123`**

| Role | Email |
|---|---|
| Admin | `admin@edumanage.local` |
| Teacher | `meera.iyer@edumanage.local` (Mathematics) |
| Student | `aarav.sharma@edumanage.local` (Class 10-A) |

The sign-in page has one-tap demo buttons for all three.

## Seed data

`npm run db:seed` creates a full 2026–27 session: 4 classes (8-A, 8-B, 9-A, 10-A),
6 teachers, 40 students with Indian names (10 per class), ~800 attendance rows
over 20 school days, Unit Test 1 + Mid-Term exams with marks for classes 9-A and
10-A, and fee records in paid / pending / overdue states (₹12,500 term fees,
₹9,000 transport). Deterministic — re-running gives the same dataset.

## Notes

- **Auth design:** login API verifies credentials, signs a JWT containing
  `{id, email, name, role, teacherId, studentId}` and sets it as an `httpOnly`,
  `SameSite=lax` cookie. Middleware verifies the token on every dashboard/API
  request; server components use `getSession()` from the cookie. No tokens in
  localStorage, no client-side secrets.
- **Role scoping in APIs:** teachers can only read/mark data for classes
  assigned to them; students can only read their own records. Enforced in the
  API layer, not just the UI.
- **Receipt numbers** are generated server-side on payment (`RCP-YYYY-######`);
  receipts are plain pages with print CSS — no PDF library needed.
- Amounts in words on receipts use the Indian system (lakh/crore).
- All demo credentials are seed-only; change `JWT_SECRET` and the passwords
  before any real deployment.
