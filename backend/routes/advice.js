import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = express.Router();

// Configuration
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Use Gemini 1.5 Flash for speed and reliability (Adjust model name as needed for your API)
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

router.post("/", async (req, res) => {
  const { concPercent, status } = req.body; // status is "Focused" or "Distracted"

  // --- NEW DETAILED PROMPT ---
  const prompt = `
    You are an elite productivity and neuro-performance coach. 
    The user is currently in a "${status}" state with a focus intensity of ${concPercent}%.

    Please provide a comprehensive, detailed analysis in the following format (do not use markdown bolding like ** text ** just use plain text):

    1. Deep Dive Analysis: Explain exactly what a ${concPercent}% focus level means for their brain right now. Is it deep work, shallow work, or fragmented attention?
    2. Cognitive Impact: Describe the psychological effect of this state. How does it affect their creativity, mental fatigue, and decision-making capability?
    3. Immediate Strategy: Provide a specific, actionable technique to either maintain this high level or recover from this distraction (e.g., Pomodoro adjustment, box breathing, sensory deprivation).
    4. Long-term Optimization: Give one tip on how to train the brain to improve this specific metric over time.

    Keep the tone professional, encouraging, and scientifically grounded.
  `;

  try {
    const result = await model.generateContent(prompt);
    const adviceText = result.response.text();
    
    // Clean up any markdown symbols if Gemini adds them (optional safety)
    const cleanAdvice = adviceText.replace(/\*\*/g, "").replace(/\*/g, "-");

    res.json({ advice: cleanAdvice });
  } catch (err) {
    console.error("AI Generation Error:", err);
    res.json({ advice: "System is analyzing your complex flow state. Please stay centered and continue working while we recalibrate." });
  }
});

export default router;