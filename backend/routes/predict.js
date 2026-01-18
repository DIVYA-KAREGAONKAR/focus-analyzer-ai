// backend/routes/predict.js
import express from "express";
import axios from "axios";
import Prediction from "../models/Prediction.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const sessionFeatures = req.body; // contains active_ratio (e.g., 0.85)

    // 1. Call Python AI (We still call it to get the 'confidence' metric)
    const response = await axios.post("https://focus-analyzer-ai-3.onrender.com/predict", req.body, {
      headers: { "Content-Type": "application/json" }
    });

    let confidence = Number(response.data.confidence);

    // 2. THE LOGIC FIX: Ignore the ML's 0/1. 
    // We trust the active_ratio math more.
    // If active_ratio > 0.5 (50%), we call it "Focused" (1). Otherwise "Distracted" (0).
    const forcedPrediction = sessionFeatures.active_ratio >= 0.5 ? 1 : 0;

    console.log("LOGIC OVERRIDE:", {
      active_ratio: sessionFeatures.active_ratio,
      status: forcedPrediction === 1 ? "Focused" : "Distracted"
    });

    // Save to DB
    const savedPrediction = new Prediction({
      duration: sessionFeatures.duration,
      switch_count: sessionFeatures.switch_count,
      switch_rate: sessionFeatures.switch_rate,
      active_ratio: sessionFeatures.active_ratio,
      prediction: forcedPrediction, // Save our forced correct status
      confidence,
      createdAt: new Date()
    });

    await savedPrediction.save();

    // Send correct data to frontend
    res.json({ prediction: forcedPrediction, confidence });

  } catch (error) {
    console.error(error);
    // Even if ML fails, we can still return a basic status based on ratio
    const fallbackStatus = req.body.active_ratio >= 0.5 ? 1 : 0;
    res.json({ prediction: fallbackStatus, confidence: 0 });
  }
});

export default router;