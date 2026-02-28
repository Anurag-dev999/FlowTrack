# 🌊 FlowTrack

**FlowTrack** is a premium, developer-friendly business management dashboard designed for modern teams. It provides a centralized hub to track tasks, monitor revenue trends, manage team performance, and gain actionable insights through real-time analytics.

Built with a focus on visual excellence and performance, FlowTrack delivers a seamless experience for both developers and business clients.

---

## 🚀 Project Overview

The core purpose of FlowTrack is to streamline business operations by visualizing complex data into digestible KPIs and interactive charts.

### Key Features
- **Intelligent Dashboard**: Real-time KPI Tracking including Revenue trends, Active Tasks, and Completion Rates.
- **Dynamic Analytics**: Interactive Line and Pie charts for revenue distribution and task status monitoring.
- **Advanced Task Management**: Full CRUD operations for tasks with priority leveling, status tracking, and automated activity logging.
- **Team Hub**: Comprehensive team member directory with activity tracking and performance metrics.
- **Modern UI/UX**: Premium "Glassmorphism" design with dark mode support, smooth micro-animations, and responsive layouts.
- **Server-First Architecture**: Leverages Next.js Server Components for lightning-fast initial loads and centralized data fetching.

---

## 🛠 Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | [Next.js 16](https://nextjs.org/) (App Router), [React 19](https://react.dev/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/), Lucide React, Radix UI |
| **Database** | [Supabase](https://supabase.com/) (PostgreSQL) |
| **Charts** | [Recharts](https://recharts.org/) |
| **Forms/Validation** | React Hook Form, Zod |
| **Analytics** | Vercel Analytics |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |

---

## 🏗 Architecture Overview

FlowTrack follows a clean, layered architecture to ensure scalability and maintainability:

- **Frontend Structure**: Utilizes the Next.js App Router. Pages are organized into feature folders (`/tasks`, `/team`, `/analytics`).
- **Data Flow**: Adheres to a "Downward Dependency" rule. Types -> Supabase Clients -> Query Layer -> Analytics Layer -> UI Pages.
- **Server vs Client Components**: 
    - **Server Components** fetch initial data in parallel using `lib/queries`.
    - **Client Components** handle user interactivity, forms, and client-side charts.
- **Supabase Integration**: Centralized client initialization in `lib/supabase` with type-safe wrappers for consistent error handling across the app.

---

## 📥 Installation Guide

Follow these steps to set up FlowTrack locally:

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-username/flowtrack.git
   cd flowtrack
   ```

2. **Install Dependencies**
   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Environment Variable Setup**
   Create a `.env.local` file in the root directory and add your Supabase credentials (see [Environment Variables](#environment-variables) section).

4. **Supabase Configuration**
   Ensure your Supabase tables are set up according to the [Database Setup](#database-setup-supabase) section below.

5. **Run Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

---

## 🔑 Environment Variables

The following environment variables are required:

| Variable | Description |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL (Project Settings > API) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase project Anonymous Key (Project Settings > API) |

---

## 🗄 Database Setup (Supabase)

FlowTrack requires a specific PostgreSQL schema. You can find the complete SQL setup script here:

supabase query **[scripts/setup-database.sql] (scripts/setup-database.sql)**

### How to configure:
1. Open your **Supabase Dashboard**.
2. Navigate to the **SQL Editor** in the left sidebar.
3. Click **"New query"**.
4. Paste the content of `scripts/setup-database.sql` into the editor.
5. Click **"Run"**.

This script will automatically:
- Create all required tables (`tasks`, `revenue`, `team_members`, `activity_logs`).
- Populate the database with sample data for testing.
- Enable **Row Level Security (RLS)** for future security modules.

> [!TIP]
> You can find the associated TypeScript interfaces in `lib/types/index.ts`.

---

## 🚀 Running Locally

```bash
# Start development mode
npm run dev

# Run lint checks
npm run lint

# Clean build
npm run build
```

---

## 📦 Build & Production

To create an optimized production build:

```bash
npm run build
```

The build artifacts will be stored in the `.next/` directory. You can start the production server using:

```bash
npm run start
```

---

## ☁️ Deployment (Netlify)

FlowTrack is optimized for deployment on **Netlify**:

1. **Connect Repository**: Link your GitHub/GitLab repository to Netlify.
2. **Build Settings**:
   - **Build Command**: `npm run build`
   - **Publish Directory**: `.next`
3. **Environment Variables**: Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the Netlify Site Configuration.
4. **Deployment**: Netlify will automatically detect the Next.js framework and deploy using the Next.js Runtime.

---

## 📂 Folder Structure

```text
├── app/             # App Router pages and API routes
├── components/      # Reusable UI (dashboard layout, KPI cards, shadcn/ui)
├── lib/             # Business logic, query layer, and Supabase config
├── hooks/           # Custom React hooks
├── public/          # Static assets (icons, images)
├── scripts/         # Utility scripts
├── styles/          # Global styles (Tailwind CSS)
└── tsconfig.json    # TypeScript configuration
```

---

## 📜 Scripts

- `dev`: Launches the development server with Hot Module Replacement.
- `build`: Triggers the Next.js production build process.
- `start`: Runs the compiled production application.
- `lint`: Performs static analysis to ensure code quality via ESLint.

---

## 🔧 Troubleshooting

- **Supabase Icons/Images not loading**: Verify that `next.config.mjs` has `images.unoptimized: true` set if using Supabase storage without a custom loader.
- **Build Errors**: Check for TypeScript errors. The project is configured to ignore build errors in `next.config.mjs` temporarily, but strict typing is recommended for production.
- **Database Connection**: Ensure your IP is whitelisted in Supabase if using local development or that the environment variables are correctly prefixed with `NEXT_PUBLIC_`.

---

## 🗺 Future Improvements

- [ ] **Auth Integration**: Implement Supabase Auth for multi-user dashboard access.
- [ ] **Real-time Engine**: Integrate Supabase Realtime for live task updates without page refresh.
- [ ] **Data Export**: PDF and CSV export functionality for analytics reports.
- [ ] **Redis Caching**: Add a Redis layer for high-frequency KPI metric calculations.

---

*Made with ❤️ by Anurag*
