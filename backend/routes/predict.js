import express from "express";
import axios from "axios";
import Prediction from "../models/Prediction.js";

const router = express.Router();

router.post("/", async (req, res) => {
  // 1. READ URL FROM DASHBOARD (Or fallback to internal default)
  const ML_URL = process.env.ML_CONNECT_URL || "http://focus-analyzer-ai-3:5000/predict";
  
  console.log("📥 Backend Processing:", req.body);
  console.log(`📡 Connecting to ML Service at: ${ML_URL}`);

  const { duration } = req.body;

  if (!duration || duration <= 0) {
    return res.status(400).json({ error: "Invalid duration." });
  }

  try {
    // 2. CONNECT
    // We try the Internal URL first. It is faster and has NO Rate Limits.
    const response = await axios.post(ML_URL, req.body, {
      timeout: 60000 // 60s timeout
    });

    const mlPrediction = Number(response.data.prediction);
    const confidence = Number(response.data.confidence);

    console.log(`✅ ML Success: ${mlPrediction === 1 ? "Focused" : "Distracted"}`);

    const savedPrediction = new Prediction({
      ...req.body,
      prediction: mlPrediction,
      confidence: confidence,
      isFallback: false,
      createdAt: new Date()
    });

    await savedPrediction.save();
    res.json({ prediction: mlPrediction, confidence });

  } catch (error) {
    console.error("⛔ CONNECTION FAILED:", error.message);
    
    // DEBUG HELP: Tell us exactly why it failed
    if (error.code === 'ENOTFOUND') {
      console.error("⚠️ DNS Error: The Node app cannot find 'focus-analyzer-ai-3'.");
      console.error("👉 Fix: Ensure both services are in the 'Oregon' region.");
    }

    res.status(500).json({ 
      error: "ML Service unavailable. Please try again.", 
      details: error.message 
    });
  }
});

export default router;