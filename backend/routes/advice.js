import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = express.Router();

// Configuration
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Use Gemini 3 Flash for speed and reliable 2026 support
const model = genAI.getGenerativeModel({ model: "gemini-3-flash" }); 

router.post("/", async (req, res) => {
  const { concPercent } = req.body;
  try {
    const result = await model.generateContent(`Focus level: ${concPercent}%. Give a 1-sentence tip.`);
    res.json({ advice: result.response.text() });
  } catch (err) {
    console.error("Gemini Error:", err.message);
    res.json({ advice: "Stay centered and keep going!" });
  }
});

export default router;