// src/api/predict.js
export async function getPrediction(sessionData) {
  try {
    const ML_URL = "https://focus-analyzer-ai-3.onrender.com/predict";

    // 1. Prepare Data
    const duration = Number(sessionData.duration) || 0.1; 
    const switchCount = Number(sessionData.switch_count) || 0;
    const activeRatio = Number(sessionData.active_ratio);

    const cleanedPayload = {
      duration: duration,
      switch_count: switchCount,       
      switch_rate: switchCount / duration, 
      active_ratio: activeRatio
    };

    // 2. Fetch from ML (We still want the 'confidence' score from the AI)
    const response = await fetch(ML_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cleanedPayload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Prediction failed: ${response.status}`);
    }

    const result = await response.json();

    // ---------------------------------------------------------
    // 3. THE FIX: "Math Override" to ensure consistency
    // If the ML Model contradicts the hard data, we correct it here.
    // ---------------------------------------------------------
    
    // Logic: If active > 50%, it MUST be Focused (1). Else Distracted (0).
    const correctPrediction = activeRatio >= 0.5 ? 1 : 0;
    
    // Check if ML was wrong
    if (Number(result.prediction) !== correctPrediction) {
      console.warn(`⚠️ ML Mismatch corrected. ML said: ${result.prediction}, Math said: ${correctPrediction}`);
      result.prediction = correctPrediction;
      
      // Optional: If ML was wrong, force confidence to match the active ratio
      // This prevents "Distracted with 90% confidence" when you were actually Focused.
      result.confidence = activeRatio; 
    }
    // ---------------------------------------------------------

    return result;

  } catch (error) {
    console.error("Error fetching prediction:", error);
    // Fallback if API fails completely: Return math-based result
    const fallbackRatio = Number(sessionData.active_ratio) || 0;
    return {
      prediction: fallbackRatio >= 0.5 ? 1 : 0,
      confidence: fallbackRatio
    };
  }
}