// src/api/predict.js
export async function getPrediction(sessionData) {
  try {
    const ML_URL = "https://focus-analyzer-ai-3.onrender.com/predict";

    // Calculate the missing field: switch_rate (switches / duration)
    const duration = Number(sessionData.duration) || 0.1; // Prevent division by zero
    const switchCount = Number(sessionData.switch_count) || 0;

    const cleanedPayload = {
      duration: duration,
      switch_rate: switchCount / duration, // This is the missing field!
      active_ratio: Number(sessionData.active_ratio)
    };

    const response = await fetch(ML_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cleanedPayload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Prediction failed: ${response.status}. Details: ${JSON.stringify(errorData)}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching prediction:", error);
    throw error;
  }
}