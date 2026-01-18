import express from "express";
import axios from "axios"; // Using standard HTTP instead of Google library

const router = express.Router();

router.post("/", async (req, res) => {
  const { concPercent, status } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  // 1. Check if Key exists in Environment
  if (!apiKey) {
    console.error("❌ ERROR: GEMINI_API_KEY is missing in Render Environment Variables.");
    return res.json({ advice: "Analysis saved. (API Key missing)" });
  }

  try {
    // 2. DIRECT HTTP CALL (Bypasses the "Old Library" issue)
    // We manually type the URL for Gemini 1.5 Flash
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const payload = {
      contents: [{
        parts: [{
          text: `The user was ${status} (Focus Score: ${concPercent}%). Give 1 short sentence of advice.`
        }]
      }]
    };

    // 3. Send Request
    const response = await axios.post(url, payload, {
      headers: { "Content-Type": "application/json" }
    });

    // 4. Extract Answer
    const adviceText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    console.log("✅ AI Advice Success (Via Raw HTTP)");
    res.json({ advice: adviceText || "Keep up the good work!" });

  } catch (err) {
    // Detailed Error Logging
    console.error("❌ API ERROR:", err.response?.data?.error?.message || err.message);
    
    // Fallback so app doesn't crash
    res.json({ advice: status === "Focused" ? "Great focus! Keep it up." : "Distractions detected. Refocus." });
  }
});

export default router;