const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config();

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const leaderboardRoutes = require("./routes/leaderboard.routes");
const courseRoutes = require("./routes/course.routes");
const achievementRoutes = require("./routes/achievement.routes");

const errorHandler = require("./middleware/errorHandler");
const connectDB = require("./config/database");

const app = express();

// ── Security Middleware ─────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
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
const clientPath = path.join(__dirname, "../../client");
app.use(express.static(clientPath));

// Redirect root to dashboard page so relative assets resolve correctly
app.get("/", (req, res) => {
  res.redirect("/dashboard/dashboard.html");
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
let server;

// Graceful shutdown
let isShuttingDown = false;
const shutdown = (signal, exitCode = 0) => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\n${signal} received. Shutting down gracefully...`);

  if (!server) {
    process.exit(exitCode);
  }

  const forceExitTimer = setTimeout(() => {
    console.error("❌ Forced shutdown after timeout");
    process.exit(1);
  }, 10000);

  server.close(async () => {
    clearTimeout(forceExitTimer);
    try {
      await mongoose.connection.close(false);
      console.log("✅ MongoDB connection closed");
    } catch (error) {
      console.error("❌ Error closing MongoDB connection:", error.message);
    }
    console.log("✅ Server closed");
    process.exit(exitCode);
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Rejection:", err);
  shutdown("unhandledRejection", 1);
});
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
  shutdown("uncaughtException", 1);
});

const startServer = async () => {
  await connectDB();
  server = app.listen(PORT, () => {
    console.log(`🚀 Nibras API running on http://localhost:${PORT}`);
  });
};

startServer().catch((error) => {
  console.error("❌ Failed to start server:", error.message);
  process.exit(1);
});

module.exports = app;
