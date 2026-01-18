import express from "express";
import axios from "axios";
import Prediction from "../models/Prediction.js";

const router = express.Router();

// Helper: Wait function for retries
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

router.post("/", async (req, res) => {
  const sessionFeatures = req.body;
  let mlPrediction = null;
  let confidence = 0;

  console.log("🚀 Analyzing Session...");

  try {
    // ---------------------------------------------------------
    // 1. ROBUST ML CALL WITH RETRY LOGIC
    // We try 3 times. If error 429 happens, we wait and try again.
    // ---------------------------------------------------------
    let attempts = 0;
    let success = false;
    
    while (attempts < 3 && !success) {
      try {
        attempts++;
        const response = await axios.post("https://focus-analyzer-ai-3.onrender.com/predict", req.body, {
          timeout: 5000 // 5-second timeout
        });
        
        mlPrediction = Number(response.data.prediction);
        confidence = Number(response.data.confidence);
        success = true; // It worked! Exit loop.
        console.log(`✅ ML Success (Attempt ${attempts}):`, mlPrediction === 1 ? "Focused" : "Distracted");
        
      } catch (err) {
        // If it's a 429 (Too Many Requests), wait 1 second and retry
        if (err.response && err.response.status === 429) {
          console.warn(`⏳ ML Busy (429). Retrying in 1s... (Attempt ${attempts}/3)`);
          await wait(1000);
        } else {
          // If it's another error (like 500 or network), throw it immediately
          throw err;
        }
      }
    }
    
    // If we tried 3 times and still failed
    if (!success) throw new Error("Max retries reached");

  } catch (error) {
    // ---------------------------------------------------------
    // 2. FALLBACK LOGIC (Safety Net)
    // If ML is dead, sleeping, or busy, we calculate it ourselves.
    // ---------------------------------------------------------
    console.warn("⚠️ ML Unavailable. Using Math Fallback.", error.message);
    
    // Logic: If active > 50%, assume Focused (1). Else Distracted (0).
    mlPrediction = sessionFeatures.active_ratio >= 0.5 ? 1 : 0;
    
    // Set confidence to the raw ratio since we don't have AI confidence
    confidence = sessionFeatures.active_ratio; 
  }

  // 3. Save Final Result (AI or Fallback) to DB
  try {
    const savedPrediction = new Prediction({
      ...sessionFeatures,
      prediction: mlPrediction,
      confidence: confidence,
      createdAt: new Date()
    });

    await savedPrediction.save();

    // Always return 200 OK to Frontend
    res.json({ prediction: mlPrediction, confidence });
    
  } catch (dbError) {
    console.error("❌ Database Error:", dbError);
    res.status(500).json({ error: "Database save failed" });
  }
});

export default router;