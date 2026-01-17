import { useState, useEffect } from "react";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Controls from "./components/Controls";
import SessionResult from "./components/SessionResult";
import FocusChart from "./components/FocusChart";
import Auth from "./components/Auth"; // Ensure this component is created

function App() {
  const [startTime, setStartTime] = useState(null);
  const [switchCount, setSwitchCount] = useState(0);
  const [activeTime, setActiveTime] = useState(0);
  const [sessionData, setSessionData] = useState(null);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [advice, setAdvice] = useState(""); 
  const [user, setUser] = useState(null); // Track personalized user session

  useEffect(() => {
    const savedHistory = JSON.parse(localStorage.getItem("focusHistory") || "[]");
    setSessionHistory(savedHistory);
  }, []);

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
      if ("Notification" in window && Notification.permission !== "granted") {
        Notification.requestPermission();
      }
      setStartTime(Date.now());
      setSwitchCount(0);
      setActiveTime(0);
      setSessionData(null); 
      setAdvice("");
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
        timestamp: new Date().toLocaleString()
      };

      setSessionData(data);
      const updatedHistory = [data, ...sessionHistory].slice(0, 15); // Increased slice for scrollable view
      setSessionHistory(updatedHistory);
      localStorage.setItem("focusHistory", JSON.stringify(updatedHistory));
      setStartTime(null);
    }
  };

  const downloadPDF = () => {
    if (!sessionData) return;
    const doc = new jsPDF();
    const reportDate = new Date().toLocaleString();
    const focusScore = Math.round(sessionData.active_ratio * 100);

    doc.setFontSize(22);
    doc.setTextColor(96, 165, 250); 
    doc.text("Focus Analyzer Pro: Performance Report", 10, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Date: ${reportDate}`, 10, 30);
    doc.text(`User: ${user || "Divya Karegaonkar"}`, 10, 37); // Personalized PDF

    doc.setDrawColor(96, 165, 250);
    doc.rect(10, 45, 190, 25);
    doc.text(`Overall Focus Score: ${focusScore}%`, 15, 60);

    doc.text("Metrics Summary:", 10, 85);
    doc.text(`- Session Duration: ${sessionData.duration.toFixed(2)} mins`, 15, 95);
    doc.text(`- App Switches: ${sessionData.switch_count}`, 15, 105);
    
    doc.text("AI Behavioral Coaching:", 10, 120);
    const splitAdvice = doc.splitTextToSize(advice || "Analyzing flow...", 180);
    doc.text(splitAdvice, 10, 130);

    doc.save(`FocusReport_${Date.now()}.pdf`);
  };

  // Auth Guard: Show Sign In/Up first
  if (!user) {
    return <Auth onAuthSuccess={(email) => setUser(email)} />;
  }

  return (
    <div className="dashboard-grid">
      <aside className="glass-container">
        {/* User Profile Header */}
        <div style={{ marginBottom: '20px', paddingBottom: '10px', borderBottom: '1px solid var(--glass-border)' }}>
           <p style={{ fontSize: '0.7rem', opacity: 0.5, letterSpacing: '1px' }}>LOGGED IN AS</p>
           <strong style={{ color: 'var(--neon-blue)' }}>{user}</strong>
        </div>

        <h2 style={{ color: 'var(--neon-blue)', marginBottom: '20px' }}>Action Center</h2>
        <Controls onEvent={handleEvent} />
        
        <div className="history-section">
          <h3 style={{ marginTop: '40px', fontSize: '0.9rem', opacity: 0.6 }}>ANALYTICS TREND</h3>
          {sessionHistory.length > 0 ? (
            <FocusChart history={sessionHistory} />
          ) : (
            <p style={{ fontSize: '0.8rem', opacity: 0.5 }}>Start sessions to see trends</p>
          )}

          <h3 style={{ marginTop: '40px', fontSize: '0.9rem', opacity: 0.6 }}>RECENT SESSIONS</h3>
          {/* SCROLLABLE HISTORY LIST: Prevents page height issues */}
          <div className="history-list" style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '5px' }}>
            {sessionHistory.map((item, index) => (
              <div key={index} className="history-item">
                <div style={{ color: 'var(--neon-blue)', fontWeight: 'bold' }}>
                  {Math.round(item.active_ratio * 100)}% Focus
                </div>
                <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>{item.timestamp}</div>
              </div>
            ))}
          </div>
        </div>

        <button 
          onClick={() => setUser(null)} 
          className="ctrl-btn stop" 
          style={{ marginTop: '20px', width: '100%', fontSize: '0.8rem' }}
        >
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
            <SessionResult 
              key={sessionData.timestamp} 
              sessionData={sessionData} 
              setAdvice={setAdvice} 
            />
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