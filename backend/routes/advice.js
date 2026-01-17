import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = express.Router();

// Configuration
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Use Gemini 3 Flash for speed and reliable 2026 support
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
router.post("/", async (req, res) => {
  const { concPercent } = req.body;
 try {
    // Create a much stricter prompt
    const prompt = `
      The user's concentration level is ${concPercent}%. 
      - If it is below 50%, the user is DISTRACTED. Give a firm, 1-sentence tip to stop procrastinating and refocus.
      - If it is between 50% and 80%, the user is SLIGHTLY UNFOCUSED. Give a 1-sentence tip to improve flow.
      - If it is above 80%, the user is HIGHLY FOCUSED. Give a 1-sentence encouragement.
      Be concise and direct.
    `;
    
    const result = await model.generateContent(prompt);
    res.json({ advice: result.response.text() });
  } catch (err) {
    res.json({ advice: "Stay centered and keep going!" });
  }
});

export default router;