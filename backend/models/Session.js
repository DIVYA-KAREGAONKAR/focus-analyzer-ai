import mongoose from "mongoose";

const SessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  duration: Number,
  switch_count: Number,
  active_ratio: Number,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Session', SessionSchema);