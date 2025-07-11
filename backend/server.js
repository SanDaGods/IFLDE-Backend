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
  "https://ifldefrontend-production.up.railway.app",
  "http://localhost:3000",
  FRONTEND_URL
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
      if (!origin && process.env.NODE_ENV === "development") {
        console.warn("⚠️ No origin header (non-browser request?)");
        return callback(null, true);
      }

      if (!origin) return callback(null, true); // Allow non-browser requests

      const originNormalized = origin.replace(/\/$/, "").toLowerCase();
      const isAllowed = ALLOWED_ORIGINS.some((url) => {
        const allowedUrl = url.replace(/\/$/, "").toLowerCase();
        return (
          originNormalized === allowedUrl ||
          originNormalized.endsWith(`.${allowedUrl.replace("https://", "")}`) // Allow subdomains
        );
      });

      if (isAllowed) {
        if (process.env.NODE_ENV === "development") {
          console.log(`✅ Allowed CORS for: ${origin}`);
        }
        return callback(null, true);
      } else {
        console.warn(`🚨 Blocked CORS for: ${origin}`);
        return callback(new Error(`Origin "${origin}" not allowed by CORS`), false);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["set-cookie"], // Required for frontend to read cookies
    maxAge: 86400, // Cache CORS preflight for 24hrs (optional)
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

// Add this right after your MongoDB connection
app.get('/api/check-db', async (req, res) => {
  try {
    // Method 1: Ping command
    await mongoose.connection.db.command({ ping: 1 });
    
    // Method 2: Check readyState
    const readyState = mongoose.connection.readyState;
    const states = ["disconnected", "connected", "connecting", "disconnecting"];
    
    res.json({
      status: "✅ MongoDB is connected",
      readyState: `${readyState} (${states[readyState]})`,
      dbName: mongoose.connection.name,
      collections: await mongoose.connection.db.listCollections().toArray()
    });
  } catch (err) {
    res.status(500).json({
      status: "❌ MongoDB NOT connected",
      error: err.message
    });
  }
});

// ======================
// Routes
// ======================

// Health Check
// Add this right after your MongoDB connection
app.get('/api/health', async (req, res) => {
  try {
    // Simple ping command to verify connection
    await mongoose.connection.db.admin().command({ ping: 1 });
    
    res.json({
      status: "✅ Healthy",
      dbState: mongoose.STATES[mongoose.connection.readyState],
      dbName: mongoose.connection.name,
    });
  } catch (err) {
    res.status(503).json({
      status: "❌ Unhealthy",
      error: err.message,
      dbState: mongoose.STATES[mongoose.connection.readyState]
    });
  }
});
// API Endpoints
app.use("/api", require("./routes/authRoutes")); // Changed from "/api/auth"d
app.use("/", require("./routes/applicantRoutes"));
app.use("/api/admins", require("./routes/adminRoutes"));
app.use("/api/assessors", require("./routes/assessorRoutes"));

// ======================
// Static File Handling (Frontend support if needed)
// ======================


app.get("/", (req, res) => {
  res.send("✅ Backend is running. Visit /api/... for endpoints.");
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


// Add to server.js
app.get('/api/debug/models', (req, res) => {
  res.json({
    registeredModels: mongoose.modelNames(),
    ApplicantSchema: mongoose.model('Applicant').schema.obj
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
