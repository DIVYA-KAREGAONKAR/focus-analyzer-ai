import "../index.css"; 

function SessionResult({ sessionData }) {
  if (!sessionData) return null;

  const isFocused = sessionData.status === "Focused";
  const confidencePercent = sessionData.active_ratio <= 1 
      ? Math.round(sessionData.active_ratio * 100) 
      : Math.round(sessionData.active_ratio);
  
  // 1. SAFETY: Default to empty string if advice is missing
  const adviceText = sessionData.advice || "Session analysis complete.";

  return (
    <div className="result-container">
      <div className="result-content">
        
        <div className={`badge ${isFocused ? "focused" : "distracted"}`}>
          {isFocused ? "🎯 Focused" : "⚠️ Distracted"}
        </div>

        <div className="metrics-row">
          <span>Focus Intensity: {confidencePercent}%</span>
        </div>

        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{
              width: `${confidencePercent}%`,
              backgroundColor: isFocused ? "var(--focus-color)" : "var(--distract-color)",
              transition: 'width 1s ease-in-out'
            }}
          />
        </div>

        <div className={`advice-box ${isFocused ? "focused" : "distracted"}`}>
            <h4>{isFocused ? "🚀 Flow Analysis" : "🧭 Strategy"}</h4>
            {/* 2. SAFETY: Ensure we only split if it's a string */}
            {String(adviceText).split('\n').map((line, i) => (
               line.trim() && <p key={i} style={{marginBottom:'8px'}}>{line}</p>
            ))}
        </div>

      </div>
    </div>
  );
}

export default SessionResult;