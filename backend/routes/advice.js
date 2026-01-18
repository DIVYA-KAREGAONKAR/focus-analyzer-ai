import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = express.Router();

// Configuration
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Use Gemini 3 Flash for speed and reliable 2026 support
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
// backend/routes/advice.js
// backend/routes/advice.js
// backend/routes/advice.js
router.post("/", async (req, res) => {
  const { concPercent, status } = req.body; // status is "Focused" or "Distracted"

  // We explicitly label the percentage so the AI doesn't guess
  // Inside your backend routes/advice.js (Logic update)
const prompt = `The user was ${status} with an intensity of ${concPercent}%. 
Provide a 3-sentence professional coaching insight. 
Sentence 1: Analyze the current state. 
Sentence 2: Explain the psychological impact of this focus level. 
Sentence 3: Give a specific, high-impact action step to improve flow.`;

  try {
    const result = await model.generateContent(prompt);
    res.json({ advice: result.response.text() });
  } catch (err) {
    res.json({ advice: "Stay centered and keep working!" });
  }
});

export default router;