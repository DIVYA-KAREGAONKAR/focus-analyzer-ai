// models/Prediction.js
import mongoose from "mongoose";

const PredictionSchema = new mongoose.Schema({
  duration: Number,
  switch_count: Number,
  switch_rate: Number,
  active_ratio: Number,
  prediction: Number,
  confidence: Number,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Prediction = mongoose.model("Prediction", PredictionSchema);

export default Prediction;
