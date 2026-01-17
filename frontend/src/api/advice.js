// src/api/advice.js
import axios from "axios";

export const getAdvice = async (concPercent) => {
  try {
    const response = await axios.post(
      "https://focus-analyzer-ai-4.onrender.com/api/advice", 
      { concPercent }, 
      {
        headers: {
          "Content-Type": "application/json",
          // Adding this header prevents Cloudflare from blocking your request as a 'bot'
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      }
    );
    return response.data.advice;
  } catch (error) {
    console.error("Error fetching advice:", error);
    return "Could not fetch advice.";
  }
};