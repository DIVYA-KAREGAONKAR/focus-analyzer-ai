export async function getPrediction(sessionData) {
  try {
    const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/predict`, {
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
