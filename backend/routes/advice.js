import express from "express";
import axios from "axios";

const router = express.Router();

// 1. BEAUTIFUL FALLBACKS (So the UI always looks good)
const getFallbackAdvice = (status) => {
  const focusedTips = [
    "Excellent momentum. Your focus intensity is high—keep this flow state going.",
    "Great work! You're in the zone. maximize this time for complex tasks.",
    "Solid performance. Maintain this rhythm to close out your goals."
  ];
  const distractedTips = [
    "Distractions detected. Try the '2-Minute Rule': if it takes <2 mins, do it now, else schedule it.",
    "Focus slipped. Take a deep breath, close one tab, and restart your timer.",
    "High switching detected. Try single-tasking for just the next 10 minutes."
  ];
  
  const tips = status === "Focused" ? focusedTips : distractedTips;
  return tips[Math.floor(Math.random() * tips.length)];
};

router.post("/", async (req, res) => {
  const { concPercent, status } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn("⚠️ No API Key found.");
    return res.json({ advice: getFallbackAdvice(status) });
  }

  try {
    // ---------------------------------------------------------
    // STEP 1: ASK GOOGLE "WHAT MODELS ARE AVAILABLE?"
    // ---------------------------------------------------------
    console.log("🔍 Auto-discovering valid AI models...");
    const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    
    const listResponse = await axios.get(listUrl);
    
    // Find a model that supports 'generateContent'
    const validModel = listResponse.data?.models?.find(m => 
      m.supportedGenerationMethods?.includes("generateContent") &&
      (m.name.includes("gemini") || m.name.includes("pro") || m.name.includes("flash"))
    );

    if (!validModel) {
      throw new Error("No valid Gemini models found for this API key.");
    }

    const modelName = validModel.name.replace("models/", ""); // e.g., "gemini-1.5-flash"
    console.log(`✅ Found valid model: ${modelName}`);

    // ---------------------------------------------------------
    // STEP 2: USE THAT EXACT MODEL
    // ---------------------------------------------------------
    const genUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    
    const payload = {
      contents: [{
        parts: [{
          text: `User status: ${status} (${concPercent}%). Write 1 short, encouraging sentence of advice.`
        }]
      }]
    };

    const response = await axios.post(genUrl, payload, {
      headers: { "Content-Type": "application/json" }
    });

    const adviceText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (adviceText) {
      console.log("✅ AI Advice Generated Successfully!");
      res.json({ advice: adviceText });
    } else {
      throw new Error("Empty response from AI");
    }

  } catch (err) {
    // LOG THE REAL REASON
    console.error("❌ AI FAILED:", err.response?.data?.error?.message || err.message);
    
    // RETURN FALLBACK (User sees a working app)
    res.json({ advice: getFallbackAdvice(status) });
  }
});

export default router;