import express from "express";
import axios from "axios";

const router = express.Router();

// Fallback if Google fails completely
const getFallbackAdvice = (status) => {
  return status === "Focused" 
    ? "Great focus! Maintain this rhythm." 
    : "Distractions detected. Try closing background tabs.";
};

router.post("/", async (req, res) => {
  const { concPercent, status } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.log("⚠️ No API Key. Using fallback.");
    return res.json({ advice: getFallbackAdvice(status) });
  }

  // WE TRY THESE 3 MODELS IN ORDER
  const models = [
    "gemini-1.5-flash",
    "gemini-pro",
    "gemini-1.0-pro"
  ];

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      
      const payload = {
        contents: [{
          parts: [{
            text: `User status: ${status} (${concPercent}%). Write 1 sentence of advice.`
          }]
        }]
      };

      // Try the request
      const response = await axios.post(url, payload, {
        headers: { "Content-Type": "application/json" }
      });

      const adviceText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (adviceText) {
        console.log(`✅ SUCCESS using model: ${model}`);
        return res.json({ advice: adviceText });
      }

    } catch (err) {
      // LOG THE EXACT ERROR (This helps us debug)
      const errorMsg = err.response?.data?.error?.message || err.message;
      console.warn(`❌ Model '${model}' failed: ${errorMsg}`);
      
      // If error is "API key not valid", stop trying other models
      if (errorMsg.includes("API key")) break;
    }
  }

  // If we get here, ALL models failed
  console.error("❌ ALL AI Models failed. Returning fallback.");
  res.json({ advice: getFallbackAdvice(status) });
});

export default router;