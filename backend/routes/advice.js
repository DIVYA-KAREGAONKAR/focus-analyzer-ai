import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = express.Router();

// Fallback function in case AI fails entirely
const getFallbackAdvice = (status) => {
  return status === "Focused" 
    ? "Great momentum. Keep this flow state going." 
    : "Distractions detected. Take a deep breath and reset.";
};

router.post("/", async (req, res) => {
  const { concPercent, status } = req.body;
  
  // 1. Safety Check: If no API Key, return fallback immediately
  if (!process.env.GEMINI_API_KEY) {
    console.warn("⚠️ No API Key found. Using fallback.");
    return res.json({ advice: getFallbackAdvice(status) });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // 2. Use 'gemini-pro' (Most stable model)
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
      Context: User was ${status} (Score: ${concPercent}%).
      Task: Write 1 short, encouraging sentence of advice.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const adviceText = response.text();
    
    console.log("✅ AI Advice Generated");
    res.json({ advice: adviceText });

  } catch (err) {
    // 3. IF ERROR HAPPENS (like 404), RETURN FALLBACK
    // This ensures the frontend NEVER crashes, even if Gemini is broken.
    console.error("❌ Gemini Error (Using Fallback):", err.message);
    res.json({ advice: getFallbackAdvice(status) });
  }
});

export default router;