import "../styles/Controls.css";

function Controls({ onEvent }) {
  return (
    <div className="controls-card">
      <h3>Event Logger</h3>

      <div className="btn-group">
        <button className="ctrl-btn start" onClick={() => onEvent("START")}>
          Start
        </button>
        <button className="ctrl-btn switch" onClick={() => onEvent("SWITCH")}>
          Switch
        </button>
        <button className="ctrl-btn stop" onClick={() => onEvent("STOP")}>
          Stop
        </button>
      </div>
    </div>
  );
}

export default Controls;
