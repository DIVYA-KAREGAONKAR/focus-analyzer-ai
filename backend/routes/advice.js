import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

router.post("/", async (req, res) => {
  const { concPercent } = req.body;
  try {
    const prompt = `The user concentration level is ${concPercent}%. If it is low, give a 1-sentence tip to refocus. If it is high, give a 1-sentence encouragement.`;
    
    const result = await model.generateContent(prompt);
    const advice = result.response.text();
    
    res.json({ advice });
  } catch (err) {
    res.status(500).json({ advice: "Take a deep breath and stay focused!" });
  }
});