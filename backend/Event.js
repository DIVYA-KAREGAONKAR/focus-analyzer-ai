// backend/Event.js
import mongoose from "mongoose";

const EventSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  eventType: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

// Export as default
const Event = mongoose.model("Event", EventSchema);
export default Event;
