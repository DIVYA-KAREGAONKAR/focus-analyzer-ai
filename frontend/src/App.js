import { useState, useEffect } from "react";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Controls from "./components/Controls";
import SessionResult from "./components/SessionResult";
import FocusChart from "./components/FocusChart";

function App() {
  const [startTime, setStartTime] = useState(null);
  const [switchCount, setSwitchCount] = useState(0);
  const [activeTime, setActiveTime] = useState(0);
  const [sessionData, setSessionData] = useState(null);
  const [sessionHistory, setSessionHistory] = useState([]); // Renamed from 'history' to avoid 'no-restricted-globals'
  const [advice, setAdvice] = useState(""); 

  // Load history on startup
  useEffect(() => {
    const savedHistory = JSON.parse(localStorage.getItem("focusHistory") || "[]");
    setSessionHistory(savedHistory);
  }, []);

  // Timer logic
  useEffect(() => {
    let interval;
    if (startTime) {
      interval = setInterval(() => {
        setActiveTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [startTime]);

  // Define handleEvent BEFORE it is used in the return/JSX
  const handleEvent = (type) => {
    if (type === "START") {
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
      
      const updatedHistory = [data, ...sessionHistory].slice(0, 10);
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
    doc.text(`Date: ${reportDate}`, 10, 30);
    doc.text(`User: Divya Karegaonkar`, 10, 37);

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

  return (
    <div className="dashboard-grid">
      <aside className="glass-container">
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
          <div className="history-list">
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
      </aside>

      <main className="glass-container">
        <header className="dashboard-header">
          <h1>Focus Analyzer Pro</h1>
          <p>Professional Cognitive Performance Tracking</p>
        </header>
        
        {sessionData ? (
          <>
            <SessionResult sessionData={sessionData} setAdvice={setAdvice} />
            <button className="ctrl-btn switch" style={{ marginTop: '30px', width: '100%' }} onClick={downloadPDF}>
              Download PDF Report
            </button>
          </>
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