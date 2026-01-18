import express from "express";
import axios from "axios";

const router = express.Router();

router.post("/", async (req, res) => {
  const { concPercent, status } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) return res.json({ advice: "Great work! Keep it up." });

  // STRATEGY: Try modern model first, then legacy model
  const endpoints = [
    // Option 1: Modern (Fastest)
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    // Option 2: Legacy (Most Compatible) - Note the 'v1' instead of 'v1beta'
    `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`
  ];

  for (const url of endpoints) {
    try {
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
      
      if (adviceText) {
        console.log("✅ AI Advice Success!");
        return res.json({ advice: adviceText });
      }

    } catch (err) {
      console.warn(`⚠️ Endpoint failed, trying next...`);
    }
  }

  // If BOTH fail, return safe fallback
  console.error("❌ All AI models failed.");
  res.json({ 
    advice: status === "Focused" 
      ? "Excellent focus. Maintain this rhythm." 
      : "Distractions detected. Try to reset your focus." 
  });
});

export default router;