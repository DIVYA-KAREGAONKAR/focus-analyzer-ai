// src/api/predict.js
export async function getPrediction(sessionData) {
  try {
    const ML_URL = "https://focus-analyzer-ai-3.onrender.com/predict";

    // CLEAN DATA: Extract only the numbers the ML model expects
    const cleanedData = {
      duration: Number(sessionData.duration),
      switch_count: Number(sessionData.switch_count),
      active_ratio: Number(sessionData.active_ratio)
    };

    const response = await fetch(ML_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(cleanedData) // Send the cleaned object
    });

    if (!response.ok) {
      // This will now catch 422 errors specifically
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Prediction failed: ${response.status}. Details: ${JSON.stringify(errorData)}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching prediction:", error);
    throw error;
  }
}