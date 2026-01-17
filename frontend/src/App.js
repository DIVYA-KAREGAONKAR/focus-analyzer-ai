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
    <div className="dashboard-grid">
      <aside className="glass-container">
        <div style={{ marginBottom: '20px', paddingBottom: '10px', borderBottom: '1px solid var(--glass-border)' }}>
           <p style={{ fontSize: '0.7rem', opacity: 0.5 }}>LOGGED IN AS</p>
           <strong style={{ color: 'var(--neon-blue)' }}>{user.name}</strong>
        </div>

        <h2 style={{ color: 'var(--neon-blue)', marginBottom: '20px' }}>Action Center</h2>
        <Controls onEvent={handleEvent} />
        
        <div className="history-section">
          <h3 style={{ marginTop: '30px', fontSize: '0.9rem', opacity: 0.6 }}>ANALYTICS TREND</h3>
          {sessionHistory.length > 0 && <FocusChart history={sessionHistory} />}

          <h3 style={{ marginTop: '30px', fontSize: '0.9rem', opacity: 0.6 }}>RECENT SESSIONS</h3>
          <div className="history-list">
            {sessionHistory.map((item, index) => (
              <div key={index} className="history-item">
                <div style={{ color: 'var(--neon-blue)', fontWeight: 'bold' }}>
                  {Math.round(item.active_ratio * 100)}% Focus
                </div>
                <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>
                  {new Date(item.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        <button onClick={() => setUser(null)} className="ctrl-btn stop" style={{ marginTop: '20px', width: '100%' }}>
          Sign Out
        </button>
      </aside>

      <main className="glass-container">
        <header className="dashboard-header">
          <h1>Focus Analyzer Pro</h1>
          <p>Professional Cognitive Performance Tracking</p>
        </header>
        
        {sessionData ? (
          <div id="report-content">
            <SessionResult key={sessionData.timestamp} sessionData={sessionData} setAdvice={setAdvice} />
            <button className="ctrl-btn switch" style={{ marginTop: '30px', width: '100%' }} onClick={downloadPDF}>
              Download PDF Report
            </button>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '100px 0', opacity: 0.3 }}>
             <p>Start a session to generate a report</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;














