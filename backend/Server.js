// Server.js
import dotenv from 'dotenv';
dotenv.config(); // load .env immediately

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import express from "express";
import mongoose from "mongoose";
import cookieParser from 'cookie-parser';
import cors from "cors";  
import Event from "./Event.js";
import adviceRouter from "./routes/advice.js";
import predictRouter from "./routes/predict.js"; // <-- replace require with import
import User from "./models/User.js";
import Session from "./models/Session.js";
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

// backend/server.js
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // 1. Check if user actually exists first
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "This email is already registered." });
    }

    // 2. Hash and Save
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    // 3. IMPORTANT: Send back the user data so the frontend logs them in immediately
    res.status(201).json({ 
      message: "Registration successful",
      user: { id: user._id, name: user.name, email: user.email } 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error during registration." });
  }
});

// backend/server.js
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  // Generate token
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

  // YOU MUST SEND THIS DATA BACK
  res.status(200).json({ 
    token, 
    user: { id: user._id, name: user.name, email: user.email } 
  });
});
// --- HISTORY ROUTES ---

app.get('/api/history/:userId', async (req, res) => {
  const sessions = await Session.find({ userId: req.params.userId }).sort({ timestamp: -1 });
  res.json(sessions);
});

app.post('/api/history', async (req, res) => {
  const newSession = new Session(req.body);
  await newSession.save();
  res.status(201).json(newSession);
});




console.log("ML URL IS:", process.env.ML_SERVICE_URL);

// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on ${PORT}`);
});
