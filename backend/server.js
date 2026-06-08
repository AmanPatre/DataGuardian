import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import siteRoutes from "./routes/siteRoutes.js";
import connectDB from "./config/db.js";
import { setupSwagger } from "./config/swagger.js";

const app = express();

// ── 1. Security headers (must be first) ──────────────────────────────────────
app.use(helmet());

// ── 2. Rate limiting (before routes) ─────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                  // 100 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", limiter);

// ── 3. CORS ───────────────────────────────────────────────────────────────────
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:5173",
    "chrome-extension://*",
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));

// ── 4. Body parsing ───────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ── 5. Request logging ────────────────────────────────────────────────────────
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} [${new Date().toISOString()}]`);
  next();
});

// ── 6. Database connection ────────────────────────────────────────────────────
connectDB();

// ── 7. Health check ───────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ── 8. Routes ─────────────────────────────────────────────────────────────────
// API Documentation
setupSwagger(app);

// Routes
app.use("/api/sites", siteRoutes);

// ── 9. Global error handler (must be last) ────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("Global error:", err);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === "production" ? "Server error" : err.message,
  });
});

// ── 10. Start server ──────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

// ── 11. Graceful shutdown ─────────────────────────────────────────────────────
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  server.close(() => {
    process.exit(1);
  });
});
