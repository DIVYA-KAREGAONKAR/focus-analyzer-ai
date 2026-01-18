import express from "express";
import axios from "axios";
import Prediction from "../models/Prediction.js";

const router = express.Router();

router.post("/", async (req, res) => {
  console.log("📥 Backend Received:", req.body);

  const { duration, switch_count, active_ratio } = req.body;

  // 1️⃣ VALIDATION (unchanged)
  if (duration === 0 || duration === null || isNaN(duration)) {
    console.error("⛔ Invalid Duration (0 or NaN). Rejecting.");
    return res.status(400).json({
      error: "Session too short. Please analyze a longer session."
    });
  }

  // 2️⃣ COMPUTE MISSING FEATURE (🔥 REQUIRED FIX)
  const switch_rate = switch_count / duration;

  try {
    console.log("📡 Calling ML Service...");

    // 3️⃣ SEND CORRECT FEATURES TO ML
    const response = await axios.post(
      "https://focus-analyzer-ai-3.onrender.com/predict",
      {
        duration,
        switch_count,
        switch_rate,
        active_ratio
      },
      { timeout: 60000 }
    );

    const mlPrediction = Number(response.data.prediction);
    const confidence = Number(response.data.confidence);

    console.log(
      `✅ ML Success: ${mlPrediction === 1 ? "Focused" : "Distracted"}`
    );

    // 4️⃣ SAVE RESULT (unchanged)
    const savedPrediction = new Prediction({
      duration,
      switch_count,
      active_ratio,
      prediction: mlPrediction,
      confidence,
      isFallback: false,
      createdAt: new Date()
    });

    await savedPrediction.save();

    res.json({ prediction: mlPrediction, confidence });

  } catch (error) {
    console.error("⛔ ML ERROR:", error.message);

    res.status(500).json({
      error: "ML Service Failed",
      details: error.message
    });
  }
});

export default router;
