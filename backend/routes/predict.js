// routes/predict.js
import express from "express";
import axios from "axios";
import Prediction from "../models/Prediction.js"; // make sure .js is included

const router = express.Router();

// POST /predict
router.post("/", async (req, res) => {
  try {
    const sessionFeatures = req.body;

    const response = await axios.post(
      `${process.env.ML_SERVICE_URL}/predict`,
      sessionFeatures
    );

    const prediction = Number(response.data.prediction);
    const confidence = Number(response.data.confidence);

    console.log("BACKEND → FRONTEND:", {
      prediction,
      confidence,
      confidenceType: typeof confidence
    });

    if (Number.isNaN(confidence)) {
      throw new Error("Invalid confidence from ML service");
    }

    // Save prediction to MongoDB
    const savedPrediction = new Prediction({
      duration: sessionFeatures.duration,
      switch_count: sessionFeatures.switch_count,
      switch_rate: sessionFeatures.switch_rate,
      active_ratio: sessionFeatures.active_ratio,
      prediction,
      confidence,
      createdAt: new Date()
    });

    await savedPrediction.save();

    res.json({ prediction, confidence });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Prediction failed" });
  }
});

export default router;
