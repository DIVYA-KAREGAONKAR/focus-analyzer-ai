import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = express.Router();

// 1. Check if API Key exists
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ ERROR: GEMINI_API_KEY is missing in .env file");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 2. USE A VALID MODEL (gemini-1.5-flash is standard)
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

router.post("/", async (req, res) => {
  const { concPercent, status } = req.body;

  // 3. Dynamic Prompt based on status
  const prompt = `
    The user was "${status}" (Intensity: ${concPercent}%).
    Write a 2-sentence feedback.
    Sentence 1: Reaction to their specific score.
    Sentence 2: One quick tip to improve next time.
  `;

  try {
    const result = await model.generateContent(prompt);
    const adviceText = result.response.text();
    
    // Log success
    console.log(`✅ AI Advice Success: "${adviceText.substring(0, 30)}..."`);
    res.json({ advice: adviceText });

  } catch (err) {
    // 4. PRINT THE REAL ERROR
    console.error("❌ GEMINI FAILURE:", err.message);
    
    // 5. Fallback matches the STATUS (Fixed the "Always Focused" bug)
    const fallbackAdvice = status === "Distracted" 
      ? "Distractions detected. Try closing background tabs to regain focus." 
      : "Good focus. Keep maintaining this workflow.";
      
    res.json({ advice: fallbackAdvice });
  }
});

export default router;