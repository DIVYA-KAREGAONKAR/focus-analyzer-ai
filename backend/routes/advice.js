import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = express.Router();

// Configuration
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Use Gemini 3 Flash for speed and reliable 2026 support
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
// backend/routes/advice.js
router.post("/", async (req, res) => {
  const { concPercent, status } = req.body; // Status will be "Focused" or "Distracted"

  const prompt = `
    User Status: ${status}
    Intensity Level: ${concPercent}%

    INSTRUCTIONS:
    1. If status is "Distracted":
       - Treat the ${concPercent}% as the "Severity of Distraction".
       - Give a firm, 1-sentence tip to stop procrastinating.
    
    2. If status is "Focused":
       - Treat the ${concPercent}% as the "Quality of Concentration".
       - Give a 1-sentence encouragement or a tip to maintain deep flow.

    Constraint: Keep the response to exactly one sentence.
  `;

  try {
    const result = await model.generateContent(prompt);
    res.json({ advice: result.response.text() });
  } catch (err) {
    res.json({ advice: "Keep pushing forward!" });
  }
});

export default router;