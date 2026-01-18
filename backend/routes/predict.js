import express from "express";
import axios from "axios";
import Prediction from "../models/Prediction.js";

const router = express.Router();

router.post("/", async (req, res) => {
  // 1. Log incoming data (Helps debug if you see a 500 error)
  console.log("📥 Sending to ML:", req.body);
  
  const sessionFeatures = req.body;

  try {
    // 2. ONE SHOT CALL - No retries, no waiting.
    // We give the ML model 60 seconds to respond.
    const response = await axios.post("https://focus-analyzer-ai-3.onrender.com/predict", req.body, {
      timeout: 60000 // 60 seconds
    });
    
    const mlPrediction = Number(response.data.prediction);
    const confidence = Number(response.data.confidence);

    console.log(`✅ ML Success: ${mlPrediction === 1 ? "Focused" : "Distracted"}`);

    // 3. Save REAL result to DB
    const savedPrediction = new Prediction({
      ...sessionFeatures,
      prediction: mlPrediction,
      confidence: confidence,
      isFallback: false,
      createdAt: new Date()
    });

    await savedPrediction.save();

    // 4. Return result
    res.json({ prediction: mlPrediction, confidence });

  } catch (error) {
    // If it fails, we show the REAL error.
    console.error("⛔ ML ERROR:", error.message);
    
    // We return a 500 status so you know exactly when it fails.
    res.status(500).json({ 
      error: "ML Service Failed", 
      details: error.message 
    });
  }
});

export default router;