import { useState, useEffect } from "react";
import axios from "axios";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Controls from "./components/Controls";
import SessionResult from "./components/SessionResult";
import FocusChart from "./components/FocusChart"; // Import the component

// Inside your App function's return statement:
<aside className="glass-container">
  <h2 style={{ color: 'var(--neon-blue)', marginBottom: '20px' }}>Action Center</h2>
  <Controls onEvent={handleEvent} />
  
  <div className="history-section">
    <h3 style={{ marginTop: '40px', fontSize: '0.9rem', opacity: 0.6 }}>
      ANALYTICS TREND
    </h3>
    
    {/* PASS HISTORY TO THE CHART HERE */}
    {history.length > 0 ? (
      <FocusChart history={history} />
    ) : (
      <p style={{ fontSize: '0.8rem', opacity: 0.5 }}>Start sessions to see trends</p>
    )}

    <h3 style={{ marginTop: '30px', fontSize: '0.9rem', opacity: 0.6 }}>
      RECENT SESSIONS
    </h3>
    {/* ... your history list mapping ... */}
  </div>
</aside>













function App() {
  const [startTime, setStartTime] = useState(null);
  const [switchCount, setSwitchCount] = useState(0);
  const [activeTime, setActiveTime] = useState(0);
  const [sessionData, setSessionData] = useState(null);
  const [history, setHistory] = useState([]);

  // Load history from localStorage on startup
  useEffect(() => {
    const savedHistory = JSON.parse(localStorage.getItem("focusHistory") || "[]");
    setHistory(savedHistory);
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

  const downloadPDF = () => {
  const doc = new jsPDF();
  const reportDate = new Date().toLocaleString();
  const focusScore = Math.round(sessionData.active_ratio * 100);

  // 1. Header
  doc.setFontSize(22);
  doc.setTextColor(96, 165, 250); // Neon Blue
  doc.text("Focus Analyzer Pro: Performance Report", 10, 20);
  
  // 2. Metadata
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(`Date: ${reportDate}`, 10, 30);
  doc.text(`User: Divya Karegaonkar`, 10, 37);

  // 3. Score Section
  doc.setDrawColor(96, 165, 250);
  doc.rect(10, 45, 190, 25);
  doc.setFontSize(16);
  doc.text(`Overall Focus Score: ${focusScore}%`, 15, 60);

  // 4. Session Details
  doc.setFontSize(12);
  doc.text("Metrics Summary:", 10, 85);
  doc.text(`- Session Duration: ${sessionData.duration.toFixed(2)} mins`, 15, 95);
  doc.text(`- App Switches: ${sessionData.switch_count}`, 15, 105);
  
  // 5. AI Advice
  doc.setFont("helvetica", "italic");
  doc.text("AI Behavioral Coaching:", 10, 120);
  doc.setFontSize(10);
  const splitAdvice = doc.splitTextToSize(advice, 180);
  doc.text(splitAdvice, 10, 130);

  doc.save(`FocusReport_${Date.now()}.pdf`);
};

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
        timestamp: new Date().toLocaleString()
      };

      setSessionData(data);
      
      // Update History
      const updatedHistory = [data, ...history].slice(0, 10);
      setHistory(updatedHistory);
      localStorage.setItem("focusHistory", JSON.stringify(updatedHistory));
      
      setStartTime(null);
    }
  };

  return (
    <div className="dashboard-grid">
      {/* Sidebar: Controls and History */}
      <aside className="glass-container">
        <h2 style={{ color: 'var(--neon-blue)', marginBottom: '20px' }}>Action Center</h2>
        <Controls onEvent={handleEvent} />
        
        <div className="history-section">
          <h3 style={{ marginTop: '40px', fontSize: '0.9rem', opacity: 0.6, letterSpacing: '1px' }}>
            RECENT SESSIONS
          </h3>
          <div className="history-list">
            {history.length > 0 ? (
              history.map((item, index) => (
                <div key={index} className="history-item">
                  <div style={{ color: 'var(--neon-blue)', fontWeight: 'bold' }}>
                    {Math.round(item.active_ratio * 100)}% Focus
                  </div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>{item.timestamp}</div>
                </div>
              ))
            ) : (
              <p style={{ fontSize: '0.8rem', opacity: 0.5, marginTop: '10px' }}>No history yet.</p>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content: Analysis and PDF */}
      <main className="glass-container" id="report-content">
        <header className="dashboard-header">
          <h1>Focus Analyzer Pro</h1>
          <p>Professional Cognitive Performance Tracking</p>
        </header>
        
        {sessionData ? (
          <>
            <SessionResult sessionData={sessionData} />
            <button 
              className="ctrl-btn switch" 
              style={{ marginTop: '30px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
              onClick={downloadPDF}
            >
              <span>📥</span> Download PDF Report
            </button>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '100px 0', opacity: 0.3 }}>
             <div style={{ fontSize: '3rem' }}>⏳</div>
             <p>Start a session to generate a report</p>
          </div>
        )}npm install chart.js react-chartjs-2
      </main>
    </div>
  );
}

export default App;