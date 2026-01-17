import "../styles/Controls.css";

function Controls({ onEvent }) {
  return (
    <div className="controls-card">
      <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Session Controls</h3>
      <p style={{ color: 'var(--text-light)', marginBottom: '1.5rem' }}>
        Track your current flow state in real-time.
      </p>

      <div className="btn-group">
        <button className="ctrl-btn start" onClick={() => onEvent("START")}>Start</button>
        <button className="ctrl-btn switch" onClick={() => onEvent("SWITCH")}>Switch</button>
        <button className="ctrl-btn stop" onClick={() => onEvent("STOP")}>Stop</button>
      </div>
    </div>
  );
}

export default Controls;
