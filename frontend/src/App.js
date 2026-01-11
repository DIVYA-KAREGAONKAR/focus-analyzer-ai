import { useState, useEffect } from "react";
import axios from "axios";
import Controls from "./components/Controls";
import SessionResult from "./components/SessionResult";

function App() {
  const [startTime, setStartTime] = useState(null);
  const [switchCount, setSwitchCount] = useState(0);
  const [activeTime, setActiveTime] = useState(0);
  const [sessionData, setSessionData] = useState(null);

  const sendEvent = async (type) => {
    try {
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/event`, {
        userId: "u1",
        eventType: type,
      });
    } catch (err) {
      console.error("Event sending failed:", err);
    }
  };

  // Track active time
  useEffect(() => {
    let interval;
    if (startTime) {
      interval = setInterval(() => {
        setActiveTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [startTime]);

  const handleEvent = async (type) => {
    if (type === "START") {
      setStartTime(Date.now());
      setSwitchCount(0);
      setActiveTime(0);
      setSessionData(null);
    }

    if (type === "SWITCH") {
      setSwitchCount((prev) => prev + 1);
    }

    if (type === "STOP") {
      const end = Date.now();
      const durationSec = (end - startTime) / 1000;
      const durationMin = durationSec / 60;

      const switchRate = durationMin > 0 ? switchCount / durationMin : 0;
      const activeRatio = durationSec > 0 ? activeTime / durationSec : 0;

      const data = {
        duration: durationMin,
        switch_count: switchCount,
        switch_rate: switchRate,
        active_ratio: activeRatio,
      };

      console.log("Session Data:", data);

      // Send prediction request
      try {
        const res = await axios.post(
          `${process.env.REACT_APP_BACKEND_URL}/api/predict`,
          data
        );
        console.log("Prediction result:", res.data);
        setSessionData({ ...data, ...res.data });
      } catch (err) {
        console.error("Prediction error:", err);
        setSessionData(data); // fallback to session data if prediction fails
      }
    }

    // Always send event
    await sendEvent(type);
  };

  return (
    <div className="app-container">
      <Controls onEvent={handleEvent} />
      <SessionResult sessionData={sessionData} />
    </div>
  );
}

export default App;
