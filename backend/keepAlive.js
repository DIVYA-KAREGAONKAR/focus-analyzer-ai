import axios from "axios";

// Your Python ML Service URL
const ML_URL = "https://focus-analyzer-ai-3.onrender.com"; 

const ping = async () => {
  try {
    console.log("⏰ Keep-Alive: Pinging ML Service...");
    // We send a simple GET request just to wake it up
    await axios.get(ML_URL);
    console.log("✅ Keep-Alive: ML Service is Awake");
  } catch (err) {
    // It's okay if this errors, as long as we touched the server
    console.log("⚠️ Keep-Alive Ping sent (Server might be busy)");
  }
};

// Render Free Tier sleeps after 15 mins of inactivity.
// We ping it every 10 minutes to be safe.
setInterval(ping, 10 * 60 * 1000); 

// Run once immediately on startup
ping();