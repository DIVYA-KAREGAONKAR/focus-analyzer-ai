import express from "express";
import OpenAI from "openai";

const router = express.Router();

// Create client directly
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post("/advice", async (req, res) => {
  const { concPercent } = req.body;

  try {
    const prompt = `The user focus percentage is ${concPercent}%. Give a short advice to improve focus.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
    });

    const advice = completion.choices[0].message.content;
    res.json({ advice });
  } catch (err) {
    console.error(err);
    res.status(500).json({ advice: "Could not fetch advice." });
  }
});

export default router;
