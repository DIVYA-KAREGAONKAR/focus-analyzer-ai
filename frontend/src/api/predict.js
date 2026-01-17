// src/api/predict.js
export async function getPrediction(sessionData) {
  try {
    // Calling the ML server directly from the browser to bypass Cloudflare challenges
    const ML_URL = "https://focus-analyzer-ai-3.onrender.com/predict";

    const response = await fetch(ML_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(sessionData)
    });

    if (!response.ok) {
      throw new Error(`Prediction failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching prediction:", error);
    throw error;
  }
}