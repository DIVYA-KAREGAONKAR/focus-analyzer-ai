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

// ✅ HistoryCard: FINAL FIX for "0%" Display
const HistoryCard = ({ item }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Helper logic to calculate score
  const getScore = (ratio) => {
    let val = ratio || 0;
    
    // 1. Math: Convert decimal (0.003) to percentage (0)
    let score = val <= 1 ? Math.round(val * 100) : Math.round(val);

    // 2. SAFETY OVERRIDE: Access 'item.status' directly from props
    // If the math says 0% but the status is "Focused", force it to 1%
    if (score === 0 && item.status === 'Focused') {
        return 1; 
    }

    return score;
  };

  return (
    <div 
      className={`history-card ${item.status?.toLowerCase()}`} 
      onClick={() => setIsOpen(!isOpen)}
      style={{ cursor: 'pointer' }}
    >
      <div className="card-header">
        <div style={{display:'flex', alignItems:'center', gap: '6px'}}>
          <span className="status-dot"></span>
          <span style={{fontWeight: '600', fontSize: '0.9rem'}}>
            {item.status || "Completed"}
          </span>
        </div>
        <span style={{fontWeight: 'bold', fontSize: '0.9rem', color: '#374151'}}>
          {/* You don't need to change arguments here anymore */}
          {getScore(item.active_ratio)}%
        </span>
      </div>

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

  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const savedUser = localStorage.getItem("focusUser");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

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

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("focusUser");
  };

 const handleEvent = async (type) => {
    if (type === "START") {
      setStartTime(Date.now());
      setSwitchCount(0);
      setActiveTime(0);
      setSessionData(null);
      setAdvice("");
      setIsProcessing(false);
    }

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

      // 1. Keep Payload for AI as DECIMAL (0.98) - AI likes decimals
      const payloadForAI = {
        duration: durationSeconds,
        switch_count: switchCount,
        active_ratio: activeRatio, 
        switch_rate: safeSwitchRate
      };

      try {
        console.log("📤 Sending Data to ML:", payloadForAI);

        const predRes = await axios.post(`${API_BASE_URL}/api/predict`, payloadForAI);
        const prediction = predRes.data.prediction;
        const confidence = Math.round(predRes.data.confidence * 100);
        const status = (prediction === 1) ? "Distracted" : "Focused";

        // Get Advice
        // FIX: Send Integer (95) so the AI understands it's a high score
const adviceRes = await getAdvice(status, Math.round(payloadForAI.active_ratio * 100), switchCount);
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

        // ✅ THE FIX: Create a separate object for the Database
        // We convert active_ratio to an INTEGER (e.g., 98) so the DB doesn't round it to 0.
        const finalResultForDB = {
          ...payloadForAI,
          active_ratio: Math.round(activeRatio * 100), // <--- SAVES 98 INSTEAD OF 0.98
          prediction: prediction,
          confidence: confidence,
          status: status,
          advice: newAdvice,
          timestamp: new Date().toISOString()
        };

        // ✅ Save the INTEGER version to Database
        try {
            await axios.post(`${API_BASE_URL}/api/history`, { 
                userId: user.id, 
                session: finalResultForDB 
            });
            console.log("Saved to DB successfully");
            
            // Update local state with the same data so it matches
            setSessionHistory(prev => [finalResultForDB, ...prev]);
        } catch (dbErr) {
            console.error("Failed to save to DB:", dbErr);
        }

        setSessionData(finalResultForDB);

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
    const rawScore = sessionData.active_ratio || 0;
    const focusScore = rawScore <= 1 ? Math.round(rawScore * 100) : Math.round(rawScore);

    doc.setFontSize(22);
    doc.setTextColor(96, 165, 250);
    doc.text("Focus Analyzer Pro: Performance Report", 10, 20);
    doc.text(`User: ${user.name}`, 10, 37);
    doc.text(`Overall Focus Score: ${focusScore}%`, 15, 60);
    doc.save(`FocusReport_${Date.now()}.pdf`);
  };

  if (!user) {
    return <Auth onAuthSuccess={(userData) => setUser(userData)} />;
  }

  // ✅ CRITICAL FIX: Prepare Data specifically for the Chart
  // Your FocusChart.js multiplies by 100, so we MUST send it Decimals (0.xx).
 // ✅ CRITICAL FIX: Filter out "0%" sessions & Prepare Data
  const chartHistory = sessionHistory
    .filter(session => {
        // Only include sessions that have a real score (greater than 1%)
        // This hides the broken "0%" dots (like 8:03 and 8:20) from the graph
        const val = session.active_ratio || 0;
        const score = val <= 1 ? val * 100 : val;
        return score > 1; 
    })
    .map(session => ({
      ...session,
      // Ensure data is always Decimal (0.xx) for the Chart component
      active_ratio: session.active_ratio > 1 
        ? session.active_ratio / 100 
        : session.active_ratio
    }));

  // Reverse for Chart (Oldest -> Newest)
  const chartDataReversed = [...chartHistory].reverse();
  return (
    <div className="chat-layout">
      <nav className="navbar">
        <div className="nav-logo">Focus Analyzer AI</div>
        <div className="nav-user">
          <span>{user?.name || "User"}</span>
          <button onClick={handleLogout} className="logout-btn">Sign Out</button>
        </div>
      </nav>

      <div className="layout-body">
        {/* SIDEBAR: Uses raw sessionHistory (HistoryCard handles the math) */}
        <div className="history-list">
          <h4 style={{marginBottom: '1rem', color: '#6b7280', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px'}}>Session History</h4>
          {sessionHistory.length === 0 && <p style={{color: '#aaa', fontSize: '0.9rem'}}>No history yet.</p>}
          {sessionHistory.map((item, index) => (
             <HistoryCard key={index} item={item} />
          ))}
        </div>

        <main className="main-center">
          <div className="content-scroll-area">
            {isProcessing && (
              <div className="processing-state">
                <div className="spinner"></div>
                <h3>Analyzing Neural Flow...</h3>
              </div>
            )}

            {!isProcessing && startTime && (
               <div className="timer-display">
                  <div className="timer-circle">
                    <h1>{new Date(Date.now() - startTime).toISOString().substr(11, 8)}</h1>
                    <p>Focus Session Active</p>
                    <div className="pulse-ring"></div>
                  </div>
               </div>
            )}

            {!isProcessing && !startTime && !sessionData && (
               <div className="welcome-container">
                 {/* CHART: Uses chartDataReversed (All Decimals) */}
                 <div className="chart-wrapper" style={{ marginBottom: '30px', width: '100%' }}>
                   <FocusChart history={chartDataReversed} />
                 </div>
                 <div style={{ textAlign: 'center', zIndex: 2 }}>
                   <h1 className="welcome-title">Welcome back, {user.name?.split(" ")[0]}</h1>
                   <h2 className="welcome-subtitle">Ready to optimize your cognitive flow?</h2>
                 </div>
               </div>
            )}

            {sessionData && (
               <div className="dashboard-view">
                 {/* CHART: Uses chartDataReversed (All Decimals) */}
                 <div className="chart-wrapper">
                   <FocusChart history={chartDataReversed} />
                 </div>
                 <div className="result-wrapper" style={{ marginTop: '30px', animation: 'fadeIn 0.5s ease' }}>
                    <SessionResult sessionData={sessionData} />
                    <div style={{display: 'flex', justifyContent: 'center', marginTop: '20px'}}>
                      <button onClick={downloadPDF} className="download-btn">Download PDF Report</button>
                    </div>
                 </div>
               </div>
            )}
          </div>

          <div className="bottom-input-area">
            <div className="controls-card">
              {!startTime && !isProcessing && (
                <button className="ctrl-btn start-btn" onClick={() => { setSessionData(null); handleEvent("START"); }}>
                  {sessionData ? "Start New Session" : "Start Focus Session"}
                </button>
              )}
              {startTime && !isProcessing && (
                <div className="btn-group">
                  <button className="ctrl-btn switch-btn" onClick={() => handleEvent("SWITCH")}>
                    Switch Task ({switchCount})
                  </button>
                  <button className="ctrl-btn stop-btn" onClick={() => handleEvent("STOP")}>
                    Stop Session
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;