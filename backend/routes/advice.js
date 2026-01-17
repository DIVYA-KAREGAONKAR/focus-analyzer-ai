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
  const prompt = `
    The user is currently ${status.toUpperCase()}.
    This means they have a ${concPercent}% ${status === "Focused" ? "Concentration" : "Distraction"} level.

    TASK: 
    - If they have high "Distraction", give a firm 1-sentence tip to refocus.
    - If they have high "Concentration", give 1 sentence of encouragement to stay in the flow.
    
    Constraint: Exactly 1 sentence. Be professional.
  `;

  try {
    const result = await model.generateContent(prompt);
    res.json({ advice: result.response.text() });
  } catch (err) {
    res.json({ advice: "Stay centered and keep working!" });
  }
});

export default router;