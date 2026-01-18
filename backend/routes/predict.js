import express from "express";
import axios from "axios";
import Prediction from "../models/Prediction.js";

const router = express.Router();

// INCREASED WAIT TIME: 3 seconds (was 1s)
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

router.post("/", async (req, res) => {
  const sessionFeatures = req.body;
  let mlPrediction = null;
  let confidence = 0;

  try {
    let attempts = 0;
    let success = false;
    
    // RETRY LOOP
    while (attempts < 3 && !success) {
      try {
        attempts++;
        const response = await axios.post("https://focus-analyzer-ai-3.onrender.com/predict", req.body, {
          timeout: 8000 // Increased timeout to 8s
        });
        
        mlPrediction = Number(response.data.prediction);
        confidence = Number(response.data.confidence);
        success = true;
        console.log(`✅ ML Success (Attempt ${attempts}):`, mlPrediction === 1 ? "Focused" : "Distracted");
        
      } catch (err) {
        if (err.response && err.response.status === 429) {
          // If 429, WAIT LONGER (3 seconds)
          console.warn(`⏳ ML Busy. Waiting 3s... (Attempt ${attempts}/3)`);
          await wait(3000);
        } else {
          throw err;
        }
      }
    }
    
    if (!success) throw new Error("Max retries reached");

  } catch (error) {
    console.warn("⚠️ ML Unavailable. Using Math Fallback.");
    // Fallback: Trust the active_ratio
    mlPrediction = sessionFeatures.active_ratio >= 0.5 ? 1 : 0;
    confidence = sessionFeatures.active_ratio; 
  }

  // Save & Return
  try {
    const savedPrediction = new Prediction({
      ...sessionFeatures,
      prediction: mlPrediction,
      confidence: confidence,
      createdAt: new Date()
    });
    await savedPrediction.save();
    res.json({ prediction: mlPrediction, confidence });
  } catch (dbError) {
    res.status(500).json({ error: "Database failed" });
  }
});

export default router;