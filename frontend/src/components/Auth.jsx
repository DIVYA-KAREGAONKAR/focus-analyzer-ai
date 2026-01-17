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
  try {
    const res = await axios.post(`https://focus-analyzer-ai-4.onrender.com/api/auth/login`, formData);
    
    // Debug: Check what actually came back in your browser console
    console.log("Backend Response:", res.data);

    if (res.data && res.data.user) {
      // 1. Save to local storage for persistence
      localStorage.setItem("focusUser", JSON.stringify(res.data.user));
      localStorage.setItem("token", res.data.token);
      
      // 2. Trigger the redirect in App.js
      onAuthSuccess(res.data.user); 
    } else {
      alert("Login successful, but no user data received from server.");
    }
  } catch (err) {
    alert(err.response?.data?.message || "Login failed");
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

        <p className="auth-toggle" onClick={() => setIsLogin(!isLogin)} style={{ color: 'white', cursor: 'pointer', marginTop: '20px', textAlign: 'center' }}>
          {isLogin ? "New here? Create account" : "Already have an account? Sign In"}
        </p>
      </div>
    </div>
  );
};

export default Auth;

