import express from "express";
import axios from "axios";
import Prediction from "../models/Prediction.js";

const router = express.Router();

// ✅ NEW STABLE URL (Hugging Face)
const ML_URL = "https://divyakaregaonkar-focus-analyzer-ai.hf.space/predict";

router.post("/", async (req, res) => {
  console.log("📥 Backend Processing:", req.body);
  const { duration } = req.body;

  if (!duration || duration <= 0) {
    return res.status(400).json({ error: "Invalid duration." });
  }

  try {
    console.log(`📡 Connecting to Hugging Face ML...`);
    
    // Direct call. No retries or "stealth mode" needed anymore!
    const response = await axios.post(ML_URL, req.body);

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
    console.error("⛔ FAIL:", error.message);
    res.status(500).json({ 
      error: "ML Service Error", 
      details: error.message 
    });
  }
});

export default router;