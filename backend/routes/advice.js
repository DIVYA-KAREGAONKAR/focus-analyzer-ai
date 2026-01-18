import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = express.Router();

// Fallback function (Keeps the app running if Google is down)
const getFallbackAdvice = (status) => {
  return status === "Focused" 
    ? "Great momentum. Keep this flow state going." 
    : "Distractions detected. Take a deep breath and reset.";
};

router.post("/", async (req, res) => {
  const { concPercent, status } = req.body;
  
  if (!process.env.GEMINI_API_KEY) {
    console.warn("⚠️ No API Key found. Using fallback.");
    return res.json({ advice: getFallbackAdvice(status) });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // ✅ CHANGED: Switched to the modern, supported model
    // This works because you updated your package.json to version 0.24.1+
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
      Context: User was ${status} (Score: ${concPercent}%).
      Task: Write 1 short, encouraging sentence of advice.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const adviceText = response.text();
    
    console.log("✅ AI Advice Generated Successfully");
    res.json({ advice: adviceText });

  } catch (err) {
    console.error("❌ Gemini Error (Using Fallback):", err.message);
    // This ensures your frontend NEVER crashes
    res.json({ advice: getFallbackAdvice(status) });
  }
});

export default router;