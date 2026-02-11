# Nibras Student Dashboard

Full-stack student platform with an Express/MongoDB backend and modular frontend pages served from a unified `client/` directory.

## Project Structure

```text
nibras-student-dashboard/
├── client/                       # Frontend (HTML/CSS/JS modules)
│   ├── dashboard/
│   ├── courses/
│   ├── competitions/
│   ├── community/
│   ├── achievements/
│   ├── analytics/
│   ├── ai-tutor/
│   ├── settings/
│   └── assets/
├── server/                       # Backend API
│   ├── src/
│   │   ├── app.js
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── models/
│   │   └── routes/
│   ├── .env.example
│   └── package.json
└── README.md
```

## Backend Highlights

- Security middleware (`helmet`, `cors`) runs before static file serving.
- Request logging with `morgan` in non-production environments.
- MongoDB connection supports:
  - direct `MONGODB_URI`
  - or URI built from auth-aware env vars (`MONGODB_USER`, `MONGODB_PASSWORD`, etc.).
- Graceful shutdown on `SIGINT`/`SIGTERM` with HTTP server and MongoDB connection close.
- Global handlers for `unhandledRejection` and `uncaughtException`.

## Quick Start

```bash
cd server
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:3000` for the dashboard entry page.

## Frontend Entry Examples

- Dashboard: `/dashboard/dashboard.html`
- Courses: `/courses/courses.html`
- Competitions: `/competitions/contests/contest.html`
- Community: `/community/community.html`

## API Documentation

Backend details and endpoints: [server/README.md](server/README.md)
