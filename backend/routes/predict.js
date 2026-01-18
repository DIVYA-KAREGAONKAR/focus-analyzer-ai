import express from "express";
import axios from "axios";
import Prediction from "../models/Prediction.js";

const router = express.Router();

router.post("/", async (req, res) => {
  console.log("📥 Backend Received:", req.body);
  
  const { duration, switch_count, active_ratio } = req.body;

  // 1. VALIDATION: Check for bad data (Fixes 500 Crash)
  if (duration === 0 || duration === null || isNaN(duration)) {
    console.error("⛔ Invalid Duration (0 or NaN). Rejecting.");
    return res.status(400).json({ error: "Session too short. Please analyze a longer session." });
  }

  try {
    // 2. Call ML (Timeout 60s)
    console.log("📡 Calling ML Service...");
    const response = await axios.post("https://focus-analyzer-ai-3.onrender.com/predict", req.body, {
      timeout: 60000 
    });
    
    const mlPrediction = Number(response.data.prediction);
    const confidence = Number(response.data.confidence);

    console.log(`✅ ML Success: ${mlPrediction === 1 ? "Focused" : "Distracted"}`);

    // 3. Save & Return
    const savedPrediction = new Prediction({
      duration, switch_count, active_ratio,
      prediction: mlPrediction,
      confidence: confidence,
      isFallback: false,
      createdAt: new Date()
    });

    await savedPrediction.save();
    res.json({ prediction: mlPrediction, confidence });

  } catch (error) {
    console.error("⛔ ML ERROR:", error.message);
    // Return 500 with details
    res.status(500).json({ 
      error: "ML Service Failed", 
      details: error.message 
    });
  }
});

export default router;