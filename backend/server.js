require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const app = express();

// ======================
// Environment Variables
// ======================
const PORT = process.env.PORT || 8080;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

const ALLOWED_ORIGINS = [
  FRONTEND_URL,
  "http://localhost:3000", // Optional fallback for local dev
];

// ======================
// Middleware
// ======================

app.use(express.json());
app.use(cookieParser());

// ✅ Only ONE CORS setup — remove the duplicate below
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // Allow non-browser requests

      const originNormalized = origin.replace(/\/$/, "");
      const isAllowed = ALLOWED_ORIGINS.some((url) => originNormalized === url.replace(/\/$/, ""));

      if (isAllowed) {
        console.log(`✅ Allowed CORS for: ${origin}`);
        return callback(null, true);
      } else {
        console.warn(`🚨 Blocked CORS for: ${origin}`);
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ======================
// Database Connection
// ======================
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }
};

// ======================
// Routes
// ======================

// Health Check
app.get("/api/test", (req, res) => {
  res.json({
    status: "✅ Backend operational",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// API Endpoints
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/applicants", require("./routes/applicantRoutes"));
app.use("/api/admins", require("./routes/adminRoutes"));
app.use("/api/assessors", require("./routes/assessorRoutes"));

// ======================
// Static File Handling (Frontend support if needed)
// ======================

// Only do this if you're serving frontend files directly from backend
// Otherwise, delete these if you're deploying frontend separately (like in Railway)
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.send("✅ Backend is running. Visit /api/... for endpoints.");
});

// This line assumes there's an index.html in `public/`
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ======================
// Error Handling
// ======================
app.use((err, req, res, next) => {
  console.error("❌ Server error:", err.message);
  res.status(500).json({
    success: false,
    error: err.message || "Internal server error",
  });
});

// ======================
// Start Server
// ======================
(async () => {
  try {
    await connectDB();
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`
🚀 Server running on port ${PORT}
🌐 Allowed Origins: ${ALLOWED_ORIGINS.join(", ")}
      `);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
})();
