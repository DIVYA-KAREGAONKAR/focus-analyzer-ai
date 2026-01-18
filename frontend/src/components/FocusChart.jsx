import { Line } from 'react-chartjs-2';
import { 
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler 
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const FocusChart = ({ history }) => {
  // Format labels to show readable time (e.g., "2:30 PM")
  const labels = history.map(h => 
    new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );

  const data = {
    labels: labels,
    datasets: [{
      label: 'Focus Intensity',
      data: history.map(h => Math.round(h.active_ratio * 100)),
      borderColor: '#3b82f6', // Bright Blue
      backgroundColor: (context) => {
        const ctx = context.chart.ctx;
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)');
        return gradient;
      },
      tension: 0.4, // Smooth curves
      fill: true,
      pointRadius: 6,
      pointBackgroundColor: '#ffffff',
      pointBorderColor: '#3b82f6',
      pointBorderWidth: 2,
      pointHoverRadius: 8,
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    
    // --- FIX: Force extra space at the bottom for labels ---
    layout: {
      padding: {
        bottom: 40,  // Increased from 30 to 40
        left: 20,    // Added side padding so first/last points don't get cut
        right: 20,
        top: 10
      }
    },
    // ------------------------------------------------------
    
    animation: {
      duration: 2000,
      easing: 'easeOutQuart'
    },
    plugins: { 
      legend: { display: false },
      tooltip: { 
        backgroundColor: '#1f1f1f', 
        padding: 12,
        titleFont: { size: 13 },
        bodyFont: { size: 13 },
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
        ticks: { 
          color: '#9ca3af', 
          font: { size: 11 }, 
          padding: 10 
        }
      },
      x: { 
        grid: { display: false },
        ticks: { 
          color: '#6b7280', 
          font: { size: 11, weight: '600' },
          maxRotation: 0, 
          autoSkip: true, 
          padding: 15     // Pushes text down slightly from the x-axis line
        }
      }
    }
  };
};

export default FocusChart;