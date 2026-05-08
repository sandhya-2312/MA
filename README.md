# MA Dashboard

A React + TypeScript dashboard built with Vite for managing projects, members, and project submissions with role-based access (Admin, User, Viewer).

## Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- Chart.js (`chart.js` + `react-chartjs-2`)

## Features

- Role-based login flow
- First-login password change
- Project management (create, update, assign)
- Member management with role and project assignment
- User and viewer dashboard views
- Submission tracking and trend visualizations
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

## Backend login

Users are stored in the MA-api PostgreSQL database. After `alembic upgrade head`, create your first admin on the server:

```bash
cd ../MA-api   # or your MA-api path
python -m backend.create_initial_admin your_username 'YourPassword8+'
```

Then sign in through this app with that username and password. Additional members are created from the **Members** screen (admin only).

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

- The API must be running and `VITE_API_BASE_URL` in `.env` should point at it (see MA-api).
- The frontend now uses bulk dashboard loading (`GET /dashboard-data/bulk`) for faster project data hydration.
