# MA Dashboard

A React + TypeScript dashboard built with Vite for managing projects, members, and project submissions with role-based access (Admin, User, Viewer).

## Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- Chart.js (`chart.js` + `react-chartjs-2`)

## Features

- Production login at `/login` against the Render API with role-based access for Admin, User, and Viewer
- First-login password change for new accounts before the main dashboard opens
- Admin dashboard: project management (create, update, assign), member management, and admin project views
- User dashboard: assigned project workflows and submission entry
- Viewer dashboard: read-only access to assigned project data
- Submission tracking and trend visualizations backed by production dashboard APIs
- Tonnage comparison bar charts (`Total Tonnage` vs `Actual Tonnage`) on Dashboard and Project Summary
- Project Summary actions:
  - Export report (CSV)
  - Delete individual line entries

## Getting Started

### Prerequisites

- Node.js 18+ (recommended)
- npm

### Install

```bash
npm install
```

### Run in Development

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Deployment workflow

1. Deploy the backend on Render and the frontend on Vercel.
2. Set `VITE_API_URL` on Vercel to the Render API URL and redeploy the frontend.
3. Copy existing application data into production when needed using `MA-api/scripts/copy_application_data.py`.
4. Configure deployment login accounts on Render when a role account is missing (`INITIAL_ADMIN_*`, `INITIAL_USER_*`, `INITIAL_VIEWER_*`).
5. Sign in at `/login` with the matching role credentials:
   - Admin opens the admin dashboard.
   - User opens assigned project workflows.
   - Viewer opens read-only assigned project views.
6. Accounts with `first_login=false` open their dashboard immediately. Accounts with `first_login=true` complete First Login Setup first.

## Backend login

Users are stored in the MA-api PostgreSQL database. For a fresh database, create your first admin on the server:

```bash
cd ../MA-api   # or your MA-api path
python -m backend.create_initial_admin your_username 'YourPassword8+'
```

For production, prefer the Render deployment account variables or the application data copy workflow described in `MA-api/README.md`. Additional members can still be created from the **Members** screen (admin only).

To remove old demo accounts (`operator` / `viewer`) or wipe all projects, see **Cleaning demo / sample data** in `MA-api/README.md`.

## Project Structure

```text
MA/
  src/
    App.tsx
    components/
    types/
  public/
  package.json
```

## Notes

- The API must be running and `VITE_API_URL` in `.env` should point at it (see MA-api).
- The frontend now uses bulk dashboard loading (`GET /dashboard-data/bulk`) for faster project data hydration.
