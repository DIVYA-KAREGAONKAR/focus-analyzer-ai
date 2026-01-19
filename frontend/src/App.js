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

  // FIX 1: Smart Score Calculation (Handles both 0.85 and 85)
  const getScore = (ratio) => {
    if (!ratio) return 0;
    return ratio <= 1 ? Math.round(ratio * 100) : Math.round(ratio);
  };

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
          {getScore(item.active_ratio)}%
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
      const activeRatio = activeTime / durationSeconds; 
      const safeSwitchRate = switchCount / (durationMin || 1);

      const payloadForAI = {
        duration: durationSeconds,
        switch_count: switchCount,
        active_ratio: (activeRatio || 0), // Kept as decimal here for consistency
        switch_rate: safeSwitchRate
      };

      try {
        console.log("📤 Sending Data to ML:", payloadForAI);

        const predRes = await axios.post(`${API_BASE_URL}/api/predict`, payloadForAI);
        const prediction = predRes.data.prediction;
        const confidence = Math.round(predRes.data.confidence * 100);
        const status = (prediction === 1) ? "Distracted" : "Focused";

        // Get Advice
        const adviceRes = await getAdvice(status, payloadForAI.active_ratio, switchCount);
        const newAdvice = adviceRes || "Stay consistent!";
        setAdvice(newAdvice);

        // Notification Logic
        if (Notification.permission === "granted") {
           if (status === "Distracted") {
             new Notification("⚠️ Focus Alert!", { body: "Distraction Detected!" });
           } else {
             new Notification("🎯 Great Focus!", { body: "You maintained high focus!" });
           }
        }

        const finalResult = {
          ...payloadForAI,
          active_ratio: activeRatio,
          prediction: prediction,
          confidence: confidence,
          status: status,
          advice: newAdvice,
          timestamp: new Date().toISOString()
        };

        // ✅ Save to Database
        try {
            await axios.post(`${API_BASE_URL}/api/history`, { 
                userId: user.id, 
                session: finalResult 
            });
            console.log("Saved to DB successfully");
        } catch (dbErr) {
            console.error("Failed to save to DB:", dbErr);
        }

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
    
    // FIX 2: Correct PDF Score Calculation
    const rawScore = sessionData.active_ratio || 0;
    const focusScore = rawScore <= 1 ? Math.round(rawScore * 100) : Math.round(rawScore);

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

  // FIX 3: Global Data Normalization
  // This creates a clean copy of history where all decimals (0.85) become (85)
  // We pass THIS to the Chart and History List to ensure consistency.
  const normalizedHistory = sessionHistory.map(session => ({
    ...session,
    active_ratio: session.active_ratio <= 1 
      ? session.active_ratio * 100 
      : session.active_ratio
  }));

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
          {normalizedHistory.length === 0 && <p style={{color: '#aaa', fontSize: '0.9rem'}}>No history yet.</p>}

          {/* Use normalizedHistory here */}
          {normalizedHistory.map((item, index) => (
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

            {/* STATE 3: WELCOME SCREEN */}
            {!isProcessing && !startTime && !sessionData && (
               <div className="welcome-container">
                 
                 {/* 1. CHART (Use normalizedHistory) */}
                 <div className="chart-wrapper" style={{ marginBottom: '30px', width: '100%' }}>
                   <FocusChart history={normalizedHistory} />
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
                 </div>

               </div>
            )}

            {/* STATE 4: DASHBOARD MODE (Result + Chart) */}
            {sessionData && (
               <div className="dashboard-view">

                 {/* A. Chart (Use normalizedHistory) */}
                 <div className="chart-wrapper">
                   <FocusChart history={normalizedHistory} />
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