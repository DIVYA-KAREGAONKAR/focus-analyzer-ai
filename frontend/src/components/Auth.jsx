import React, { useState } from 'react';

const Auth = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate auth success for the dashboard
    onAuthSuccess(formData.email); 
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
              className="auth-input"
              type="text"
              placeholder="Full Name" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          )}
          
          <input 
            className="auth-input"
            type="email" 
            placeholder="Email Address" 
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />
          
          <input 
            className="auth-input"
            type="password" 
            placeholder="Password" 
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
          />
          
          <button className="ctrl-btn start" type="submit" style={{ marginTop: '10px' }}>
            {isLogin ? "Sign In" : "Register"}
          </button>
        </form>

        <p className="auth-toggle" onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? "New here? Create account" : "Already have an account? Sign In"}
        </p>
      </div>
    </div>
  );
};

export default Auth;