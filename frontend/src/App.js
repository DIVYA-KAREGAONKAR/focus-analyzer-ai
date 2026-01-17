import { useState, useEffect } from "react";
import axios from "axios";
import Controls from "./components/Controls";
import SessionResult from "./components/SessionResult";

function App() {
  const [startTime, setStartTime] = useState(null);
  const [switchCount, setSwitchCount] = useState(0);
  const [activeTime, setActiveTime] = useState(0);
  const [sessionData, setSessionData] = useState(null);

  // Background activity tracker
  useEffect(() => {
    let interval;
    if (startTime) {
      interval = setInterval(() => {
        setActiveTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [startTime]);

  const handleEvent = (type) => {
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

      const data = {
        duration: durationMin,
        switch_count: switchCount,
        switch_rate: durationMin > 0 ? switchCount / durationMin : 0,
        active_ratio: durationSec > 0 ? activeTime / durationSec : 0,
        timestamp: new Date().toISOString()
      };

      setSessionData(data); // Initial state set to trigger the Analysis UI
      setStartTime(null);   // Reset timer
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            Focus Analyzer Pro
          </h1>
          <p className="text-slate-400 mt-2">Professional Cognitive Performance Tracking</p>
        </header>

        <main className="grid md:grid-cols-2 gap-8">
          <div className="glass-card">
            <Controls onEvent={handleEvent} />
          </div>
          
          <div className="glass-card min-h-[300px]">
            {sessionData ? (
              <SessionResult sessionData={sessionData} />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500 italic">
                Start a session to see your focus analysis...
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;