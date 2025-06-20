const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    });
    
    console.log("✅ MongoDB connected successfully");
    
    // Verify the connection is actually working
    await mongoose.connection.db.admin().ping();
    console.log("🗝️ MongoDB ping confirmed");
    
  } catch (err) {
    console.error("❌ MongoDB connection error!", err);
    process.exit(1); // Exit with failure
  }
};

// Handle connection events
mongoose.connection.on("connected", () => {
  console.log("🔗 Mongoose connected to DB");
});

mongoose.connection.on("error", (err) => {
  console.error("💥 Mongoose connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.warn("⚠️ Mongoose disconnected from DB");
});

// Close connection on process termination
process.on("SIGINT", async () => {
  await mongoose.connection.close();
  process.exit(0);
});

module.exports = connectDB;