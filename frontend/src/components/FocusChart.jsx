// src/components/FocusChart.jsx
import { Line } from 'react-chartjs-2';
import { 
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler 
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const FocusChart = ({ history }) => {
  // Format labels to show readable time
  const labels = history.map(h => 
    new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );

  const data = {
    labels: labels,
    datasets: [{
      label: 'Focus Intensity',
      data: history.map(h => Math.round(h.active_ratio * 100)),
      borderColor: '#3b82f6',
      backgroundColor: (context) => {
        const ctx = context.chart.ctx;
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)');
        return gradient;
      },
      tension: 0.4,
      fill: true,
      pointRadius: 6,
      pointBackgroundColor: '#ffffff',
      pointBorderColor: '#3b82f6',
      pointBorderWidth: 2,
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false, // Critical: Allows chart to fill the container height
    layout: {
      padding: {
        bottom: 30, // Reserve space for time labels
        left: 10,
        right: 10,
        top: 10
      }
    },
    animation: {
      duration: 1000,
    },
    plugins: { 
      legend: { display: false },
      tooltip: { 
        backgroundColor: '#1f1f1f',
        padding: 12,
        displayColors: false,
        callbacks: {
          label: (context) => `Intensity: ${context.parsed.y}%`
        }
      }
    },
    scales: {
      y: { 
        min: 0, 
        max: 100,
        grid: { color: '#f0f0f0', borderDash: [5, 5] },
        ticks: { color: '#9ca3af', font: { size: 11 }, padding: 10 }
      },
      x: { 
        grid: { display: false },
        ticks: { 
          color: '#6b7280', 
          font: { size: 11, weight: '600' },
          maxRotation: 0,
          autoSkip: true,
          padding: 10
        }
      }
    }
  };

  return (
    // CRITICAL FIX: This wrapper ensures the canvas knows how big to be
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      <div style={{ marginBottom: '10px', fontSize: '0.9rem', color: '#6b7280', fontWeight: '600' }}>
        Focus Timeline (Today)
      </div>
      
      {/* The container for the Line chart must fill the remaining space */}
      <div style={{ height: 'calc(100% - 30px)', width: '100%' }}>
        <Line data={data} options={options} />
      </div>
    </div>
  );
};

export default FocusChart;