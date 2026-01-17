import { useEffect, useState } from "react";
import { getPrediction } from "../api/predict";
import "../styles/SessionResults.css";
import { getAdvice } from "../api/advice";

// Destructure setAdvice from props to sync with App.js for PDF
function SessionResult({ sessionData, setAdvice }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [localAdvice, setLocalAdvice] = useState(""); 

  useEffect(() => {
    if (!sessionData) return;

    const predict = async () => {
      try {
        setLoading(true);
        const res = await getPrediction(sessionData);
        
        if (res && typeof res.confidence === "number") {
          setResult(res);
          
          // Trigger Advice with both prediction and confidence
          const adviceText = await getAdvice(res.prediction, res.confidence);
          setLocalAdvice(adviceText);
          setAdvice(adviceText); // Update App.js state for PDF report
        } else {
          setResult({ prediction: res?.prediction ?? 0, confidence: 0 });
        }
      } catch (err) {
        console.error("Prediction failed", err);
        setResult({ prediction: 0, confidence: 0 });
      } finally {
        setLoading(false);
      }
    };

    predict();
  }, [sessionData, setAdvice]);

  if (!sessionData) return null;

  const isFocused = result?.prediction === 1;
  const confidencePercent = result ? Math.round(result.confidence * 100) : 0;

  return (
    <div className="result-container">
      {loading ? (
        <div className="flex-center">
          <div className="loader"></div>
          <p>AI is analyzing your behavior...</p>
        </div>
      ) : result && (
        <div className="result-content">
          {/* Dynamic Status Badge */}
          <div className={`badge ${isFocused ? "focused" : "distracted"}`}>
            {isFocused ? "🎯 Focused" : "⚠️ Distracted"}
          </div>

          <div className="metrics-row">
            <span>Intensity: {confidencePercent}%</span>
          </div>

          {/* Professional Progress Bar */}
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${confidencePercent}%`,
                backgroundColor: isFocused ? "var(--neon-green)" : "var(--neon-red)",
                boxShadow: `0 0 10px ${isFocused ? "var(--neon-green)" : "var(--neon-red)"}`
              }}
            />
          </div>

          {/* Context-Aware Advice Display */}
          {localAdvice && (
            <div className={`advice-box ${isFocused ? "focused" : "distracted"}`}>
              <h4>{isFocused ? "🚀 Flow Sustained" : "🧭 Refocus Strategy"}</h4>
              <p>{localAdvice}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SessionResult;