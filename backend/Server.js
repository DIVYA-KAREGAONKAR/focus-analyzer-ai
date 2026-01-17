// Server.js
import dotenv from 'dotenv';
dotenv.config(); // load .env immediately

import express from "express";
import mongoose from "mongoose";
import cookieParser from 'cookie-parser';
import cors from "cors";  
import Event from "./Event.js";
import adviceRouter from "./routes/advice.js";
import predictRouter from "./routes/predict.js"; // <-- replace require with import

const app = express();

// Middleware
app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://focus-analyzer-ai-6.onrender.com"
  ],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization","User-Agent"],
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

// Routes
app.use("/api/predict", predictRouter); // <-- use import
app.use("/api/advice", adviceRouter);

// Event endpoints
app.post("/event", async (req, res) => {
  try {
    const event = new Event(req.body);
    await event.save();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/events", async (req, res) => {
  try {
    const events = await Event.find().sort({ timestamp: 1 });
    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Health check
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

console.log("ML URL IS:", process.env.ML_SERVICE_URL);

// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on ${PORT}`);
});
