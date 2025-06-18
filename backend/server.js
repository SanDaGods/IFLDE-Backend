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
const PORT = process.env.PORT || 5000;
const PROD_FRONTEND_URL = "https://ifldefrontend-production.up.railway.app";
const ALLOWED_ORIGINS = [
  PROD_FRONTEND_URL,
  "http://localhost:3000"
];

// ======================
// Database Connection
// ======================
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }
};

// ======================
// Middleware
// ======================
app.use(express.json());
app.use(cookieParser());

// Enhanced CORS
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // Allow non-browser requests (e.g., Postman)
    
    const originNormalized = origin.replace(/\/$/, "");
    const isAllowed = ALLOWED_ORIGINS.some(url => 
      originNormalized === url.replace(/\/$/, "")
    );

    if (isAllowed) {
      console.log(`✅ Allowed CORS for: ${origin}`);
      callback(null, true);
    } else {
      console.warn(`🚨 Blocked CORS for: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}));

// Serve static frontend files (if bundled with backend)
app.use(express.static(path.join(__dirname, "public")));

// ======================
// Routes
// ======================
// Health Check
app.get("/api/test", (req, res) => {
  res.json({ 
    status: "✅ Backend operational",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development"
  });
});

// API Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/applicants", require("./routes/applicantRoutes"));
app.use("/api/admins", require("./routes/adminRoutes"));
app.use("/api/assessors", require("./routes/assessorRoutes"));

// Frontend Routes (Fallback to index.html for SPA)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ======================
// Error Handling
// ======================
app.use((err, req, res, next) => {
  console.error("❌ Server error:", err);
  res.status(500).json({ 
    success: false,
    error: err.message || "Internal server error"
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