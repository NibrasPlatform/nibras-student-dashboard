# Nibras Backend API

Express.js + MongoDB backend for the Nibras Student Dashboard.

## Quick Start

```bash
npm install
cp .env.example .env
npm run dev
```

Production:

```bash
npm start
```

## Backend Structure

```text
server/
├── src/
│   ├── app.js
│   ├── config/
│   │   └── database.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Course.js
│   │   └── Achievement.js
│   └── routes/
│       ├── auth.routes.js
│       ├── user.routes.js
│       ├── leaderboard.routes.js
│       ├── course.routes.js
│       └── achievement.routes.js
├── .env.example
└── package.json
```

## Runtime Behavior

- Security middleware (`helmet`, `cors`) is applied before static serving.
- Static frontend assets are served from `../client`.
- `morgan("dev")` logging is enabled when `NODE_ENV !== "production"`.
- Graceful shutdown closes the HTTP server and MongoDB connection.
- Global process handlers are configured for:
  - `SIGINT`
  - `SIGTERM`
  - `unhandledRejection`
  - `uncaughtException`

## Environment Variables

```env
# Server
PORT=3000
NODE_ENV=development

# Database (Option A: full URI)
MONGODB_URI=

# Database (Option B: from parts, used if MONGODB_URI is empty)
MONGODB_HOST=localhost
MONGODB_PORT=27017
MONGODB_DB=nibras
MONGODB_USER=your-mongodb-username
MONGODB_PASSWORD=your-mongodb-password
MONGODB_AUTH_SOURCE=admin

# Auth
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d

# CORS
FRONTEND_URL=http://localhost:3000
```

## API Endpoints

### Authentication

- `POST /api/auth/register`
- `POST /api/auth/login`

### Users

- `GET /api/users/me` (auth required)
- `PUT /api/users/me` (auth required)
- `GET /api/users/:id`

### Leaderboard

- `GET /api/leaderboard`
- `GET /api/leaderboard/my-rank` (auth required)

### Courses

- `GET /api/courses`
- `GET /api/courses/:id`
- `POST /api/courses/:id/enroll` (auth required)

### Achievements

- `GET /api/achievements`
- `GET /api/achievements/my` (auth required)
- `POST /api/achievements/seed`
