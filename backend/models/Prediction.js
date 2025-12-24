const mongoose = require("mongoose");

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

module.exports = mongoose.model("Prediction", PredictionSchema);
