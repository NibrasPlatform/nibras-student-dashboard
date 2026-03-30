# Nibras Student Dashboard

A full-stack student dashboard application with community Q&A features, course management, competitions, achievements, and AI tutoring capabilities.

## Project Structure

```
NIBRAS-STUDENT-DASHBOARD/
├── client/                    # Frontend (HTML, CSS, JavaScript)
│   ├── Community/            # Community Q&A feature
│   ├── Dashboard/            # Main dashboard
│   ├── Courses/              # Course management
│   ├── Competitions/         # Coding competitions
│   ├── Achievements/         # User achievements & leaderboard
│   ├── Ai-tutor/             # AI tutoring features
│   ├── Analytics/            # Analytics & reporting
│   ├── Settings/             # User settings
│   └── Login/                # Authentication pages
├── backend/                   # Backend API (Node.js, Express, MongoDB)
│   ├── src/
│   │   ├── controllers/       # Route controllers
│   │   ├── models/           # Database models
│   │   ├── routes/           # API routes
│   │   ├── services/         # Business logic
│   │   ├── middlewares/      # Auth & validation
│   │   ├── utils/            # Utility functions
│   │   ├── realtime/         # Socket.io events
│   │   ├── app.js            # Express app setup
│   │   └── server.js         # Server entry point
│   ├── package.json
│   └── .env.example
└── README.md
```

## Features

### Implemented
- **Community Q&A**
  - Post questions with tags
  - View question details with comments
  - Upvote/downvote questions and answers
  - Search questions by title, content, tags, or author
  - Filter by Recent, Popular, Unanswered
  - Real-time comment updates

### Backend API Endpoints

| Endpoint | Method | Auth Required | Description |
|----------|--------|---------------|-------------|
| `/auth/register` | POST | No | Register new user |
| `/auth/login` | POST | No | Login user |
| `/questions` | GET | No | Get all questions |
| `/questions` | POST | Yes | Create new question |
| `/questions/:id` | GET | No | Get single question with comments |
| `/comments/:questionId` | POST | Yes | Add comment to question |
| `/votes` | POST | Yes | Cast/upvote/downvote |
| `/votes/:targetType/:targetId` | GET | Yes | Get user's vote |

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- [MongoDB](https://www.mongodb.com/) database
- npm or yarn

### Backend Setup

1. Navigate to the backend folder:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```
   Fill in your actual values in `.env`:
   - `PORT` - Server port (default: 5000)
   - `MONGODB_URI` - Your MongoDB connection string
   - `JWT_SECRET` - Secret key for JWT tokens

4. Start the server:
   ```bash
   # Production
   npm start

   # Development (with auto-reload)
   npm run dev
   ```

   The server will run on `http://localhost:5000`

### Frontend Setup

The frontend consists of static HTML files. You can serve them in several ways:

**Option 1: Using the Backend Server**
The backend is configured to serve static files from the `client` folder automatically.

**Option 2: Using VS Code Live Server**
Install the "Live Server" extension and right-click on any HTML file → "Open with Live Server"

**Option 3: Direct File Access**
Simply open `client/Login/loginPage/login.html` in your browser to start.

## Configuration

### CORS
The backend allows cross-origin requests. If you're serving frontend from a different port/domain, update CORS settings in `backend/src/app.js` if needed.

### File Paths
All HTML file paths in the project use relative paths. Make sure to:
- Serve the backend from the project root
- Or adjust paths based on your server configuration

## Authentication

The app uses JWT (JSON Web Tokens) for authentication:

1. User logs in → receives JWT token
2. Token is stored in `localStorage`
3. Token is sent with every API request in the `Authorization: Bearer <token>` header

## Development

### Backend Development
```bash
cd backend
npm run dev
```

### Frontend Development
- Edit HTML/CSS/JS files directly
- Refresh browser to see changes
- Use browser DevTools for debugging

### Adding New Features

1. **Backend**: Add routes → controllers → services
2. **Frontend**: Update HTML structure → add JavaScript logic → style with CSS
3. **Test**: Verify API works with tools like Postman
4. **Integrate**: Connect frontend to backend endpoints

## Deployment

### Backend Deployment (Example: Render/Railway/Heroku)
1. Set environment variables on the platform
2. Ensure `PORT` uses the platform's provided port
3. Deploy code
4. Update frontend's `BACKEND_URL` to point to deployed API

### Frontend Deployment
The static files can be deployed to:
- GitHub Pages
- Netlify
- Vercel
- Any static hosting

## Routes / Pages

| Route | Description |
|-------|-------------|
| `/login` | Login page with role selector (Student/Instructor/Admin) |
| `/dashboard` | KPI cards + Recent Activities + Deadlines |
| `/courses` | Course management with tabs |
| `/competitions` | Contests / Practice / History / Rankings |
| `/community` | Q&A with Recent/Popular/Unanswered tabs |
| `/achievements` | Achievements / Leaderboard / Reputation |
| `/ai-tutor` | AI Tutor / Recommendations / Insights |
| `/settings` | User settings |

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

[Your License Here]

## Support

For issues or questions:
1. Check the browser console for errors
2. Verify backend is running on port 5000
3. Check network tab for API request failures
4. Review the error logs in the backend terminal
