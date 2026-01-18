import { useEffect } from "react";
import "../index.css"; 

function SessionResult({ sessionData }) {
  if (!sessionData) return null;

  const isFocused = sessionData.status === "Focused";
  const confidencePercent = Math.round(sessionData.active_ratio * 100);
  
  // SAFETY FIX: Ensure adviceText is always a string, never null/undefined
  const adviceText = typeof sessionData.advice === 'string' ? sessionData.advice : "Analysis unavailable.";

  return (
    <div className="result-container">
      <div className="result-content">
        
        {/* Status Badge */}
        <div className={`badge ${isFocused ? "focused" : "distracted"}`}>
          {isFocused ? "🎯 Focused" : "⚠️ Distracted"}
        </div>

        {/* Metrics */}
        <div className="metrics-row">
          <span>Focus Intensity: {confidencePercent}%</span>
        </div>

        {/* Progress Bar */}
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{
              width: `${confidencePercent}%`,
              backgroundColor: isFocused ? "var(--focus-color)" : "var(--distract-color)",
              boxShadow: `0 0 10px ${isFocused ? "rgba(20, 174, 92, 0.5)" : "rgba(219, 52, 45, 0.5)"}`,
              transition: 'width 1s ease-in-out'
            }}
          />
        </div>

        {/* Advice Box (Fixed Logic) */}
        <div className={`advice-box ${isFocused ? "focused" : "distracted"}`}>
            <h4>{isFocused ? "🚀 Flow Analysis" : "🧭 Strategy for Improvement"}</h4>
            
            {/* The .split() function caused the crash. We added (adviceText || "") to prevent it. */}
            {(adviceText || "").split('\n').map((line, i) => (
               line.trim() && <p key={i} style={{marginBottom:'10px'}}>{line}</p>
            ))}
        </div>

      </div>
    </div>
  );
}

export default SessionResult;