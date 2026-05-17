# 🎯 GoalTracker — Employee Goal Management Portal

> A modern, full-stack goal tracking portal built for the **Atomberg Hackathon 2026**. Manage employee goals, quarterly check-ins, and performance reviews across three distinct user roles — all wrapped in a stunning glassmorphism UI with smooth animations.

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss)
![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-black?style=for-the-badge&logo=vercel)

---

## 🌐 Live Demo

🔗 **Production URL:** [https://atomberg-goals-cdb6juzf3-divya00005s-projects.vercel.app](https://atomberg-goals-cdb6juzf3-divya00005s-projects.vercel.app)

### 🔑 Demo Login Credentials

Use the following accounts to explore the portal from each role's perspective:

| Role | Email | Password |
|------|-------|----------|
| 👤 **Employee** | `employee@demo.com` | `password123` |
| 👨‍💼 **Manager** | `manager@demo.com` | `password123` |
| 🛡️ **Admin / HR** | `admin@demo.com` | `password123` |

> ⚠️ **Important:** To test multiple roles simultaneously, use separate browsers or an Incognito window. Logging into a second account in the same browser will override the first session.

---

## ✨ Key Features

### 📋 Employee Portal
- **Goal Creation** — Create up to 8 goals per year with validation rules (min 10% weightage, max 100% total).
- **Multiple UoM Types** — Supports Numeric (Maximize), Numeric (Minimize), Timeline, and Zero-Target measurement types.
- **Quarterly Check-ins** — Log actual achievements against planned targets with auto-calculated progress scores.
- **Smart Locking** — Check-in windows are enforced by calendar schedule (Q1 → July, Q2 → October, Q3 → January, Q4 → March/April).

### 👨‍💼 Manager Dashboard
- **Team Overview** — View all direct reports with real-time goal completion statistics.
- **Goal Approval Workflow** — Review, inline-edit, approve, or reject employee goal sheets with animated feedback.
- **Check-in Reviews** — Review quarterly submissions with Planned vs. Actual comparison charts and provide written feedback.

### 🛡️ Admin / HR Dashboard
- **Company-Wide Analytics** — Interactive donut charts showing goal distribution by status, and top performer leaderboards.
- **Goal Unlock** — Override approved goals and send them back to draft with a mandatory audit reason.
- **Escalation Module** — Rule-based nudge system for employees/managers who haven't completed required actions (logged to audit trail).
- **Shared Goals** — Push company-wide objectives directly into employee goal sheets from the admin panel.
- **CSV Export** — Download a comprehensive report of all employees, goals, check-in scores, and statuses.
- **Full Audit Trail** — Every admin action (unlock, escalation, shared goal push) is permanently logged with timestamps.

---

## 🏗️ Architecture

The application follows a **3-Tier Serverless Architecture** optimized for cost efficiency:

```
┌─────────────────────────────────────────────────────┐
│                  CLIENT TIER                        │
│   React 18 · Tailwind CSS · Framer Motion           │
│   Glassmorphism UI · 3D Animated Components         │
└────────────────────────┬────────────────────────────┘
                         │ HTTPS
┌────────────────────────▼────────────────────────────┐
│              APPLICATION TIER                       │
│   Next.js 14 App Router · Server Actions            │
│   Middleware (JWT Auth) · SSR Rendering              │
│   Hosted on Vercel (Serverless)                     │
└────────────────────────┬────────────────────────────┘
                         │ Supabase JS Client
┌────────────────────────▼────────────────────────────┐
│                  DATA TIER                          │
│   Supabase Auth (JWT Sessions)                      │
│   PostgreSQL Database (Goals, Check-ins, Logs)      │
│   Row Level Security (RLS) Policies                 │
└─────────────────────────────────────────────────────┘
```

### Why This Stack?

| Choice | Rationale |
|--------|-----------|
| **Next.js Server Actions** | Eliminates the need for a separate Express/Node API server, reducing infrastructure costs to **$0**. |
| **Supabase (Free Tier)** | Managed PostgreSQL + Auth + RLS in one platform. No server provisioning needed. |
| **Vercel (Free Tier)** | Automatic CI/CD from GitHub. Zero-config serverless deployment. |
| **Row Level Security** | Security enforced at the database level — even if the frontend is compromised, users cannot access each other's data. |

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript |
| **UI Library** | React 18 |
| **Styling** | Tailwind CSS 3.4 |
| **Animations** | Framer Motion, Canvas Confetti |
| **3D Effects** | Three.js (Animated Orb on Login) |
| **Icons** | Lucide React |
| **Component Library** | shadcn/ui (Radix Primitives) |
| **Database** | PostgreSQL (via Supabase) |
| **Authentication** | Supabase Auth (Email/Password) |
| **Security** | Row Level Security (RLS), JWT Middleware |
| **CSV Export** | PapaParse |
| **Hosting** | Vercel (Serverless) |
| **Version Control** | Git + GitHub |

---

## 🚀 Getting Started (Local Development)

### Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher
- A **Supabase** project (free tier works)

### 1. Clone the Repository

```bash
git clone https://github.com/Divya00005/atomberg-goals.git
cd atomberg-goals
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for Production

```bash
npm run build
npm start
```

---

## 📁 Project Structure

```
atomberg/
├── src/
│   ├── app/
│   │   ├── (auth)/login/       # Login page with 3D animated orb
│   │   ├── actions/            # Server Actions (API layer)
│   │   │   ├── goals.ts        # Goal CRUD & submission
│   │   │   ├── manager.ts      # Approval, rejection, inline editing
│   │   │   ├── checkins.ts     # Check-in logging & scoring
│   │   │   ├── admin.ts        # Analytics, unlock, audit log
│   │   │   ├── escalations.ts  # Nudge / escalation system
│   │   │   └── shared-goals.ts # Push shared goals to employees
│   │   ├── dashboard/
│   │   │   ├── employee/       # Employee goals & check-ins
│   │   │   ├── manager/        # Manager team view & reviews
│   │   │   └── admin/          # Admin analytics & management
│   │   ├── globals.css         # Design system & animations
│   │   └── layout.tsx          # Root layout with metadata
│   ├── components/
│   │   ├── admin/              # Admin-specific UI components
│   │   ├── checkins/           # Check-in forms & review panels
│   │   ├── effects/            # 3D orb, particles, visual effects
│   │   ├── goals/              # Goal cards, forms, list views
│   │   ├── manager/            # Manager dashboard components
│   │   └── ui/                 # Shared UI primitives (Button, Dialog, etc.)
│   ├── lib/                    # Supabase client & utility functions
│   └── types/                  # TypeScript type definitions
├── .env.local                  # Environment variables (not committed)
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## 📊 Database Schema

The application uses **5 core tables** in PostgreSQL:

| Table | Purpose |
|-------|---------|
| `profiles` | Stores user info (name, email, role, department, manager_id) |
| `goals` | Employee goals with thrust area, UoM, target, weightage, status |
| `check_ins` | Quarterly achievement data (actual values, scores, comments) |
| `audit_logs` | Immutable trail of all admin/system actions |
| `shared_goals` | Goals pushed by Admin to multiple employees simultaneously |

### Row Level Security (RLS)

Every table has strict RLS policies ensuring:
- **Employees** can only read/write their own data.
- **Managers** can read their direct reports' data and approve/reject goals.
- **Admins** have read access to all data and can perform unlock/escalation actions.

---

## 🧮 Auto-Scoring Logic

The system automatically calculates achievement scores based on the Unit of Measure:

| UoM Type | Formula | Example |
|----------|---------|---------|
| **Numeric — Maximize** | `(Actual / Target) × 100` | Target: 5M, Actual: 4.5M → **90%** |
| **Numeric — Minimize** | `(Target / Actual) × 100` | Target: 10, Actual: 8 → **125%** (capped at 100%) |
| **Timeline / Date** | `1 = Done (100%)`, `0 = Not Done (0%)` | Submitted: 1 → **100%** |
| **Zero Target** | `0 = Perfect (100%)`, `>0 = Failed (0%)` | Actual: 0 → **100%** |

The **Overall Score** is the weighted average across all goals.

---

## 📅 Check-in Schedule

The portal enforces strict quarterly windows as per the BRD:

| Period | Window Opens | Action |
|--------|-------------|--------|
| Phase 1 | May | Goal Creation, Submission & Approval |
| Q1 Check-in | July | Progress Update — Planned vs. Actual |
| Q2 Check-in | October | Progress Update — Planned vs. Actual |
| Q3 Check-in | January | Progress Update — Planned vs. Actual |
| Q4 / Annual | March–April | Final Achievement Capture |

> 💡 **Demo Tip:** Append `?demo_month=7` to the check-in URL to simulate July and unlock Q1 for testing.

---

## ✅ BRD Compliance Checklist

### Phase 1 & 2 (Mandatory)
- [x] Employee goal creation with validation (min 10%, max 100%, max 8 goals)
- [x] Manager goal review, inline editing, approval & rejection
- [x] Quarterly check-in with auto-scoring across 4 UoM types
- [x] Check-in schedule enforcement (Q1–Q4 locking)
- [x] Achievement report export (CSV)
- [x] Audit trail for all post-lock changes
- [x] Role-based access control (Employee, Manager, Admin)

### Good-to-Have Features (Bonus)
- [x] Escalation Module — Rule-based nudge system with audit logging
- [x] Analytics Module — Company-wide charts, goal distribution, top performers
- [x] Shared Goals — Admin can push org-wide objectives to employees
- [x] Goal Unlock — Admin override with mandatory reason tracking

---

## 🎨 Design Philosophy

The UI is built around a **glassmorphism** design language with:
- Dark theme with violet/indigo accent gradients
- Frosted glass card effects with `backdrop-filter: blur()`
- Smooth entrance animations powered by Framer Motion
- Interactive 3D animated orb on the login screen (Three.js)
- Confetti celebration on goal approval
- Floating particle effects throughout the dashboard
- Micro-animations on hover states for buttons and cards

---

## 👥 Team

Built by **Divya** for the Atomberg Internal Hackathon 2026.

---

## 📄 License

This project was built as part of an internal hackathon and is proprietary to Atomberg Technologies.
