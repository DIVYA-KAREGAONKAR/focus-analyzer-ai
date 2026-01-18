import { useState, useEffect } from "react";
import axios from "axios";
import jsPDF from 'jspdf';
import Controls from "./components/Controls";
import SessionResult from "./components/SessionResult";
import FocusChart from "./components/FocusChart";
import Auth from "./components/Auth";

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
  const durationMin = (end - startTime) / 60000;
  const activeRatio = activeTime / ((end - startTime) / 1000);

  // 1. First, get the AI Prediction and Advice
  // Note: You may need to lift the prediction logic from SessionResult to here 
  // to ensure advice is ready before the POST request.
  
  const payload = {
    userId: user.id, 
    duration: durationMin,
    switch_count: switchCount,
    active_ratio: activeRatio,
    status: activeRatio > 0.7 ? "Focused" : "Distracted", // Temporary logic
    advice: advice, // Use the advice state
    timestamp: new Date().toISOString()
  };

  try {
    const res = await axios.post(`${API_BASE_URL}/api/history`, payload);
    setSessionData(res.data);
    setSessionHistory([res.data, ...sessionHistory]);
  } catch (err) {
    console.error("Failed to save session:", err);
  }
  setStartTime(null);
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

  return (
    <div className="chat-layout">
      {/* 1. TOP NAVBAR */}
      <nav className="navbar">
        <div className="nav-logo">Focus Analyzer AI</div>
        <div className="nav-user">
          <span>{user.name}</span>
          <button onClick={handleLogout} className="logout-link">Sign Out</button>
        </div>
      </nav>

      <div className="layout-body">
        {/* 2. LEFT SIDEBAR: HISTORY */}
        // Inside App.js Sidebar-left
<div className="history-list">
  {sessionHistory.map((item, index) => (
    <div key={index} className={`history-card ${item.status?.toLowerCase()}`}>
      <div className="card-header">
        <span className="status-dot"></span>
        <span className="card-status">{item.status || "Completed"}</span>
        <span className="card-score">{Math.round(item.active_ratio * 100)}%</span>
      </div>
      <p className="card-advice-preview">{item.advice?.substring(0, 45)}...</p>
      <span className="card-date">{new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
    </div>
  ))}
</div>

        {/* 3. CENTER COLUMN: CONTROLS & CHART */}
        <main className="main-center">
          <div className="controls-wrapper">
            <Controls onEvent={handleEvent} />
          </div>
          <div className="chart-wrapper" >
            <FocusChart history={sessionHistory} />
          </div>
        </main>

        {/* 4. RIGHT SIDEBAR: ADVICE & RESULTS */}
        <aside className="sidebar-right">
          <h3>AI Insights</h3>
          {sessionData ? (
            <div id="report-content">
              <SessionResult key={sessionData.timestamp} sessionData={sessionData} setAdvice={setAdvice} />
              <button className="ctrl-btn switch" style={{ marginTop: '30px', width: '100%' }} onClick={downloadPDF}>
                Download PDF
              </button>
            </div>
          ) : (
            <p className="empty-state">Start a session to receive AI coaching.</p>
          )}
        </aside>
      </div>
    </div>
  );
}

export default App;










