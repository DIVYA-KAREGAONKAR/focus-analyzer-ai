import React, { useState } from 'react';

const Auth = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real app, call your API here. For now, we simulate success:
    console.log("Auth Data:", formData);
    onAuthSuccess(formData.email); 
  };

  return (
    <div className="glass-container" style={{ maxWidth: '400px', margin: '100px auto' }}>
      <h2 style={{ textAlign: 'center', color: 'var(--neon-blue)' }}>
        {isLogin ? "Welcome Back" : "Create Account"}
      </h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {!isLogin && (
          <input 
            className="ctrl-btn" style={{ background: 'var(--glass-bg)', color: 'white' }}
            placeholder="Name" 
            onChange={(e) => setFormData({...formData, name: e.target.value})} 
          />
        )}
        <input 
          className="ctrl-btn" style={{ background: 'var(--glass-bg)', color: 'white' }}
          type="email" placeholder="Email" required
          onChange={(e) => setFormData({...formData, email: e.target.value})} 
        />
        <input 
          className="ctrl-btn" style={{ background: 'var(--glass-bg)', color: 'white' }}
          type="password" placeholder="Password" required
          onChange={(e) => setFormData({...formData, password: e.target.value})} 
        />
        <button className="ctrl-btn start" type="submit">
          {isLogin ? "Sign In" : "Register"}
        </button>
      </form>
      <p style={{ textAlign: 'center', marginTop: '15px', cursor: 'pointer', fontSize: '0.8rem' }} 
         onClick={() => setIsLogin(!isLogin)}>
        {isLogin ? "New here? Create account" : "Already have an account? Sign In"}
      </p>
    </div>
  );
};

export default Auth;