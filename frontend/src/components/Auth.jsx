import React, { useState } from 'react';
import axios from 'axios';

const Auth = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });

  // 1. Define the style here to prevent syntax errors in the HTML
  const linkStyle = {
    color: '#4f46e5', // The Blue Color
    cursor: 'pointer',
    marginTop: '20px',
    textAlign: 'center',
    fontWeight: '600'
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Choose the endpoint based on the current state
    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
    // Ensure this matches your backend URL exactly
    const BACKEND_URL = "https://focus-analyzer-ai-4.onrender.com"; 

    try {
      const res = await axios.post(`${BACKEND_URL}${endpoint}`, formData);
      
      console.log("Backend Response:", res.data);

      if (res.data && res.data.user) {
        localStorage.setItem("focusUser", JSON.stringify(res.data.user));
        
        if (res.data.token) {
          localStorage.setItem("token", res.data.token);
        }
        
        onAuthSuccess(res.data.user); 
      } else {
        alert("Success, but no user data received.");
      }
    } catch (err) {
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

        {/* ✅ CLEANER CODE: Uses the variable 'linkStyle' we made above */}
        <p 
          className="auth-toggle" 
          onClick={() => setIsLogin(!isLogin)} 
          style={linkStyle}
        >
          {isLogin ? "New here? Create account" : "Already have an account? Sign In"}
        </p>
      </div>
    </div>
  );
};

export default Auth;