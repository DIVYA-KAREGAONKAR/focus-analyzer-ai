import axios from "axios";

const api = axios.create({
  // Point to the specific project URL
  baseURL: "https://focus-analyzer-ai-3.onrender.com", 
  // DO NOT use /api/ in baseURL if your full path is just /api/predict
  // or ensure your endpoints start with /api/...
  
  withCredentials: true, 
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
  // AI models need a longer timeout (60 seconds)
  timeout: 60000 
});

// Interceptor to handle the 503 and CORS/Network errors gracefully
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 503) {
      console.error("Server is waking up (503). Please wait...");
      alert("The AI server is starting up. This can take 40-60 seconds on Render Free Tier. Please try again in a moment.");
    }
    if (error.code === 'ERR_NETWORK') {
      console.error("Network Error - Possible CORS issue or Server Down");
    }
    return Promise.reject(error);
  }
);

export default api;