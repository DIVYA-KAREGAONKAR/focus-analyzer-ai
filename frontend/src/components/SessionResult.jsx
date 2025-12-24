import { useEffect, useState } from "react";
import { getPrediction } from "../api/predict";
import "../styles/SessionResults.css";

function SessionResult({ sessionData }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!sessionData) return;

    const predict = async () => {
      try {
        setLoading(true);

        const res = await getPrediction(sessionData);
        console.log("API result:", res); // Debug API response

        // Ensure confidence is a number
        if (res && typeof res.confidence === "number") {
          setResult(res);
        } else {
          console.warn("Invalid confidence value from API:", res);
          setResult({ prediction: res?.prediction ?? 0, confidence: 0 });
        }
      } catch (err) {
        console.error("Prediction failed", err);
        setResult({ prediction: 0, confidence: 0 }); // fallback
      } finally {
        setLoading(false);
      }
    };

    predict();
  }, [sessionData]);

  if (!sessionData) return null;

  const confidencePercent =
    result && typeof result.confidence === "number"
      ? Math.round(result.confidence * 100)
      : "N/A";

  return (
    <div className="app-container">
      <div className="card">
        <h2>AI Focus Analyzer</h2>

        {loading && <p style={{ textAlign: "center" }}>Analyzing session...</p>}

        {result && (
          <div className="result">
            <div
              className={`badge ${
                result.prediction === 1 ? "distracted" : "focused"
              }`}
            >
              {result.prediction === 1 ? "Distracted" : "Focused"}
            </div>

            <div className="confidence">
              Confidence: {confidencePercent}%
            </div>

            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width:
                    typeof result.confidence === "number"
                      ? `${result.confidence * 100}%`
                      : "0%",
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SessionResult;
