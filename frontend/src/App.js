import { useState, useEffect } from "react";
import axios from "axios";
import jsPDF from 'jspdf';
import Controls from "./components/Controls";
import SessionResult from "./components/SessionResult";
import FocusChart from "./components/FocusChart";
import Auth from "./components/Auth";
import "./index.css"
import { getAdvice } from "./api/advice"; // <--- Add this import
// Replace with your actual backend URL (e.g., your Render.com URL)
const API_BASE_URL = "https://focus-analyzer-ai-4.onrender.com"; 

function App() {
  const [user, setUser] = useState(null); 
  const [startTime, setStartTime] = useState(null);
  const [switchCount, setSwitchCount] = useState(0);
  const [activeTime, setActiveTime] = useState(0);
  const [sessionData, setSessionData] = useState(null);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [advice, setAdvice] = useState("");
// Add this with your other useState lines
const [isProcessing, setIsProcessing] = useState(false);
  // 1. Persistence Check: Stay logged in on refresh
  useEffect(() => {
    const savedUser = localStorage.getItem("focusUser");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // 2. Fetch History from Backend on Login
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

  useEffect(() => {
    let interval;
    if (startTime) {
      interval = setInterval(() => {
        setActiveTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [startTime]);

  // 3. Define the missing logout function
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("focusUser");
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem("focusUser", JSON.stringify(userData));
  };

 const handleEvent = async (type) => {
    // 1. START EVENT
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

    // 2. SWITCH EVENT
    if (type === "SWITCH") {
      console.log("twisted_rightwards_arrows Task SWITCHED");
      setSwitchCount((prev) => prev + 1);
    }

    // 3. STOP EVENT (The Important Part)
   if (type === "STOP") {
      const end = Date.now();
      console.log("🔴 Session STOPPED. Analyzing...");
      
      setStartTime(null);
      setIsProcessing(true); // Show Loading Spinner
      
      const rawDurationMs = end - startTime;
      const safeDurationMs = Math.max(rawDurationMs, 2000); 

      // Calculate Metrics
      const durationSeconds = safeDurationMs / 1000; 
      const durationMin = safeDurationMs / 60000;
      const activeRatio = activeTime / durationSeconds;
      const safeSwitchRate = switchCount / (durationMin || 1);

      const sessionDataPayload = {
        duration: durationSeconds, 
        switch_count: switchCount,
        active_ratio: activeRatio || 0, 
        switch_rate: safeSwitchRate
      };

      try {
        console.log("📤 Sending Data to ML:", sessionDataPayload);

        const predRes = await axios.post(`${API_BASE_URL}/api/predict`, sessionDataPayload);
        
        const prediction = predRes.data.prediction;
        console.log(`🧠 Raw Output: ${prediction} (0=Distracted, 1=Focused)`);

        const confidence = Math.round(predRes.data.confidence * 100);
        const status = (prediction === 1) ? "Focused" : "Distracted";

        // ✅ THIS IS THE MISSING PART YOU NEEDED!
        // 1. Get Advice
        const adviceRes = await getAdvice(status, activeRatio, switchCount);
        const newAdvice = adviceRes || "Stay consistent!";
        setAdvice(newAdvice);

        // 2. Build the Final Result Object
        const finalResult = {
          ...sessionDataPayload,
          prediction: prediction, 
          confidence: confidence,
          status: status,
          advice: newAdvice,
          timestamp: new Date().toISOString()
        };

        // 3. Save to State (THIS makes the Result Card appear!)
        setSessionData(finalResult);

        // 4. Update Sidebar History
        setSessionHistory(prev => [finalResult, ...prev]);

      } catch (err) {
        console.error("❌ Process Failed:", err);
        setAdvice("Could not analyze session. Please check connection.");
      } finally {
        setIsProcessing(false); // Hide Loading Spinner
      }
    }
  };

  const downloadPDF = () => {
    if (!sessionData) return;
    const doc = new jsPDF();
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

  // 4. Auth Guard
 if (!user) {
  return <Auth onAuthSuccess={(userData) => setUser(userData)} />;
}

  // ... (imports remain the same)

// Inside the App component return:
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
        
        {/* 2. LEFT SIDEBAR (Fixed: Now includes Date & Advice Preview) */}
        <div className="history-list">
          <h4 style={{marginBottom: '1rem', color: '#6b7280', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px'}}>Session History</h4>
          {sessionHistory.length === 0 && <p style={{color: '#aaa', fontSize: '0.9rem'}}>No history yet.</p>}
          
          {sessionHistory.map((item, index) => (
            <div key={index} className={`history-card ${item.status?.toLowerCase()}`}>
              <div className="card-header">
                <div style={{display:'flex', alignItems:'center'}}>
                  <span className="status-dot"></span>
                  <span className="card-status">{item.status || "Completed"}</span>
                </div>
                <span className="card-score">{Math.round(item.active_ratio * 100)}%</span>
              </div>
              <div className="card-meta">
                {new Date(item.timestamp).toLocaleDateString('en-US', { 
                  weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                })}
              </div>
              {item.advice && (
                <p className="card-advice-preview">
                  {item.advice.replace(/\*\*/g, '').substring(0, 60)}...
                </p>
              )}
            </div>
          ))}
        </div>

        {/* 3. MAIN CENTER AREA */}
        <main className="main-center">
          
          {/* CONTENT AREA (Scrollable) */}
          <div className="content-scroll-area">
            
            {/* STATE 1: PROCESSING (Loading Spinner) */}
            {isProcessing && (
              <div className="processing-state">
                <div className="spinner"></div>
                <h3>Analyzing Neural Flow...</h3>
                <p>Consulting AI Model & Generating Advice</p>
              </div>
            )}

            {/* STATE 2: SHOW RESULT */}
            {!isProcessing && sessionData && (
              <div className="result-wrapper">
                <SessionResult sessionData={sessionData} />
                <button onClick={downloadPDF} className="download-btn" style={{marginTop: '20px'}}>
                  Download PDF Report
                </button>
              </div>
            )}

            {/* STATE 3: ACTIVE TIMER */}
            {!isProcessing && !sessionData && startTime && (
               <div className="timer-display">
                  <div className="timer-circle">
                    <h1>{new Date(Date.now() - startTime).toISOString().substr(11, 8)}</h1>
                    <p>Focus Session Active</p>
                    <div className="pulse-ring"></div>
                  </div>
               </div>
            )}

            {/* STATE 4: START SCREEN (Charts) */}
            {!isProcessing && !sessionData && !startTime && (
               <div className="welcome-screen">
                 <div className="chart-wrapper">
                   <FocusChart history={sessionHistory} />
                 </div>
               </div>
            )}
          </div>

          {/* 4. BOTTOM CONTROLS (RESTORED!) */}
          <div className="bottom-input-area">
            <div className="controls-card">
              
              {/* SCENARIO A: Session Not Started (Show START) */}
              {!startTime && !isProcessing && (
                <button 
                  className="ctrl-btn start-btn" 
                  onClick={() => {
                    setSessionData(null); // Clear previous result
                    handleEvent("START");
                  }}
                >
                  {sessionData ? "Start New Session" : "Start Focus Session"}
                </button>
              )}

              {/* SCENARIO B: Session Running (Show SWITCH / STOP) */}
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

              {/* SCENARIO C: Processing (Disable Buttons) */}
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










