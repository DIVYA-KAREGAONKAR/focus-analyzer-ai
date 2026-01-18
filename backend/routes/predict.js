import express from "express";
import axios from "axios";
import Prediction from "../models/Prediction.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const sessionFeatures = req.body;

    // 1. Call Python ML
    const response = await axios.post("https://focus-analyzer-ai-3.onrender.com/predict", req.body);
    
    // 2. RAW DATA TRANSFER (Trust the ML)
    const mlPrediction = Number(response.data.prediction); // 0 or 1
    const confidence = Number(response.data.confidence);

    console.log("🤖 ML SAYS:", mlPrediction === 1 ? "Focused (1)" : "Distracted (0)");

    // 3. Save exactly what ML returned
    const savedPrediction = new Prediction({
      ...sessionFeatures,
      prediction: mlPrediction, 
      confidence: confidence,
      createdAt: new Date()
    });

    await savedPrediction.save();

    res.json({ prediction: mlPrediction, confidence });

  } catch (error) {
    console.error("❌ PREDICT ERROR:", error.message);
    res.status(500).json({ error: "Prediction failed" });
  }
});

export default router;