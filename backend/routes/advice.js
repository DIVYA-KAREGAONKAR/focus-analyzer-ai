import express from "express";
import axios from "axios";

const router = express.Router();

// 1. UPGRADED FALLBACKS (Detailed & Impactful)
// Used only if Google AI fails.
const getFallbackAdvice = (status) => {
  if (status === "Focused") {
    return `Analysis: You achieved a high flow state, indicating strong neural synchronization.
Impact: This level of focus strengthens myelination in the brain, making future deep work easier.
Action: To sustain this, take a 5-minute non-digital break (walk or stretch) before your next sprint.`;
  } else {
    return `Analysis: High task-switching detected. This "context switching" creates attention residue, lowering IQ effectively by 10 points.
Impact: You are expending energy on switching rather than doing, leading to faster burnout.
Action: Use the "Single-Tasking Rule" for the next 20 minutes: Close all tabs except the one you are working on.`;
  }
};

router.post("/", async (req, res) => {
  const { concPercent, status } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn("⚠️ No API Key found.");
    return res.json({ advice: getFallbackAdvice(status) });
  }

  try {
    // ---------------------------------------------------------
    // STEP 1: AUTO-DISCOVER MODEL (Keep this, it works!)
    // ---------------------------------------------------------
    const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const listResponse = await axios.get(listUrl);
    
    const validModel = listResponse.data?.models?.find(m => 
      m.supportedGenerationMethods?.includes("generateContent") &&
      (m.name.includes("gemini") || m.name.includes("pro") || m.name.includes("flash"))
    );

    if (!validModel) throw new Error("No valid Gemini models found.");
    const modelName = validModel.name.replace("models/", "");

    // ---------------------------------------------------------
    // STEP 2: THE NEW "IMPACTFUL" PROMPT
    // ---------------------------------------------------------
    const genUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    
    // We ask for a structured, psychological breakdown
    const promptText = `
      Act as an elite Cognitive Science Performance Coach.
      User Session Data:
      - Status: ${status}
      - Focus Intensity: ${concPercent}%
      
      Task: Write a 3-part analysis (strict format, no bolding/markdown, just text lines):
      
      1. Observation: Briefly analyze their cognitive state based on the score.
      2. The Science: Explain the mental impact of this state (e.g., dopamine, flow, cortisol, attention residue).
      3. Protocol: Give one specific, high-leverage action to execute immediately.
      
      Keep the tone professional, direct, and empowering.
    `;

    const payload = {
      contents: [{ parts: [{ text: promptText }] }]
    };

    const response = await axios.post(genUrl, payload, {
      headers: { "Content-Type": "application/json" }
    });

    const adviceText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (adviceText) {
      console.log("✅ AI Advice Generated (Detailed Mode)");
      res.json({ advice: adviceText });
    } else {
      throw new Error("Empty response");
    }

  } catch (err) {
    console.error("❌ AI FAILED:", err.message);
    res.json({ advice: getFallbackAdvice(status) });
  }
});

export default router;