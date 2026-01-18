// src/api/advice.js
import axios from "axios";

// CHANGED: Now accepts 'status' (string) and 'concPercent' (number) directly.
// This prevents the file from guessing wrong based on 0 or 1.
export const getAdvice = async (status, concPercent) => {
  try {
    const response = await axios.post(
      "https://focus-analyzer-ai-4.onrender.com/api/advice", 
      { concPercent, status }, 
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
    return "Great effort! Stay centered and keep working on your goals.";
  }
};