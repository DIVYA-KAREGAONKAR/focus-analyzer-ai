require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const Event = require("./Event");

const app = express();

app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://focus-analyzer-ai-6.onrender.com"
  ],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.options("/*", cors());



app.use(express.json());

// MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

// Routes
const predictRoute = require("./routes/predict");
app.use("/api/predict", predictRoute);

app.post("/event", async (req, res) => {
  const event = new Event(req.body);
  await event.save();
  res.json({ success: true });
});

app.get("/events", async (req, res) => {
  const events = await Event.find().sort({ timestamp: 1 });
  res.json(events);
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
