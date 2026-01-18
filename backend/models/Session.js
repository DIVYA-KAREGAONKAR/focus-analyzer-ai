import mongoose from "mongoose";

const SessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  duration: Number,
  switch_count: Number,
  active_ratio: Number,
  // NEW FIELDS FOR DETAILED HISTORY
  status: { type: String, enum: ['Focused', 'Distracted'], default: 'Focused' },
  advice: { type: String, default: "" },
  timestamp: { type: Date, default: Date.now }
});

const Session = mongoose.model("Session", SessionSchema);
export default Session;