export async function getPrediction(sessionData) {
  const response = await fetch("http://localhost:5000/api/predict", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(sessionData)
  });

  return response.json();
}
