import express from "express";
import axios from "axios";
import Prediction from "../models/Prediction.js";

const router = express.Router();

// Helper: Wait function for retries (helps if server is waking up)
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

router.post("/", async (req, res) => {
  const sessionFeatures = req.body;
  
  // We initialize these to null because we ONLY want them from the ML
  let mlPrediction = null;
  let confidence = 0;

  try {
    let attempts = 0;
    let success = false;
    
    // RETRY LOOP: Try 2 times
    // This handles the "Cold Start" where the first request might fail or be slow
    while (attempts < 2 && !success) {
      try {
        attempts++;
        console.log(`📡 Calling ML Service (Attempt ${attempts})... Waiting for model...`);
        
        // 1. CALL ML SERVICE
        // timeout: 60000 (60 seconds) -> "Let ML have his time"
        const response = await axios.post("https://focus-analyzer-ai-3.onrender.com/predict", req.body, {
          timeout: 60000 
        });
        
        // 2. GET RESULT DIRECTLY FROM MODEL
        mlPrediction = Number(response.data.prediction);
        confidence = Number(response.data.confidence);
        success = true;
        
        console.log(`✅ ML Answered: ${mlPrediction === 1 ? "Focused" : "Distracted"}`);
        
      } catch (err) {
        // If the server is just waking up (503) or busy (429), we wait and try again.
        if (err.response && (err.response.status === 429 || err.response.status === 503)) {
          console.warn(`⏳ ML Service is waking up... Waiting 5s...`);
          await wait(5000);
        } else if (err.code === 'ECONNABORTED') {
           console.warn(`⏳ Request timed out (Model is slow). Retrying...`);
           await wait(2000);
        } else {
          // If it's a real error, stop trying
          console.error(`❌ ML Error: ${err.message}`);
          break;
        }
      }
    }
    
    // IF ML FAILED AFTER RETRIES
    if (!success) {
      throw new Error("ML Model did not respond in time.");
    }

    // 3. SAVE THE REAL ML PREDICTION TO DB
    const savedPrediction = new Prediction({
      ...sessionFeatures,
      prediction: mlPrediction,
      confidence: confidence,
      isFallback: false, // We confirm this is NOT a fallback
      createdAt: new Date()
    });

    await savedPrediction.save();

    // 4. SEND REAL RESULT TO FRONTEND
    res.json({ prediction: mlPrediction, confidence });

  } catch (error) {
    console.error("⛔ PREDICTION FAILED:", error.message);
    // We return a 500 error so the Frontend knows something went wrong.
    // We do NOT send a fake "Focused" status.
    res.status(500).json({ error: "ML Model Unavailable" });
  }
});

export default router;