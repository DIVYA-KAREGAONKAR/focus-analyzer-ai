import { useState, useEffect } from "react";
import axios from "axios";
import jsPDF from 'jspdf';
import Controls from "./components/Controls";
import SessionResult from "./components/SessionResult";
import FocusChart from "./components/FocusChart";
import Auth from "./components/Auth";
import "./index.css"
import { getAdvice } from "./api/advice";

// Replace with your actual backend URL
const API_BASE_URL = "https://focus-analyzer-ai-4.onrender.com"; 

// ✅ NEW: Smart Sidebar Component (Handles "Click to Expand")
const HistoryCard = ({ item }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div 
      className={`history-card ${item.status?.toLowerCase()}`} 
      onClick={() => setIsOpen(!isOpen)}
      style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
    >
      {/* 1. Header: Status & Score */}
      <div className="card-header">
        <div style={{display:'flex', alignItems:'center'}}>
          <span className="status-dot"></span>
          <span className="card-status">{item.status || "Completed"}</span>
        </div>
        <span className="card-score">{Math.round(item.active_ratio)}%</span>
      </div>

      {/* 2. Date & Time */}
      <div className="card-meta">
        {new Date(item.timestamp).toLocaleDateString('en-US', { 
          weekday: 'short', month: 'short', day: 'numeric', 
          hour: '2-digit', minute: '2-digit' 
        })}
        {/* Arrow Hint */}
        <span style={{float: 'right', fontSize: '10px', opacity: 0.6}}>
          {isOpen ? "▲" : "▼"}
        </span>
      </div>

      {/* 3. Hidden Advice (Shows only when clicked) */}
      {isOpen && item.advice && (
        <div className="card-advice-dropdown" style={{marginTop: '10px', borderTop: '1px solid #eee', paddingTop: '8px'}}>
          <p style={{fontSize: '0.85rem', color: '#555', lineHeight: '1.4'}}>
            {item.advice.replace(/\*\*/g, '')}
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

  // 1. Persistence Check
  useEffect(() => {
    const savedUser = localStorage.getItem("focusUser");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // 2. Fetch History
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
      if ("Notification" in window && Notification.permission !== "granted") {
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
      const activeRatio = activeTime / durationSeconds;
      const safeSwitchRate = switchCount / (durationMin || 1);

      // ✅ FIX: Calculate percentage BEFORE sending
      // This sends "90.0" instead of "0.9"
      const activePercentage = (activeRatio || 0) * 100;

      const sessionDataPayload = {
        duration: durationSeconds, 
        switch_count: switchCount,
        active_ratio: activePercentage, // Send the % value (0-100)
        switch_rate: safeSwitchRate
      };

      try {
        console.log("📤 Sending Data to ML:", sessionDataPayload);

        const predRes = await axios.post(`${API_BASE_URL}/api/predict`, sessionDataPayload);
        
        const prediction = predRes.data.prediction;
        console.log(`🧠 Raw Output: ${prediction} (0=Distracted, 1=Focused)`);

        const confidence = Math.round(predRes.data.confidence * 100);
        
        // ✅ Your Manual Swap (0=Focused logic)
        const status = (prediction === 1) ? "Distracted" : "Focused";

        // 1. Get Advice
        const adviceRes = await getAdvice(status, activePercentage, switchCount);
        const newAdvice = adviceRes || "Stay consistent!";
        setAdvice(newAdvice);

        // 2. Build Result
        const finalResult = {
          ...sessionDataPayload,
          prediction: prediction, 
          confidence: confidence,
          status: status,
          advice: newAdvice,
          timestamp: new Date().toISOString()
        };

        // 3. Save to State
        setSessionData(finalResult);

        // 4. Update History
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
    const focusScore = Math.round(sessionData.active_ratio);
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
        
        {/* 2. LEFT SIDEBAR (Using Smart Card) */}
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

            {/* STATE 3: DASHBOARD MODE (Chart + Result) */}
            {!isProcessing && !startTime && (
               <div className="dashboard-view">
                 
                 {/* A. Chart (Always Top) */}
                 <div className="chart-wrapper">
                   <FocusChart history={sessionHistory} />
                 </div>

                 {/* B. Result (Below Chart) */}
                 {sessionData && (
                    <div className="result-wrapper" style={{ marginTop: '30px', animation: 'fadeIn 0.5s ease' }}>
                      <SessionResult sessionData={sessionData} />
                      
                      <div style={{display: 'flex', justifyContent: 'center', marginTop: '20px'}}>
                        <button onClick={downloadPDF} className="download-btn">
                          Download PDF Report
                        </button>
                      </div>
                    </div>
                 )}

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



