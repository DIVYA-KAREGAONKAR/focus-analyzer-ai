import { useState, useEffect } from "react";
import axios from "axios";
import jsPDF from 'jspdf';
import Controls from "./components/Controls";
import SessionResult from "./components/SessionResult";
import FocusChart from "./components/FocusChart";
import Auth from "./components/Auth";
import "./index.css";
import { getAdvice } from "./api/advice";

// Replace with your actual backend URL
const API_BASE_URL = "https://focus-analyzer-ai-4.onrender.com";

// ✅ Final Clean Component (Relies on index.css)
const HistoryCard = ({ item }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div 
      className={`history-card ${item.status?.toLowerCase()}`} 
      onClick={() => setIsOpen(!isOpen)}
      style={{ cursor: 'pointer' }}
    >
      {/* ROW 1: Status & Score */}
      <div className="card-header">
        <div style={{display:'flex', alignItems:'center', gap: '6px'}}>
          <span className="status-dot"></span>
          <span style={{fontWeight: '600', fontSize: '0.9rem'}}>
            {item.status || "Completed"}
          </span>
        </div>
        <span style={{fontWeight: 'bold', fontSize: '0.9rem', color: '#374151'}}>
          {Math.round((item.active_ratio || 0) * 100)}%
        </span>
      </div>

      {/* ROW 2: Date & Arrow */}
      <div className="card-meta">
        <span>
          {new Date(item.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          <span style={{ margin: '0 4px', opacity: 0.3 }}>|</span>
          {new Date(item.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </span>
        <span style={{ fontSize: '10px', opacity: 0.5 }}>
          {isOpen ? "▲" : "▼"}
        </span>
      </div>

      {/* ROW 3: Advice (Only shows when open) */}
      {isOpen && item.advice && (
        <div className="card-advice-dropdown">
          <p style={{fontSize: '0.85rem', color: '#4b5563', lineHeight: '1.5', fontStyle: 'italic'}}>
            "{item.advice.replace(/\*\*/g, '')}"
          </p>
        </div>
      )}
    </div>
  );
};

function App() {
  const [user, setUser] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [switchCount, setSwitchCount] = useState(0);
  const [activeTime, setActiveTime] = useState(0);
  const [sessionData, setSessionData] = useState(null);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [advice, setAdvice] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // 1. Ask for Notification Permission on Load
  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  // 2. Persistence Check
  useEffect(() => {
    const savedUser = localStorage.getItem("focusUser");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // 3. Fetch History
  useEffect(() => {
    if (user) {
      const fetchUserHistory = async () => {
        try {
          const res = await axios.get(`${API_BASE_URL}/api/history/${user.id}`);
          setSessionHistory(res.data);
        } catch (err) {
          console.error("Error loading history:", err);
        }
      };
      fetchUserHistory();
    }
  }, [user]);

  // Timer
  useEffect(() => {
    let interval;
    if (startTime) {
      interval = setInterval(() => {
        setActiveTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [startTime]);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("focusUser");
  };

  const handleEvent = async (type) => {
    // 1. START
    if (type === "START") {
      console.log("🟢 Session STARTED");
      // Double check permission on start
      if (Notification.permission !== "granted") {
         Notification.requestPermission();
      }
      setStartTime(Date.now());
      setSwitchCount(0);
      setActiveTime(0);
      setSessionData(null);
      setAdvice("");
      setIsProcessing(false);
    }

    // 2. SWITCH
    if (type === "SWITCH") {
      console.log("twisted_rightwards_arrows Task SWITCHED");
      setSwitchCount((prev) => prev + 1);
    }

    // 3. STOP
    if (type === "STOP") {
      const end = Date.now();
      console.log("🔴 Session STOPPED. Analyzing...");

      setStartTime(null);
      setIsProcessing(true);

      const rawDurationMs = end - startTime;
      const safeDurationMs = Math.max(rawDurationMs, 2000);

      // Calculate Metrics
      const durationSeconds = safeDurationMs / 1000;
      const durationMin = safeDurationMs / 60000;
      const activeRatio = activeTime / durationSeconds; // Keep as Decimal (0.0 - 1.0)
      const safeSwitchRate = switchCount / (durationMin || 1);

      // Only multiply by 100 for the AI Payload
      const payloadForAI = {
        duration: durationSeconds,
        switch_count: switchCount,
        active_ratio: (activeRatio || 0) * 100, // Send 50.0 to AI
        switch_rate: safeSwitchRate
      };

      try {
        console.log("📤 Sending Data to ML:", payloadForAI);

        const predRes = await axios.post(`${API_BASE_URL}/api/predict`, payloadForAI);

        const prediction = predRes.data.prediction;
        const confidence = Math.round(predRes.data.confidence * 100);

        // Swap Logic (0=Focused for your specific model)
        const status = (prediction === 1) ? "Distracted" : "Focused";

        // Get Advice
        const adviceRes = await getAdvice(status, payloadForAI.active_ratio, switchCount);
        const newAdvice = adviceRes || "Stay consistent!";
        setAdvice(newAdvice);

        // ✅ NEW: Trigger Real-Time Notification
        if (status === "Distracted" && Notification.permission === "granted") {
           new Notification("⚠️ Focus Alert!", {
             body: `Distraction Detected! ${newAdvice.substring(0, 40)}...`,
             icon: "/logo192.png" // Uses your app logo if available
           });
        } else if (status === "Focused" && Notification.permission === "granted") {
            new Notification("🎯 Great Focus!", {
             body: `You maintained ${Math.round(payloadForAI.active_ratio)}% focus intensity!`,
             icon: "/logo192.png"
           });
        }

        // Save DECIMAL to state (so UI shows 50%, not 5000%)
        const finalResult = {
          ...payloadForAI,
          active_ratio: activeRatio, // Save 0.5 here
          prediction: prediction,
          confidence: confidence,
          status: status,
          advice: newAdvice,
          timestamp: new Date().toISOString()
        };

        setSessionData(finalResult);
        setSessionHistory(prev => [finalResult, ...prev]);

      } catch (err) {
        console.error("❌ Process Failed:", err);
        setAdvice("Could not analyze session. Please check connection.");
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const downloadPDF = () => {
    if (!sessionData) return;
    const doc = new jsPDF();
    // Fix: Multiply by 100 here since active_ratio is decimal
    const focusScore = Math.round(sessionData.active_ratio * 100);
    doc.setFontSize(22);
    doc.setTextColor(96, 165, 250);
    doc.text("Focus Analyzer Pro: Performance Report", 10, 20);
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`User: ${user.name}`, 10, 37);
    doc.text(`Overall Focus Score: ${focusScore}%`, 15, 60);
    const splitAdvice = doc.splitTextToSize(advice || "Analyzing flow...", 180);
    doc.text(splitAdvice, 10, 130);
    doc.save(`FocusReport_${Date.now()}.pdf`);
  };

  if (!user) {
    return <Auth onAuthSuccess={(userData) => setUser(userData)} />;
  }

  return (
    <div className="chat-layout">
      {/* 1. TOP NAVBAR */}
      <nav className="navbar">
        <div className="nav-logo">Focus Analyzer AI</div>
        <div className="nav-user">
          <span>{user?.name || "User"}</span>
          <button onClick={handleLogout} className="logout-btn">Sign Out</button>
        </div>
      </nav>

      <div className="layout-body">

        {/* 2. LEFT SIDEBAR */}
        <div className="history-list">
          <h4 style={{marginBottom: '1rem', color: '#6b7280', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px'}}>Session History</h4>
          {sessionHistory.length === 0 && <p style={{color: '#aaa', fontSize: '0.9rem'}}>No history yet.</p>}

          {sessionHistory.map((item, index) => (
             <HistoryCard key={index} item={item} />
          ))}
        </div>

        {/* 3. MAIN CENTER AREA */}
        <main className="main-center">

          <div className="content-scroll-area">

            {/* STATE 1: PROCESSING */}
            {isProcessing && (
              <div className="processing-state">
                <div className="spinner"></div>
                <h3>Analyzing Neural Flow...</h3>
                <p>Consulting AI Model & Generating Advice</p>
              </div>
            )}

            {/* STATE 2: ACTIVE TIMER */}
            {!isProcessing && startTime && (
               <div className="timer-display">
                  <div className="timer-circle">
                    <h1>{new Date(Date.now() - startTime).toISOString().substr(11, 8)}</h1>
                    <p>Focus Session Active</p>
                    <div className="pulse-ring"></div>
                  </div>
               </div>
            )}

            {/* STATE 3: WELCOME SCREEN (Gemini Style) */}
            {/* Logic: Show this ONLY if no active session AND no result yet */}
            {/* STATE 3: WELCOME SCREEN (Chart -> Text -> Button) */}
            {!isProcessing && !startTime && !sessionData && (
               <div className="welcome-container">
                 
                 {/* 1. CHART (Now at the Top & Full Size) */}
                 <div className="chart-wrapper" style={{ marginBottom: '30px', width: '100%' }}>
                   <FocusChart history={sessionHistory} />
                 </div>

                 {/* 2. TEXT (Middle, Focus-Themed) */}
                 <div style={{ textAlign: 'center', zIndex: 2 }}>
                   <h1 className="welcome-title">
                     Welcome back, {user.name?.split(" ")[0] || "Focus Pro"}
                   </h1>
                   <h2 className="welcome-subtitle">
                     Ready to optimize your cognitive flow?
                  
                   </h2>
                   <p style={{ color: '#6b7280', marginTop: '10px' }}>
                     Start a session to measure your attention span and intensity.
                   </p>
                 </div>style={{ color: 'white', cursor: 'pointer', marginTop: '20px', textAlign: 'center' }}

               </div>
            )}

            {/* STATE 4: DASHBOARD MODE (Result + Chart) */}
            {sessionData && (
               <div className="dashboard-view">

                 {/* A. Chart (Always Top) */}
                 <div className="chart-wrapper">
                   <FocusChart history={sessionHistory} />
                 </div>

                 {/* B. Result (Below Chart) */}
                 <div className="result-wrapper" style={{ marginTop: '30px', animation: 'fadeIn 0.5s ease' }}>
                    <SessionResult sessionData={sessionData} />

                    <div style={{display: 'flex', justifyContent: 'center', marginTop: '20px'}}>
                      <button onClick={downloadPDF} className="download-btn">
                        Download PDF Report
                      </button>
                    </div>
                 </div>

               </div>
            )}
          </div>

          {/* 4. BOTTOM CONTROLS */}
          <div className="bottom-input-area">
            <div className="controls-card">

              {!startTime && !isProcessing && (
                <button
                  className="ctrl-btn start-btn"
                  onClick={() => {
                    setSessionData(null);
                    handleEvent("START");
                  }}
                >
                  {sessionData ? "Start New Session" : "Start Focus Session"}
                </button>
              )}

              {startTime && !isProcessing && (
                <div className="btn-group">
                  <button
                    className="ctrl-btn switch-btn"
                    onClick={() => handleEvent("SWITCH")}
                  >
                    Switch Task ({switchCount})
                  </button>

                  <button
                    className="ctrl-btn stop-btn"
                    onClick={() => handleEvent("STOP")}
                  >
                    Stop Session
                  </button>
                </div>
              )}

              {isProcessing && (
                <button className="ctrl-btn" disabled style={{opacity: 0.7, cursor: 'not-allowed'}}>
                  Processing...
                </button>
              )}

            </div>
          </div>

        </main>
      </div>
    </div>
  );
}

export default App;