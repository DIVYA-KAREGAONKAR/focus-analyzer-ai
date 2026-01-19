import express from "express";
import axios from "axios";
import Prediction from "../models/Prediction.js";

const router = express.Router();

// ✅ THE PERMANENT FIX: Internal URL (Bypasses Firewall & Rate Limits)
// format: http://<service-name>:<port>
const ML_URL = "http://focus-analyzer-ai-3:5000/predict"; 

router.post("/", async (req, res) => {
  console.log("📥 Backend Processing:", req.body);
  const { duration } = req.body;

  if (!duration || duration <= 0) {
    return res.status(400).json({ error: "Invalid duration." });
  }

  try {
    console.log("📡 Connecting to ML via Private Network...");
    
    // Direct call. No need for retries or "User-Agent" hacks anymore.
    const response = await axios.post(ML_URL, req.body, {
      timeout: 60000 
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
    console.error("⛔ ML FAILURE:", error.message);
    res.status(500).json({ 
      error: "ML Service Error", 
      details: error.message 
    });
  }
});

export default router;