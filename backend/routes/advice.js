// backend/routes/advice.js
import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 1. Select Model
const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash",
  // 2. CONFIGURATION: Force longer output
  generationConfig: {
    maxOutputTokens: 600, // Allow up to ~400 words
    temperature: 0.7,     // Creative but stable
  }
});

router.post("/", async (req, res) => {
  const { concPercent, status } = req.body;

  // 3. PROMPT: Explicitly demand length and structure
  const prompt = `
    Role: You are an elite neuro-performance coach writing a session report.
    Context: The user finished a work session with a focus score of ${concPercent}% (${status}).
    
    Task: Write a detailed 4-paragraph analysis. Do not be brief. You must cover:
    
    1.  **State Analysis**: Define exactly what a ${concPercent}% score means for their cognitive load.
    2.  **Psychological Impact**: Explain the mental cost or benefit of this specific state (e.g. dopamine levels, cortisol, flow state depth).
    3.  **Corrective/Sustaining Strategy**: Provide one specific, advanced protocol (e.g. "Non-Sleep Deep Rest", "40Hz Binaural Beats", "The 5-4-3-2-1 Grounding Method"). Explain how to do it in 2-3 sentences.
    4.  **Neuroplasticity Tip**: Give advice on how to train the brain to improve this baseline next time.

    Output Rules:
    - Write at least 150 words.
    - Use professional, scientific tone.
    - Do NOT use markdown symbols like ** or #. Just use plain text with line breaks.
  `;

  try {
    const result = await model.generateContent(prompt);
    const adviceText = result.response.text();
    
    // Clean formatting just in case
    const cleanAdvice = adviceText.replace(/\*\*/g, "").replace(/#/g, "");
    
    res.json({ advice: cleanAdvice });
  } catch (err) {
    console.error("AI Error:", err);
    res.json({ advice: "Analysis unavailable. Maintain your current workflow and attempt to minimize task-switching for the next 20 minutes." });
  }
});

export default router;