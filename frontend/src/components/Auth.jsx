import React, { useState } from 'react';
// src/components/Auth.jsx
import axios from 'axios';

const Auth = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // src/components/Auth.jsx
// src/components/Auth.jsx
const handleSubmit = async (e) => {
  e.preventDefault();
  
  // Choose the endpoint based on the current state
  const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
  const BACKEND_URL = "https://focus-analyzer-ai-4.onrender.com";

  try {
    const res = await axios.post(`${BACKEND_URL}${endpoint}`, formData);
    
    console.log("Backend Response:", res.data);

    // Both Login and Register now return a 'user' object in your server.js
    if (res.data && res.data.user) {
      localStorage.setItem("focusUser", JSON.stringify(res.data.user));
      
      // Only login usually returns a token, but it's safe to check
      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
      }
      
      // This triggers the redirect to the dashboard in App.js
      onAuthSuccess(res.data.user); 
    } else {
      alert("Success, but no user data received. Check backend console.");
    }
  } catch (err) {
    // If the email exists, the backend will send a 400 error with a message
    alert(err.response?.data?.message || "Authentication failed");
  }
};
  
   return (
    <div className="auth-screen">
      <div className="glass-container auth-card">
        <h2 style={{ textAlign: 'center', color: 'var(--neon-blue)', marginBottom: '30px' }}>
          {isLogin ? "Welcome Back" : "Create Account"}
        </h2>
        
        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <input 
              name="name"
              className="auth-input"
              type="text"
              placeholder="Full Name" 
              value={formData.name}
              onChange={handleChange}
              required
            />
          )}
          
          <input 
            name="email"
            className="auth-input"
            type="email" 
            placeholder="Email Address" 
            value={formData.email}
            onChange={handleChange}
            required
            autoComplete="email"
          />
          
          <input 
            name="password"
            className="auth-input"
            type="password" 
            placeholder="Password" 
            value={formData.password}
            onChange={handleChange}
            required
            autoComplete="current-password"
          />
          
          <button className="ctrl-btn start" type="submit" style={{ marginTop: '10px', width: '100%' }}>
            {isLogin ? "Sign In" : "Register"}
          </button>
        </form>

        <p className="auth-toggle" onClick={() => setIsLogin(!isLogin)} style={{ 
            color: '#4f46e5', // ✅ FIX: Make it visible (Blue)
            cursor: 'pointer', 
            marginTop: '20px', 
            textAlign: 'center',
            fontWeight: '600'
          }}>
          {isLogin ? "New here? Create account" : "Already have an account? Sign In"}
        </p>
      </div>
    </div>
  );
};

export default Auth;

