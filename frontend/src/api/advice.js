// src/api/advice.js
import axios from "axios";

export const getAdvice = async (prediction, confidence) => {
  // Logic to determine status before sending to AI
  const status = prediction === 1 ? "Focused" : "Distracted";
  const concPercent = Math.round(confidence * 100);

  try {
    const response = await axios.post(
      "https://focus-analyzer-ai-4.onrender.com/api/advice", 
      { concPercent, status }, // Send both!
      {
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      }
    );
    return response.data.advice;
  } catch (error) {
    console.error("Error fetching advice:", error);
    return "Keep working on your goals!";
  }
};