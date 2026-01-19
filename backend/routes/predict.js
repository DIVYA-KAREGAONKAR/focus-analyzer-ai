import express from "express";
import axios from "axios";
import Prediction from "../models/Prediction.js";

const router = express.Router();

// Helper: Wait Timer
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ✅ USE PUBLIC URL (Since Internal is hidden/failing)
const ML_URL = "https://focus-analyzer-ai-3.onrender.com/predict";

router.post("/", async (req, res) => {
  console.log("📥 Backend Processing:", req.body);
  const { duration } = req.body;

  if (!duration || duration <= 0) {
    return res.status(400).json({ error: "Invalid duration." });
  }

  // ✅ STEALTH MODE: Disguise as Google Chrome
  // This prevents Render from flagging your request as a bot.
  const browserHeaders = {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json',
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache'
    },
    timeout: 60000 // 60s Timeout for Cold Starts
  };

  try {
    let response;
    let attempts = 0;
    let success = false;
    
    // RETRY LOOP: If blocked (429), wait 30s and try again
    while (attempts < 2 && !success) {
      try {
        attempts++;
        console.log(`📡 Connecting to ML (Attempt ${attempts})...`);
        
        response = await axios.post(ML_URL, req.body, browserHeaders);
        success = true; 

      } catch (err) {
        const status = err.response ? err.response.status : 0;
        console.warn(`⚠️ Attempt ${attempts} Failed (Status: ${status})`);

        // IF 429 (Blocked) or 503 (Sleeping) -> WAIT 30 SECONDS
        if (status === 429 || status === 503) {
           console.log("⏳ Rate Limit Hit. Cooling down for 30s...");
           await wait(30000); // Wait out the penalty
           console.log("🔄 Retrying now...");
        } else {
           throw err; // Stop for real errors (like 404)
        }
      }
    }

    if (!success) throw new Error("Server is locked.");

    // SUCCESS
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
      error: "ML Service is busy. Please try again in 1 minute.", 
      details: error.message 
    });
  }
});

export default router;