// src/api/advice.js
import axios from "axios";

export const getAdvice = async (concPercent) => {
  try {
    // Corrected: Removed the ${} or added quotes inside
    const response = await axios.post("https://focus-analyzer-ai-4.onrender.com/api/advice", {
      concPercent,
    });
    return response.data.advice;
  } catch (error) {
    console.error("Error fetching advice:", error);
    return "Could not fetch advice.";
  }
};