import mongoose from "mongoose";

const SessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  duration: Number,
  switch_count: Number,
  active_ratio: Number,
  timestamp: { type: Date, default: Date.now }
});
const Session = mongoose.model("Session", SessionSchema);

export default Session;