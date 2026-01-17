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
const handleSubmit = async (e) => {
  e.preventDefault();
  const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
  
  try {
    const res = await axios.post(`https://focus-analyzer-ai-6.onrender.com${endpoint}`, formData);
    
    // SUCCESS: If the backend sends 'user', log them in
    if (res.data.user) {
      onAuthSuccess(res.data.user); 
    } else if (!isLogin) {
      // If just registered and no user object returned, flip to login
      setIsLogin(true);
      alert("Registration successful! Please log in.");
    }
  } catch (err) {
    // This is where your "Email exists" alert is coming from
    alert(err.response?.data?.message || "An error occurred");
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

