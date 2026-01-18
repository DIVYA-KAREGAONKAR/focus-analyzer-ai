import express from "express";
import axios from "axios";

const router = express.Router();

router.post("/", async (req, res) => {
  const { concPercent, status } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.json({ advice: "Great focus! Keep it up." });
  }

  try {
    // 1. HARDCODED URL for the most stable model (gemini-pro)
    // We stopped trying 1.5-flash because your key/region doesn't support it yet.
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;
    
    const payload = {
      contents: [{
        parts: [{
          text: `User status: ${status} (${concPercent}%). Give 1 sentence of advice.`
        }]
      }]
    };

    const response = await axios.post(url, payload, {
      headers: { "Content-Type": "application/json" }
    });

    const adviceText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    console.log("✅ AI Success (gemini-pro):", adviceText);
    
    res.json({ advice: adviceText });

  } catch (err) {
    console.error("❌ Gemini Error:", err.response?.data?.error?.message || err.message);
    
    // Fallback so the user sees SOMETHING instead of a blank space
    res.json({ 
      advice: status === "Focused" 
        ? "Excellent momentum. Maintain this flow." 
        : "Distractions detected. Take a deep breath." 
    });
  }
});

export default router;