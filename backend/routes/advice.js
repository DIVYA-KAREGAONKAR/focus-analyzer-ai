import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = express.Router();

// Safety Check
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ ERROR: GEMINI_API_KEY is missing in .env");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// USE NEWER MODEL (Make sure you ran 'npm install @google/generative-ai@latest')
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

router.post("/", async (req, res) => {
  const { concPercent, status } = req.body;

  const prompt = `
    The user just finished a work session.
    Status: ${status}
    Focus Score: ${concPercent}%
    
    Task: Write exactly 2 short sentences.
    1. Acknowledgment of their score.
    2. One actionable tip for the next session.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const adviceText = response.text();
    
    console.log("✅ Advice Generated Successfully");
    res.json({ advice: adviceText });

  } catch (err) {
    console.error("❌ Gemini Error:", err.message);
    
    // FALLBACK: Return this string if AI fails. Prevents Frontend Crash.
    const fallbackAdvice = status === "Focused" 
      ? "Great job keeping your focus high! Take a short break to recharge." 
      : "We detected some distractions. Try to close background tabs next time.";
      
    res.json({ advice: fallbackAdvice });
  }
});

export default router;