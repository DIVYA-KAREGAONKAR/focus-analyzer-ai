import { useState, useEffect } from "react";
import axios from "axios";
import jsPDF from 'jspdf';
import Controls from "./components/Controls";
import SessionResult from "./components/SessionResult";
import FocusChart from "./components/FocusChart";
import Auth from "./components/Auth";

// Replace with your actual backend URL (e.g., your Render.com URL)
const API_BASE_URL = "http://localhost:5000/api"; 

function App() {
  const [user, setUser] = useState(null); // Stores { id, name, email }
  const [startTime, setStartTime] = useState(null);
  const [switchCount, setSwitchCount] = useState(0);
  const [activeTime, setActiveTime] = useState(0);
  const [sessionData, setSessionData] = useState(null);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [advice, setAdvice] = useState("");

  // 1. Fetch History from Backend on Login
  useEffect(() => {
    if (user) {
      const fetchUserHistory = async () => {
        try {
          const res = await axios.get(`${API_BASE_URL}/history/${user.id}`);
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

    if (type === "STOP") {
      const end = Date.now();
      const durationMin = (end - startTime) / 60000;

      const payload = {
        userId: user.id, // Important: Link session to the user
        duration: durationMin,
        switch_count: switchCount,
        active_ratio: activeTime / ((end - startTime) / 1000),
        timestamp: new Date().toISOString()
      };

      // 2. Save Session to Database
      try {
        const res = await axios.post(`${API_BASE_URL}/history`, payload);
        setSessionData(res.data);
        setSessionHistory([res.data, ...sessionHistory].slice(0, 15));
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
    doc.text(`User: ${user.name}`, 10, 37); // Personalized via backend data
    doc.text(`Overall Focus Score: ${focusScore}%`, 15, 60);

    const splitAdvice = doc.splitTextToSize(advice || "Analyzing flow...", 180);
    doc.text(splitAdvice, 10, 130);
    doc.save(`FocusReport_${Date.now()}.pdf`);
  };

  // 3. Auth Guard
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
      <aside className="sidebar-left">
        <h3>Recent Sessions</h3>
        <div className="history-list">
          {sessionHistory.map((item, index) => (
            <div key={index} className="history-item">
              <span className="focus-percent">{Math.round(item.active_ratio * 100)}%</span>
              <span className="history-date">{new Date(item.timestamp).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      </aside>

      {/* 3. CENTER COLUMN: CONTROLS & CHART */}
      <main className="main-center">
        <div className="controls-wrapper">
          <Controls onEvent={handleEvent} />
        </div>
        <div className="chart-wrapper">
          <FocusChart history={sessionHistory} />
        </div>
      </main>

      {/* 4. RIGHT SIDEBAR: ADVICE & RESULTS */}
      <aside className="sidebar-right">
        <h3>AI Insights</h3>
        {sessionData ? (
          <SessionResult key={sessionData.timestamp} sessionData={sessionData} setAdvice={setAdvice} />
        ) : (
          <p className="empty-state">Start a session to receive AI coaching.</p>
        )}
      </aside>
    </div>
  </div>
);
}

export default App;














