// routes/predict.js
import express from "express";
import axios from "axios";
import Prediction from "../models/Prediction.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const sessionFeatures = req.body;

    const response = await axios.post("https://focus-analyzer-ai-3.onrender.com/predict", req.body, {
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });

    // 1. Get the raw prediction from Python/ML
    let rawPrediction = Number(response.data.prediction);
    const confidence = Number(response.data.confidence);

    // ---------------------------------------------------------
    // 2. THE FIX: FLIP THE PREDICTION
    // Currently: It seems your ML returns the opposite of what React expects.
    // We swap them here so the rest of the app works correctly.
    // ---------------------------------------------------------
    const prediction = rawPrediction === 0 ? 1 : 0; 
    
    console.log("BACKEND → FRONTEND (Fixed):", {
      original: rawPrediction,
      flipped: prediction,
      confidence
    });

    if (Number.isNaN(confidence)) {
      throw new Error("Invalid confidence from ML service");
    }

    // Save the CORRECTED prediction to MongoDB
    const savedPrediction = new Prediction({
      duration: sessionFeatures.duration,
      switch_count: sessionFeatures.switch_count,
      switch_rate: sessionFeatures.switch_rate,
      active_ratio: sessionFeatures.active_ratio,
      prediction, // Now saving the flipped (correct) value
      confidence,
      createdAt: new Date()
    });

    await savedPrediction.save();

    // Send corrected value to frontend
    res.json({ prediction, confidence });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Prediction failed" });
  }
});

export default router;