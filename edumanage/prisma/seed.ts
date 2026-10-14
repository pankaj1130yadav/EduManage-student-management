/**
 * EduManage seed — realistic Indian school data for the 2026–27 session.
 *
 * Creates:
 *  - 1 admin, 6 teachers (with logins), 4 classes
 *  - 40 students (10 per class), a few with student logins
 *  - attendance for ~20 school days (Aug–Oct 2026)
 *  - 2 examinations (Unit Test 1 × subjects) + 1 mid-term, with marks
 *  - fee records: paid / pending / overdue
 *
 * Run: npx prisma db seed   (or: npm run db:seed)
 */
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PASSWORD = "password123";

// Deterministic pseudo-random so the seed is reproducible.
let seed = 42;
function rand() {
  seed = (seed * 1103515245 + 12345) % 2147483648;
  return seed / 2147483648;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

const BOYS = [
  "Aarav", "Aditya", "Arjun", "Atharv", "Ayush", "Dev", "Dhruv", "Ishaan", "Kabir", "Krishna",
  "Manav", "Nikhil", "Pranav", "Rahul", "Rohan", "Rudra", "Sahil", "Shreyas", "Varun", "Vikram",
  "Yash", "Aryan", "Harsh", "Karan", "Naman",
];
const GIRLS = [
  "Aanya", "Aditi", "Ananya", "Anika", "Avni", "Diya", "Ishita", "Kavya", "Meera", "Myra",
  "Navya", "Pari", "Priya", "Riya", "Saanvi", "Sara", "Shreya", "Sneha", "Tanvi", "Vanya",
  "Zara", "Ira", "Aishwarya", "Divya", "Kriti",
];
const SURNAMES = [
  "Sharma", "Verma", "Gupta", "Singh", "Yadav", "Mishra", "Pandey", "Tiwari", "Agrawal",
  "Joshi", "Nair", "Iyer", "Reddy", "Khan", "Das", "Kumar", "Patel", "Chauhan", "Rawat", "Bisht",
];
const GUARDIAN_FIRST = [
  "Rajesh", "Suresh", "Amit", "Vikash", "Prakash", "Manoj", "Sunil", "Deepak", "Ramesh", "Anil",
  "Sanjay", "Rakesh", "Dinesh", "Mukesh", "Harish",
];
const SUBJECTS = ["Mathematics", "Science", "English", "Hindi", "Social Science", "Computer Science"];

const CLASSES = [
  { name: "Class 8-A", grade: "8", section: "A" },
  { name: "Class 8-B", grade: "8", section: "B" },
  { name: "Class 9-A", grade: "9", section: "A" },
  { name: "Class 10-A", grade: "10", section: "A" },
];

const TEACHERS = [
  { name: "Meera Iyer", email: "meera.iyer@edumanage.local", subject: "Mathematics", qualification: "M.Sc, B.Ed" },
  { name: "Rajesh Khanna", email: "rajesh.khanna@edumanage.local", subject: "Science", qualification: "M.Sc, B.Ed" },
  { name: "Sunita Rao", email: "sunita.rao@edumanage.local", subject: "English", qualification: "M.A, B.Ed" },
  { name: "Amitabh Joshi", email: "amitabh.joshi@edumanage.local", subject: "Hindi", qualification: "M.A, B.Ed" },
  { name: "Priya Nair", email: "priya.nair@edumanage.local", subject: "Social Science", qualification: "M.A, B.Ed" },
  { name: "Vikram Menon", email: "vikram.menon@edumanage.local", subject: "Computer Science", qualification: "MCA" },
];

function slugEmail(first: string, last: string) {
  return `${first.toLowerCase()}.${last.toLowerCase()}@edumanage.local`;
}

async function main() {
  console.log("Seeding EduManage…");

  // Clean slate (dev only)
  await prisma.mark.deleteMany();
  await prisma.exam.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.feeRecord.deleteMany();
  await prisma.student.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.class.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  // ---- Admin ----
  await prisma.user.create({
    data: {
      email: "admin@edumanage.local",
      passwordHash,
      role: Role.ADMIN,
      name: "Principal Sharma",
    },
  });

  // ---- Teachers + classes ----
  const createdTeachers = [];
  for (let i = 0; i < TEACHERS.length; i++) {
    const t = TEACHERS[i];
    const teacher = await prisma.teacher.create({
      data: {
        user: {
          create: {
            email: t.email,
            passwordHash,
            role: Role.TEACHER,
            name: t.name,
          },
        },
        employeeId: `EMP-2026-00${i + 1}`,
        subject: t.subject,
        qualification: t.qualification,
        phone: `98${Math.floor(10000000 + rand() * 89999999)}`,
        joiningDate: new Date("2024-07-01"),
        salary: 42000 + i * 2500,
      },
    });
    createdTeachers.push(teacher);
  }

  const createdClasses = [];
  for (let i = 0; i < CLASSES.length; i++) {
    const c = CLASSES[i];
    const cls = await prisma.class.create({
      data: {
        name: c.name,
        grade: c.grade,
        section: c.section,
        academicYear: "2026-27",
        classTeacherId: createdTeachers[i % createdTeachers.length].id,
      },
    });
    createdClasses.push(cls);
  }

  // Assign teachers to classes (each teaches 2 classes)
  for (let i = 0; i < createdTeachers.length; i++) {
    await prisma.teacher.update({
      where: { id: createdTeachers[i].id },
      data: {
        classes: {
          connect: [
            { id: createdClasses[i % createdClasses.length].id },
            { id: createdClasses[(i + 1) % createdClasses.length].id },
          ],
        },
      },
    });
  }

  // ---- Students: 10 per class ----
  const createdStudents = [];
  let admCounter = 1;
  const usedEmails = new Set<string>();
  const studentLogins: { email: string; name: string }[] = [];

  for (const cls of createdClasses) {
    const usedNames = new Set<string>();
    for (let i = 0; i < 10; i++) {
      const isBoy = rand() < 0.52;
      let first = isBoy ? pick(BOYS) : pick(GIRLS);
      let last = pick(SURNAMES);
      // The demo student login is pinned to Aarav Sharma in Class 10-A.
      if (cls.name === "Class 10-A" && i === 0) {
        first = "Aarav";
        last = "Sharma";
      }
      // avoid duplicate full names in a class
      while (usedNames.has(first + last)) {
        first = isBoy ? pick(BOYS) : pick(GIRLS);
      }
      usedNames.add(first + last);

      const birthYear = cls.grade === "10" ? 2011 : cls.grade === "9" ? 2012 : 2013;
      const dob = new Date(birthYear, Math.floor(rand() * 12), 1 + Math.floor(rand() * 27));
      const guardian = `${pick(GUARDIAN_FIRST)} ${last}`;
      const email = slugEmail(first, last);

      // Give the pinned demo student (Aarav Sharma, Class 10-A) a login, plus a couple more at random.
      const wantLogin =
        (cls.name === "Class 10-A" && i === 0) || rand() < 0.12;

      let userId: string | undefined;
      if (wantLogin && !usedEmails.has(email)) {
        usedEmails.add(email);
        const user = await prisma.user.create({
          data: {
            email,
            passwordHash,
            role: Role.STUDENT,
            name: `${first} ${last}`,
          },
        });
        userId = user.id;
        studentLogins.push({ email, name: `${first} ${last}` });
      }

      const student = await prisma.student.create({
        data: {
          userId,
          admissionNo: `ADM-2026-${String(admCounter++).padStart(4, "0")}`,
          firstName: first,
          lastName: last,
          gender: isBoy ? "MALE" : "FEMALE",
          dateOfBirth: dob,
          classId: cls.id,
          phone: `98${Math.floor(10000000 + rand() * 89999999)}`,
          address: `${10 + Math.floor(rand() * 90)}, ${pick(["Civil Lines", "Arya Nagar", "Malviya Chowk", "Shivalik Nagar", "Ganeshpur"])}`,
          guardianName: guardian,
          guardianPhone: `98${Math.floor(10000000 + rand() * 89999999)}`,
          admissionDate: new Date("2026-04-01"),
        },
      });
      createdStudents.push(student);
    }
  }
  console.log(`Created ${createdStudents.length} students`);

  // ---- Attendance: ~20 school days (Mon–Fri, Aug–Oct 2026) ----
  const days: Date[] = [];
  const cursor = new Date("2026-08-03T00:00:00.000Z");
  while (days.length < 20) {
    const dow = cursor.getUTCDay();
    if (dow !== 0 && dow !== 6) days.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  let attCount = 0;
  for (const day of days) {
    for (const cls of createdClasses) {
      const classStudents = createdStudents.filter((s) => s.classId === cls.id);
      const marker = createdTeachers[createdClasses.indexOf(cls) % createdTeachers.length];
      for (const s of classStudents) {
        const r = rand();
        const status = r < 0.88 ? "PRESENT" : r < 0.95 ? "ABSENT" : "LEAVE";
        await prisma.attendance.create({
          data: {
            studentId: s.id,
            classId: cls.id,
            date: day,
            status,
            markedById: marker.id,
          },
        });
        attCount++;
      }
    }
  }
  console.log(`Created ${attCount} attendance rows across ${days.length} days`);

  // ---- Exams: Unit Test 1 (Aug) + Mid-Term (Sep) for two classes, all subjects ----
  const examDefs = [
    { name: "Unit Test 1", term: "Term 1", date: new Date("2026-08-20T00:00:00.000Z"), classes: [createdClasses[2], createdClasses[3]] },
    { name: "Mid-Term Examination", term: "Term 1", date: new Date("2026-09-24T00:00:00.000Z"), classes: [createdClasses[2], createdClasses[3]] },
  ];

  let markCount = 0;
  for (const def of examDefs) {
    for (const cls of def.classes) {
      const classStudents = createdStudents.filter((s) => s.classId === cls.id);
      const subjects = cls.grade === "10" ? SUBJECTS : SUBJECTS.slice(0, 5);
      for (const subject of subjects) {
        const exam = await prisma.exam.create({
          data: {
            name: def.name,
            term: def.term,
            classId: cls.id,
            subject,
            maxMarks: 100,
            examDate: def.date,
          },
        });
        for (const s of classStudents) {
          // Bell-ish distribution: mean 68, sd 15, clamped 25–98
          const bell = (rand() + rand() + rand()) / 3;
          const marks = Math.round(Math.max(25, Math.min(98, 68 + (bell - 0.5) * 60)));
          await prisma.mark.create({
            data: {
              examId: exam.id,
              studentId: s.id,
              marksObtained: marks,
              enteredById: createdTeachers[0].id,
            },
          });
          markCount++;
        }
      }
    }
  }
  console.log(`Created marks: ${markCount}`);

  // ---- Fees: Term 1 (paid mostly, some overdue) + Term 2 (pending) ----
  const feeHeads = [
    { title: "Tuition Fee — Term 1", amount: 12500, due: new Date("2026-07-15T00:00:00.000Z") },
    { title: "Tuition Fee — Term 2", amount: 12500, due: new Date("2026-11-15T00:00:00.000Z") },
    { title: "Transport Fee — Annual", amount: 9000, due: new Date("2026-08-10T00:00:00.000Z") },
  ];

  let feeCount = 0;
  let receiptSeq = 482100;
  for (const s of createdStudents) {
    for (const head of feeHeads) {
      const r = rand();
      if (head.title.includes("Term 1")) {
        if (r < 0.78) {
          // paid
          await prisma.feeRecord.create({
            data: {
              studentId: s.id,
              title: head.title,
              amount: head.amount,
              dueDate: head.due,
              status: "PAID",
              paidAmount: head.amount,
              paidAt: new Date(head.due.getTime() - Math.floor(rand() * 10) * 86400000),
              paymentMode: pick(["UPI", "UPI", "CASH", "BANK_TRANSFER"]),
              receiptNo: `RCP-2026-${receiptSeq++}`,
            },
          });
        } else {
          // overdue (due date already past)
          await prisma.feeRecord.create({
            data: {
              studentId: s.id,
              title: head.title,
              amount: head.amount,
              dueDate: head.due,
              status: "OVERDUE",
            },
          });
        }
      } else if (head.title.includes("Term 2")) {
        // pending — some paid early
        if (r < 0.25) {
          await prisma.feeRecord.create({
            data: {
              studentId: s.id,
              title: head.title,
              amount: head.amount,
              dueDate: head.due,
              status: "PAID",
              paidAmount: head.amount,
              paidAt: new Date("2026-10-02T00:00:00.000Z"),
              paymentMode: "UPI",
              receiptNo: `RCP-2026-${receiptSeq++}`,
            },
          });
        } else {
          await prisma.feeRecord.create({
            data: {
              studentId: s.id,
              title: head.title,
              amount: head.amount,
              dueDate: head.due,
              status: "PENDING",
            },
          });
        }
      } else {
        // transport: ~60% paid
        if (r < 0.6) {
          await prisma.feeRecord.create({
            data: {
              studentId: s.id,
              title: head.title,
              amount: head.amount,
              dueDate: head.due,
              status: "PAID",
              paidAmount: head.amount,
              paidAt: new Date(head.due.getTime() + Math.floor(rand() * 20) * 86400000),
              paymentMode: pick(["CASH", "UPI", "CHEQUE"]),
              receiptNo: `RCP-2026-${receiptSeq++}`,
            },
          });
        } else {
          await prisma.feeRecord.create({
            data: {
              studentId: s.id,
              title: head.title,
              amount: head.amount,
              dueDate: head.due,
              status: r < 0.8 ? "PENDING" : "OVERDUE",
            },
          });
        }
      }
      feeCount++;
    }
  }
  console.log(`Created ${feeCount} fee records`);

  console.log("\nDemo logins (all password: password123):");
  console.log("  admin@edumanage.local            (admin)");
  for (const t of TEACHERS.slice(0, 3)) console.log(`  ${t.email.padEnd(32)} (teacher)`);
  for (const s of studentLogins.slice(0, 3)) console.log(`  ${s.email.padEnd(32)} (student)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
