import express from "express"; // 1. Added missing express import
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = express.Router(); // 2. Added router initialization

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

router.post("/", async (req, res) => {
  const { concPercent } = req.body;
  try {
    const prompt = `The user concentration level is ${concPercent}%. If it is low, give a 1-sentence tip to refocus. If it is high, give a 1-sentence encouragement.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const advice = response.text();
    
    res.json({ advice });
  } catch (err) {
    console.error("Gemini Error:", err);
    res.status(500).json({ advice: "Take a deep breath and stay focused!" });
  }
});

export default router; // 3. This matches your Server.js import