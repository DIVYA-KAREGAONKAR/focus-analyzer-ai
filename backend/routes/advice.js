import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = express.Router();

// Configuration
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Use Gemini 3 Flash for speed and reliable 2026 support
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
// backend/routes/advice.js
// backend/routes/advice.js
router.post("/", async (req, res) => {
  const { concPercent, status } = req.body;

  const prompt = `
    The user is CURRENTLY ${status.toUpperCase()} with ${concPercent}% intensity.
    
    CRITICAL RULES:
    1. If the status is "FOCUSED": 
       - DO NOT give advice on how to get focused. 
       - DO NOT tell them to remove distractions. 
       - DO stay positive and give 1 short sentence of encouragement to keep them in the "flow state."
       - Example: "You're in the zone—keep this momentum going for another 20 minutes!"

    2. If the status is "DISTRACTED":
       - Objective: The user is off-task. 
       - Give 1 firm, practical sentence to help them return to work immediately.
       - Example: "Put your phone away and take one deep breath to reconnect with your task."

    Constraint: Max 15 words.
  `;

  try {
    const result = await model.generateContent(prompt);
    res.json({ advice: result.response.text() });
  } catch (err) {
    res.json({ advice: "Keep up the great work!" });
  }
});

export default router;