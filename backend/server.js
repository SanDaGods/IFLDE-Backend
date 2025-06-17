require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  exposedHeaders: ["set-cookie"],
}));

// Optional: serve static files
app.use(express.static(path.join(__dirname, "frontend")));

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

// Health check
app.get("/api/test", (req, res) => {
  res.json({ message: " Backend working!" });
});

// Root path
app.get("/", (req, res) => {
  res.send(" ETEEAP Backend is live");
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(" Unhandled error:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error",
    details: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// MongoDB connection + start server
const connectDB = require("./config/db");
const PORT = process.env.PORT || 5000;

(async () => {
  try {
    console.log(" Connecting to MongoDB...");
    await connectDB();
    console.log(" MongoDB connected");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(` Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error(" Failed to start server:", err);
    process.exit(1);
  }
})();
