const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
require("dotenv").config();

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const leaderboardRoutes = require("./routes/leaderboard.routes");
const courseRoutes = require("./routes/course.routes");
const achievementRoutes = require("./routes/achievement.routes");

const errorHandler = require("./middleware/errorHandler");
const connectDB = require("./config/database");

const app = express();

// Connect to Database
connectDB();

// ── Security Middleware ─────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5500",
    credentials: true,
  }),
);

// ── Body Parsing ────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Request Logging (dev only) ──────────────────────────────────────
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// ── Static Files (after security middleware) ────────────────────────
const dashboardPath = path.join(__dirname, "../../dashboard");
app.use(express.static(dashboardPath));

// Serve root as dashboard.html
app.get("/", (req, res) => {
  res.sendFile(path.join(dashboardPath, "dashboard.html"));
});

// ── API Routes ──────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/achievements", achievementRoutes);

// Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Error Handler (must be last) ────────────────────────────────────
app.use(errorHandler);

// ── Start Server ────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Nibras API running on http://localhost:${PORT}`);
});

// Graceful shutdown
const shutdown = (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Rejection:", err.message);
  server.close(() => process.exit(1));
});

module.exports = app;
