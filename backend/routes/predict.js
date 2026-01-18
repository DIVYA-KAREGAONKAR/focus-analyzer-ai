import express from "express";
import axios from "axios";
import Prediction from "../models/Prediction.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const sessionFeatures = req.body;

    // 1. Call Python ML Service
    const response = await axios.post("https://focus-analyzer-ai-3.onrender.com/predict", req.body, {
      headers: { "Content-Type": "application/json" }
    });

    // 2. RAW TRANSFER: Get exactly what ML sent (0 or 1)
    // We do NOT change this value.
    const mlPrediction = Number(response.data.prediction); 
    const confidence = Number(response.data.confidence);

    console.log("ML DECISION:", {
      SentToML: sessionFeatures,
      ReceivedFromML: mlPrediction, // Should be 0 or 1
      Status: mlPrediction === 1 ? "Focused" : "Distracted"
    });

    // 3. Save exactly what ML said
    const savedPrediction = new Prediction({
      duration: sessionFeatures.duration,
      switch_count: sessionFeatures.switch_count,
      switch_rate: sessionFeatures.switch_rate,
      active_ratio: sessionFeatures.active_ratio,
      prediction: mlPrediction, // <--- No math override here
      confidence: confidence,
      createdAt: new Date()
    });

    await savedPrediction.save();

    // 4. Send exactly what ML said to Frontend
    res.json({ prediction: mlPrediction, confidence });

  } catch (error) {
    console.error("ML Error:", error.message);
    res.status(500).json({ error: "ML Connection Failed" });
  }
});

export default router;