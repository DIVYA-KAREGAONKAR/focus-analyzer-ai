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
    if (type === "START") {
      if ("Notification" in window && Notification.permission !== "granted") {
        Notification.requestPermission();
      }
      setStartTime(Date.now());
      setSwitchCount(0);
      setActiveTime(0);
      setSessionData(null);
      setAdvice("");
    }

    if (type === "SWITCH") setSwitchCount((prev) => prev + 1);

    // App.js - Updated handleEvent "STOP"
if (type === "STOP") {
      const end = Date.now();
      setStartTime(null); // Stop the timer immediately
      setIsProcessing(true); // <--- SHOW LOADING SCREEN
      
      const durationMin = (end - startTime) / 60000;
      const activeRatio = activeTime / ((end - startTime) / 1000);
      
      const sessionDataPayload = {
        duration: durationMin,
        switch_count: switchCount,
        active_ratio: activeRatio,
        switch_rate: switchCount / (durationMin || 1)
      };

      try {
        // 1. Get Prediction
        const predRes = await axios.post(`${API_BASE_URL}/api/predict`, sessionDataPayload);
        const prediction = predRes.data.prediction;
        const confidence = Math.round(predRes.data.confidence * 100);
        const status = (prediction === 1) ? "Focused" : "Distracted";

        // 2. Get Advice
        const adviceRes = await axios.post(`${API_BASE_URL}/api/advice`, {
          concPercent: confidence,
          status: status 
        });
        const finalAdvice = adviceRes.data.advice;
        setAdvice(finalAdvice);

        // 3. Save to History
        const saveRes = await axios.post(`${API_BASE_URL}/api/history`, {
           userId: user.id || user._id, // Ensure ID is sent
           duration: durationMin,
           switch_count: switchCount,
           active_ratio: activeRatio,
           status: status,
           advice: finalAdvice
        });

        // 4. UPDATE UI WITH RESULT
        setSessionData(saveRes.data);
        setSessionHistory([saveRes.data, ...sessionHistory]);

      } catch (err) {
        console.error("Process Failed:", err);
        setAdvice("Could not analyze session. Please check connection.");
      } finally {
        setIsProcessing(false); // <--- HIDE LOADING SCREEN (Reveal Result)
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
    {/* 1. TOP NAVBAR - With Styled User Pill */}
    <nav className="navbar">
      <div className="nav-logo">Focus Analyzer AI</div>
      
      {/* Styled User Area */}
      <div className="nav-user">
        <span>{user.name}</span>
        <button onClick={handleLogout} className="logout-link">Sign Out</button>
      </div>
    </nav>

    <div className="layout-body">
      {/* 2. LEFT SIDEBAR: Full Height & Wider */}
      <div className="history-list">
        <h4 style={{marginBottom: '1rem', color: '#6b7280', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px'}}>Session History</h4>
        {sessionHistory.length === 0 && <p style={{color: '#aaa', fontSize: '0.9rem'}}>No history yet.</p>}
        
        {sessionHistory.map((item, index) => (
          <div key={index} className={`history-card ${item.status?.toLowerCase()}`}>
            <div style={{display:'flex', alignItems:'center'}}>
              <span className="status-dot"></span>
              <span className="card-status">{item.status || "Completed"}</span>
            </div>
            <span className="card-score">{Math.round(item.active_ratio * 100)}%</span>
          </div>
        ))}
      </div>

      {/* 3. CENTER COLUMN: MAIN CONTENT */}
     <main className="main-center">
        {/* CASE 1: LOADING */}
        {isProcessing && (
          <div className="processing-state">
            <div className="spinner"></div>
            <h3>Analyzing Neural Flow...</h3>
            <p>Consulting AI Model & Generating Advice</p>
          </div>
        )}

        {/* CASE 2: SHOW RESULT (Only if not processing AND data exists) */}
        {!isProcessing && sessionData && (
          <SessionResult sessionData={sessionData} />
        )}

        {/* CASE 3: ACTIVE TIMER */}
        {!isProcessing && !sessionData && startTime && (
           /* ... Your existing Timer Component ... */
           <div className="timer-display">
              {/* (Keep your existing timer code here) */}
              <h1>{new Date(Date.now() - startTime).toISOString().substr(11, 8)}</h1>
              {/* ... */}
           </div>
        )}

        {/* CASE 4: START SCREEN (Default) */}
        {!isProcessing && !sessionData && !startTime && (
           /* ... Your existing FocusChart or Welcome Message ... */
           <div className="welcome-screen">
             <FocusChart history={sessionHistory} />
             {/* ... */}
           </div>
        )}
      </main>
    </div>
  </div>
);
}

export default App;










