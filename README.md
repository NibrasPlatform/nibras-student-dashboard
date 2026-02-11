# Nibras Student Dashboard

A comprehensive student dashboard for managing courses, competitions, community, achievements, and AI tutoring.

## 🏗️ Project Structure

```
nibras-student-dashboard/
├── server/                 # Express.js Backend API
│   └── src/
│       ├── config/         # Database configuration
│       ├── middleware/      # Auth & error handling
│       ├── models/         # Mongoose schemas (User, Course, Achievement)
│       └── routes/         # API endpoints
├── dashboard/              # Main dashboard page
├── courses/                # Course browsing & management
│   ├── assignments/        # Student assignments
│   ├── course-description/ # Course detail view
│   ├── grades/             # Grade tracking
│   ├── projects/           # Course projects
│   └── videos/             # Video lessons
├── competitions/           # Contests, practice, history, rankings
├── community/              # Discussion forum & Q&A
├── achievements/           # Achievements, leaderboard, reputation
├── ai-tutor/               # AI tutor, insights, recommendations
├── analytics/              # Analytics dashboard (instructor/admin)
├── settings/               # User settings
└── assets/                 # Static assets (images)
```

## 🚀 Quick Start

```bash
# Start the backend
cd server
npm install
npm run dev          # Development (with hot-reload)

# The dashboard is served at http://localhost:3000
```

## 🔧 Tech Stack

| Layer    | Technology              |
| -------- | ----------------------- |
| Backend  | Express.js, Node.js     |
| Database | MongoDB + Mongoose      |
| Auth     | JWT + bcrypt            |
| Frontend | Vanilla HTML / CSS / JS |

## 📖 API Documentation

See [server/README.md](server/README.md) for full API endpoint docs.

## 🗺️ Routes / Pages

| Route           | Description                                              |
| --------------- | -------------------------------------------------------- |
| `/`             | Dashboard — KPIs, activities, deadlines, progress        |
| `/courses`      | Courses — All / Core / Electives / Competitive           |
| `/competitions` | Competitions — Contests / Practice / History / Rankings  |
| `/community`    | Community — Recent / Popular / Unanswered / My Questions |
| `/achievements` | Achievements / Leaderboard / Reputation                  |
| `/ai-tutor`     | AI Tutor / Recommendations / Insights / Smart Routing    |
| `/analytics`    | Analytics — Overview / Students / Courses / Engagement   |
| `/settings`     | User settings                                            |
