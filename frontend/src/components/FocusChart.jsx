
import { Line } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend, 
  Filler
} from 'chart.js';

// Register the necessary Chart.js modules
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend,Filler);

const FocusChart = ({ history }) => {
  const data = {
    labels: history.map(h => h.timestamp.split(',')[1] || "Session"), // Show time
    datasets: [{
      label: 'Focus Score %',
      data: history.map(h => Math.round(h.active_ratio * 100)),
      borderColor: '#60a5fa', // Your Neon Blue variable
      backgroundColor: 'rgba(96, 165, 250, 0.2)',
      tension: 0.4,
      fill: true,
      pointRadius: 4,
      pointBackgroundColor: '#4ade80' // Neon Green points
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { display: false },
      tooltip: { backgroundColor: '#1e293b', titleColor: '#60a5fa' }
    },
    scales: {
      y: { 
        min: 0, 
        max: 100, 
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: 'rgba(255,255,255,0.5)' }
      },
      x: { 
        grid: { display: false },
        ticks: { color: 'rgba(255,255,255,0.5)' }
      }
    }
  };

  return (
    <div style={{ height: '200px', marginTop: '20px' }}>
      <Line data={data} options={options} />
    </div>
  );
};

export default FocusChart;