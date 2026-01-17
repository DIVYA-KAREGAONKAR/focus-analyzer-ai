import { useEffect, useState } from "react";
import { getPrediction } from "../api/predict";
import { getAdvice } from "../api/advice";
import "../styles/SessionResults.css";

function SessionResult({ sessionData, setAdvice }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [localAdvice, setLocalAdvice] = useState(""); 

  useEffect(() => {
    if (!sessionData) return;

    const predict = async () => {
      try {
        setLoading(true);
        setResult(null); 
        setLocalAdvice("");

        const res = await getPrediction(sessionData);
        
        if (res && typeof res.confidence === "number") {
          setResult(res);
          const adviceText = await getAdvice(res.prediction, res.confidence);
          setLocalAdvice(adviceText);
          setAdvice(adviceText); 

          // Trigger Active Nudge if Distracted
          // Assuming 1 = Focused, 0 = Distracted based on your current logic
          if (res.prediction === 0 && Notification.permission === "granted") {
            new Notification("🎯 Focus Analyzer Alert", {
              body: adviceText || "You've drifted! Time to refocus.",
              icon: "/logo192.png", 
              silent: false
            });
          }
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
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <p>AI is analyzing your behavior...</p>
        </div>
      ) : result && (
        <div className="result-content">
          <div className={`badge ${isFocused ? "focused" : "distracted"}`}>
            {isFocused ? "🎯 Focused" : "⚠️ Distracted"}
          </div>

          <div className="metrics-row">
            <span>Intensity: {confidencePercent}%</span>
          </div>

          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${confidencePercent}%`,
                backgroundColor: isFocused ? "var(--neon-green)" : "var(--neon-red)",
                boxShadow: `0 0 10px ${isFocused ? "var(--neon-green)" : "var(--neon-red)"}`,
                transition: 'width 1s ease-in-out'
              }}
            />
          </div>

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