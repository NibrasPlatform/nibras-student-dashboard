# Nibras Backend API

Express.js backend for the Nibras Student Dashboard.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start
```

## 📁 Structure

```
server/
├── src/
│   ├── app.js              # Express app entry point
│   ├── config/
│   │   └── database.js     # MongoDB connection
│   ├── middleware/
│   │   ├── auth.js         # JWT authentication
│   │   └── errorHandler.js # Centralized error handling
│   ├── models/
│   │   ├── User.js         # User schema
│   │   ├── Course.js       # Course schema
│   │   └── Achievement.js  # Achievement schema
│   └── routes/
│       ├── auth.routes.js        # POST /api/auth/register, /login
│       ├── user.routes.js        # GET /api/users/me, /:id
│       ├── leaderboard.routes.js # GET /api/leaderboard
│       ├── course.routes.js      # GET /api/courses, /:id, POST /:id/enroll
│       └── achievement.routes.js # GET /api/achievements
├── .env                    # Environment variables
└── package.json
```

## 🔌 API Endpoints

### Authentication

| Method | Endpoint             | Description       |
| ------ | -------------------- | ----------------- |
| POST   | `/api/auth/register` | Register new user |
| POST   | `/api/auth/login`    | Login user        |

### Users

| Method | Endpoint         | Description                      |
| ------ | ---------------- | -------------------------------- |
| GET    | `/api/users/me`  | Get current user (auth required) |
| PUT    | `/api/users/me`  | Update profile (auth required)   |
| GET    | `/api/users/:id` | Get user public profile          |

### Leaderboard

| Method | Endpoint                   | Description                                          |
| ------ | -------------------------- | ---------------------------------------------------- |
| GET    | `/api/leaderboard`         | Get rankings (filter: overall, weekly, achievements) |
| GET    | `/api/leaderboard/my-rank` | Get user's rank (auth required)                      |

### Courses

| Method | Endpoint                  | Description                      |
| ------ | ------------------------- | -------------------------------- |
| GET    | `/api/courses`            | List all courses                 |
| GET    | `/api/courses/:id`        | Get course details               |
| POST   | `/api/courses/:id/enroll` | Enroll in course (auth required) |

### Achievements

| Method | Endpoint                 | Description                             |
| ------ | ------------------------ | --------------------------------------- |
| GET    | `/api/achievements`      | List all achievements                   |
| GET    | `/api/achievements/my`   | Get user's achievements (auth required) |
| POST   | `/api/achievements/seed` | Seed default achievements               |

## ⚙️ Environment Variables

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/nibras
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5500
```

## 📋 Prerequisites

- Node.js 18+
- MongoDB running locally or MongoDB Atlas URI
