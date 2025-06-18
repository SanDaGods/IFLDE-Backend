require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const app = express();

// ENV Variables
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL?.replace(/\/$/, "") || "http://localhost:3000";

// Middleware
app.use(express.json());
app.use(cookieParser());

// CORS Configuration
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
  exposedHeaders: ["set-cookie"],
}));

console.log(`🌐 Allowed origin for CORS: ${FRONTEND_URL}`);

// Serve static frontend if built into backend (optional)
app.use(express.static(path.join(__dirname, "frontend")));

// MongoDB Connection
const connectDB = require("./config/db");

// Routes
const routes = require("./routes");
const applicants = require("./routes/applicantRoutes");
const admins = require("./routes/adminRoutes");
const assessors = require("./routes/assessorRoutes");
const authRoutes = require("./routes/authRoutes");

app.use("/", routes);
app.use("/applicants", applicants);
app.use("/admins", admins);
app.use("/assessors", assessors);
app.use("/api", authRoutes);

// Health Check
app.get("/api/test", (req, res) => {
  res.json({ message: "✅ Backend working and CORS allowed." });
});

// Base Route
app.get("/", (req, res) => {
  res.send("✅ ETEEAP Backend is live.");
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("❌ Unhandled error:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error",
    details: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Start Server
(async () => {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await connectDB();
    console.log("✅ MongoDB connected");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
})();
