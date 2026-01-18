import express from "express";
import axios from "axios";

const router = express.Router();

// Fallback message if ALL AI models fail
const getFallbackAdvice = (status) => {
  return status === "Focused" 
    ? "Excellent focus. Maintain this rhythm." 
    : "Distractions detected. Try deep breathing to reset.";
};

router.post("/", async (req, res) => {
  const { concPercent, status } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn("⚠️ No API Key found.");
    return res.json({ advice: getFallbackAdvice(status) });
  }

  // LIST OF MODELS TO TRY (In order of preference)
  // If 1.5 Flash fails, it immediately tries gemini-pro
  const modelsToTry = [
    "gemini-1.5-flash", 
    "gemini-pro", 
    "gemini-1.0-pro"
  ];

  for (const modelName of modelsToTry) {
    try {
      console.log(`🔄 Trying AI Model: ${modelName}...`);
      
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      
      const payload = {
        contents: [{
          parts: [{
            text: `The user was ${status} (Focus Score: ${concPercent}%). Give 1 short sentence of advice.`
          }]
        }]
      };

      const response = await axios.post(url, payload, {
        headers: { "Content-Type": "application/json" }
      });

      const adviceText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (adviceText) {
        console.log(`✅ SUCCESS with ${modelName}!`);
        return res.json({ advice: adviceText });
      }

    } catch (err) {
      console.warn(`❌ Failed with ${modelName}:`, err.response?.data?.error?.message || err.message);
      // Loop continues to the next model...
    }
  }

  // If the loop finishes and nothing worked:
  console.error("❌ ALL Models failed.");
  res.json({ advice: getFallbackAdvice(status) });
});

export default router;