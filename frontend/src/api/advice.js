// src/api/advice.js
import axios from "axios";

export const getAdvice = async (concPercent) => {
  try {
    const response = await axios.post("http://localhost:5000/api/advice", {
      concPercent,
    });
    return response.data.advice;
  } catch (error) {
    console.error("Error fetching advice:", error);
    return "Could not fetch advice.";
  }
};
