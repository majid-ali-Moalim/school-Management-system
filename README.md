# School Management System (SMS)
### Full-Stack Production Application

A complete, enterprise-grade, multi-role School Management System built with a **Next.js 14 (App Router)** frontend, **Node.js/Express (TypeScript)** REST API backend, **Prisma ORM**, and **Supabase PostgreSQL**.

---

## 🚀 Key Highlights & Architecture

- **True Full-Stack Data Flow**: Zero mock data. Every feature is connected end-to-end (`Next.js UI` ↔ `Express API` ↔ `Prisma ORM` ↔ `Supabase PostgreSQL`).
- **Isolated Multi-Tenant PostgreSQL Schema**: All 20 models reside in an isolated `school_management` schema within Supabase PostgreSQL, ensuring zero collision with other database tables.
- **Strict Role-Based Access Control (RBAC)**:
  - **ADMIN**: Unrestricted management access across all modules, school settings, user accounts, audit logging, and reporting.
  - **TEACHER**: Assignment-level authorization. Teachers can only view assigned classes, mark attendance for assigned cohorts/subjects, enter scores for their assigned curriculum, and view their personalized timetable.
  - **STUDENT**: Self-ownership access. Students can only view their own academic profile, enrollments, published results, attendance records, and schedule.
- **Transactional Integrity**: Multi-table operations (e.g. Student Registration = `User` + `Student` + `Enrollment`, Score Upserts) execute within atomic Prisma transactions.
- **Configurable Grading Scales**: Dynamically calculated grade points and letters (`A+`, `A`, `B`, `C`, `D`, `F`) based on institutionally defined threshold intervals.
- **Audit Logging**: Sensitive administrative actions (`LOGIN`, `LOGOUT`, `CREATE`, `UPDATE`, `DELETE`, `PUBLISH_RESULT`, `ENTER_SCORE`, `UPDATE_ATTENDANCE`) are immutably logged with actor IDs and change summaries.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons |
| **Backend API** | Node.js, Express, TypeScript, tsx, JWT (jsonwebtoken), bcryptjs, CORS |
| **Database & ORM** | Supabase (PostgreSQL), Prisma ORM v5 |
| **Tooling** | Concurrently, ts-node, dotenv, PostCSS, Autoprefixer |

---

## 📁 Repository Structure

```text
school-management-system/
├── backend/                        # Node.js/Express TypeScript REST API
│   ├── src/
│   │   ├── academic-years/         # Academic years & terms lifecycle controller
│   │   ├── announcements/          # School bulletins with audience targeting
│   │   ├── assignments/            # Teacher-Subject-Class assignment matrix
│   │   ├── attendance/             # Daily attendance recording & analytics
│   │   ├── audit/                  # Immutable system audit trail
│   │   ├── auth/                   # JWT auth, bcrypt hashing, auth middleware
│   │   ├── classes/                # Grade & classroom administration
│   │   ├── enrollments/            # Student class/section enrollment history
│   │   ├── exams/                  # Examination periods & exam-subjects
│   │   ├── notifications/          # In-app user notifications & unread counts
│   │   ├── reports/                # School-wide KPIs & distribution metrics
│   │   ├── results/                # Grading engine, score entry & report cards
│   │   ├── sections/               # Class section partitions
│   │   ├── settings/               # School profile & configurable grading scale
│   │   ├── students/               # Student directory & transactional registration
│   │   ├── subjects/               # Curriculum subjects & credit hours
│   │   ├── teachers/               # Faculty staff management
│   │   ├── timetable/              # Weekly recurring period scheduling
│   │   ├── users/                  # Global user account credential management
│   │   ├── middleware/             # Role guards & assignment validation
│   │   ├── prisma.ts               # Singleton Prisma Client instance
│   │   └── server.ts               # Express entrypoint & route registration
│   ├── tsconfig.json
│   └── package.json
│
├── frontend/                       # Next.js 14 App Router UI
│   ├── app/
│   │   ├── admin/                  # 18 Admin management views & dashboards
│   │   │   ├── dashboard/          # Metric cards, charts, recent activities
│   │   │   ├── students/           # Paginated table, detail view & multi-step form
│   │   │   ├── teachers/           # Faculty staff directory
│   │   │   ├── classes/            # Classes & capacity management
│   │   │   ├── subjects/           # Subject catalog & pass/max score rules
│   │   │   ├── academic-years/     # Years & terms management
│   │   │   ├── assignments/        # Faculty teaching allocation matrix
│   │   │   ├── attendance/         # School-wide attendance overview
│   │   │   ├── exams/              # Exam session setup & subject linking
│   │   │   ├── results/            # Result publishing workflow
│   │   │   ├── report-cards/       # Official printable report cards
│   │   │   ├── timetable/          # Master timetable builder
│   │   │   ├── announcements/      # Bulletin board composer
│   │   │   ├── notifications/      # School notifications broadcast
│   │   │   ├── reports/            # Student, attendance & grade analytics
│   │   │   ├── audit-logs/         # Security & administrative audit logs
│   │   │   ├── settings/           # School metadata & grading scale editor
│   │   │   └── users/              # Account access & status administration
│   │   ├── teacher/                # 11 Teacher-specific workflow views
│   │   │   ├── dashboard/          # Assigned classes & urgent tasks
│   │   │   ├── classes/            # Cohorts assigned to logged-in teacher
│   │   │   ├── students/           # Assigned student rosters
│   │   │   ├── subjects/           # Assigned subject catalog
│   │   │   ├── attendance/         # Interactive roll call register with bulk mark
│   │   │   ├── exams/              # Scheduled examinations for assigned classes
│   │   │   ├── enter-scores/       # Real-time score entry & live grade calculation
│   │   │   ├── results/            # Subject score review
│   │   │   ├── timetable/          # Faculty personal weekly schedule
│   │   │   ├── announcements/      # Bulletins relevant to faculty
│   │   │   └── profile/            # Faculty profile & credentials
│   │   ├── student/                # 8 Student self-service views
│   │   │   ├── dashboard/          # Academic summary & upcoming timetable
│   │   │   ├── profile/            # Personal & guardian information
│   │   │   ├── subjects/           # Current enrolled subjects
│   │   │   ├── attendance/         # Student personal attendance breakdown
│   │   │   ├── results/            # Published exam scores & grades
│   │   │   ├── report-card/        # Printable official student report card
│   │   │   ├── timetable/          # Class weekly schedule
│   │   │   └── announcements/      # Student notifications & announcements
│   │   ├── login/                  # Multi-role authentication portal
│   │   └── page.tsx                # Auto-redirect router
│   ├── components/                 # Reusable UI primitives & layout shells
│   ├── lib/                        # API client, auth context & token storage
│   └── package.json
│
├── prisma/
│   ├── schema.prisma               # Complete 20-model database schema
│   └── seed.ts                     # Comprehensive demo dataset generator
│
├── .env.example                    # Environment variable template
├── .gitignore
└── package.json                    # Workspace root orchestration scripts
```

---

## 🗄️ Database Schema Summary

The database uses 20 normalized tables in PostgreSQL:

1. **`User`**: Base authentication table (`email`, `password` bcrypt hashed, `role` [ADMIN, TEACHER, STUDENT], `status`).
2. **`Student`**: Student demographic and guardian records (`studentNumber`, `admissionNumber`, `dob`, `guardianName`, `guardianPhone`, `emergencyContact`).
3. **`Teacher`**: Faculty staff directory (`employeeNumber`, `qualification`, `specialization`, `employmentDate`).
4. **`AcademicYear`**: School calendar years (`2026/2027`, `startDate`, `endDate`, `isCurrent`).
5. **`Term`**: Term periods per academic year (`Term 1`, `Term 2`, `Term 3`, `isCurrent`).
6. **`Class`**: Grade levels (`Grade 7`, `Grade 8`, `Grade 9`, `capacity`).
7. **`Section`**: Cohort subdivisions (`Section A`, `Section B`).
8. **`Subject`**: Academic disciplines (`code`, `name`, `creditHours`, `maxScore`, `passScore`).
9. **`TeacherSubjectClassAssignment`**: Core relational bridge enforcing teacher authorization boundaries (`teacherId`, `subjectId`, `classId`, `sectionId`, `academicYearId`, `termId`).
10. **`Enrollment`**: Historical and active student class/section placements (`studentId`, `academicYearId`, `classId`, `sectionId`).
11. **`Attendance`**: Daily status logs (`PRESENT`, `ABSENT`, `LATE`, `EXCUSED`, `date`, `remarks`).
12. **`Exam`**: Exam sessions (`name`, `type` [MIDTERM, FINAL, QUIZ], `status` [DRAFT, OPEN, CLOSED, PUBLISHED]).
13. **`ExamSubject`**: Class and subject links for an exam with specific max and pass scores.
14. **`ExamResult`**: Graded submissions (`score`, `grade`, `gradePoint`, `remarks`, `publishedAt`).
15. **`GradingScale`**: Dynamic grade definitions (`name`, `minScore`, `maxScore`, `gradePoint`, `description`).
16. **`Timetable`**: Period schedule blocks (`dayOfWeek`, `startTime`, `endTime`, `room`).
17. **`Announcement`**: Broadcast bulletins (`title`, `content`, `audience` [ALL, TEACHERS, STUDENTS], `publishedAt`).
18. **`Notification`**: Individual inbox messages (`title`, `message`, `type`, `isRead`).
19. **`AuditLog`**: Tamper-evident admin trail (`action`, `entity`, `entityId`, `description`, `ipAddress`).
20. **`SchoolSetting`**: Key-value system configuration store.

---

## 🔐 Authentication & Role-Based Authorization

### Credentials & Token Lifecycle
- Passwords are encrypted using **bcryptjs** (salt rounds: 10).
- Authentication uses signed JSON Web Tokens (`jwt.sign`) including `userId`, `email`, and `role`.
- The Express backend parses and validates bearer tokens via `authenticateToken` middleware.
- The `authorizeRoles` guard rejects unauthorized requests with `403 Forbidden`.
- Assignment verification middleware ensures teachers cannot mutate or access records for students, exams, or classes outside their active teaching allocations.

### Access Matrix

| Feature Domain | Admin | Teacher | Student |
|---|---|---|---|
| **User Accounts & Settings** | Full Access | No Access | No Access |
| **Audit Logs** | View All | No Access | No Access |
| **Academic Years & Terms** | Full Access | Read-Only | Read-Only |
| **Curriculum & Classes** | Full Access | Assigned Classes | Enrolled Class |
| **Teacher Allocations** | Full Access | Own Allocations | No Access |
| **Student Directory** | Full CRUD | Assigned Students | Self Profile Only |
| **Attendance** | Full School-wide | Mark Assigned Cohorts | View Own Record |
| **Exams** | Full CRUD & Publish | View Assigned Cohorts | View Published Only |
| **Score Entry** | Review & Override | Enter Assigned Subjects | No Access |
| **Results & Report Cards** | Publish & Generate | View Assigned | View Own Published |
| **Timetable** | Full Scheduling | Assigned Schedule | Enrolled Class Schedule |
| **Announcements** | Create & Broadcast | View Faculty/All | View Student/All |

---

## ⚡ Quick Start & Running Locally

### 1. Prerequisites
- **Node.js** v18+ or v20+
- **npm** v9+
- Active internet access for Supabase PostgreSQL connectivity

### 2. Environment Configuration
Create a `.env` file in the root directory (or copy from `.env.example`):

```env
# Supabase PostgreSQL Connection Strings
DATABASE_URL="postgresql://postgres.xxx:yyy@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?schema=school_management&pgbouncer=true"
DIRECT_URL="postgresql://postgres.xxx:yyy@aws-0-eu-central-1.pooler.supabase.com:5432/postgres?schema=school_management"

# Backend API Configuration
PORT=4000
JWT_SECRET="super-secure-production-school-management-secret-key-2026"
CORS_ORIGIN="http://localhost:3000"

# Frontend Configuration
NEXT_PUBLIC_API_URL="http://localhost:4000/api"
```

### 3. Install Dependencies
```bash
# Root & sub-projects
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

### 4. Database Setup & Seeding
```bash
# Generate Prisma Client
npm run prisma:generate

# Synchronize Schema with Supabase PostgreSQL (schema: school_management)
npm run prisma:push

# Seed Development & Demo Data
npm run prisma:seed
```

### 5. Running the Application
You can run both backend and frontend concurrently from the root:
```bash
npm run dev
```

Or run each service independently in separate terminals:
```bash
# Backend (Port 4000)
npm run dev:backend

# Frontend (Port 3000)
npm run dev:frontend
```

Open your browser at **`http://localhost:3000`**.

---

## 🔑 Demo Seed Accounts (Development & Testing)

The database seed provides pre-configured accounts with realistic data:

| Role | Email | Password | Assigned Cohorts / Description |
|---|---|---|---|
| **Admin** | `admin@school.local` | `Admin123!` | Full unrestricted access to all school modules |
| **Teacher** | `ahmed.hassan@school.local` | `Teacher123!` | Assigned to Grade 8A (Mathematics & Physics) |
| **Teacher** | `sarah.jenkins@school.local` | `Teacher123!` | Assigned to Grade 7A & 8B (English Language) |
| **Student** | `student@school.local` | `Student123!` | Enrolled in Grade 8A (`STD-2026-0001` - Khalid Warsame) |

> 💡 **Tip:** The `/login` page features 1-click **Quick Demo Fill** buttons for immediate role testing.

---

## 📡 API Endpoints Overview

All endpoints are prefixed with `/api` and return standardized JSON:
```json
{
  "success": true,
  "data": {},
  "message": "Operation successful"
}
```

### Core API Routes
- `POST /api/auth/login` — Authenticate and receive JWT token + user profile
- `GET /api/auth/me` — Verify session and fetch current user profile
- `GET/POST /api/students` — Search, paginate, or register new student (atomic transaction)
- `GET/POST /api/teachers` — Faculty staff directory & registration
- `GET/POST /api/classes` — Manage grades and section allocations
- `GET/POST /api/subjects` — Manage curriculum subjects
- `GET/POST /api/academic-years` — Calendar lifecycle & current term switching
- `GET/POST /api/assignments` — Teacher-subject-class matrix
- `GET/POST /api/attendance` — Roll call records, bulk submission & attendance rates
- `GET/POST /api/exams` — Exam periods & exam-subjects
- `GET/POST /api/results` — Score entry sheet, grade calculation & publishing
- `GET /api/results/report-card/:studentId` — Official multi-subject report card data
- `GET/POST /api/timetable` — Weekly scheduling with conflict avoidance
- `GET/POST /api/announcements` — Targeted bulletins
- `GET /api/notifications` — In-app alerts
- `GET /api/reports/dashboard` — Executive institutional metrics
- `GET /api/audit-logs` — Administrative security audit trail
- `GET/PUT /api/settings` — School profile & grading scale configuration

---

## 🛡️ Production & Security Considerations

1. **Environment Variables**: Never commit `.env` files. Both `DATABASE_URL` and `DIRECT_URL` must remain server-side.
2. **Reverse Proxy & TLS**: In production environments (e.g. AWS ECS, Render, Vercel), ensure SSL termination and enforce HTTPS.
3. **Database Schema**: The isolated PostgreSQL schema `school_management` protects against collisions when using a shared database cluster.
4. **Rate Limiting**: Can be attached to `/api/auth/login` via express-rate-limit in high-traffic deployments.

---

## 📄 License
This project is proprietary and intended for institutional school management deployments.
