import React, { useState } from 'react';
import { BookOpen, Lock, User, ArrowRight, AlertCircle } from 'lucide-react';
import { authService } from '../services/api';

export default function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await authService.login(username, password);
      setLoading(false);
      onLoginSuccess(data);
    } catch (err) {
      setLoading(false);
      console.error("Login Error:", err);
      const detail = err.response?.data?.detail || err.message || "Login yoki parol noto'g'ri!";
      setErrorMsg(detail);
    }
  };

  return (
    <div 
      style={{ 
        width: '100vw', 
        height: '100vh', 
        background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div 
        className="card" 
        style={{ 
          width: '100%', 
          maxWidth: '420px', 
          padding: '36px', 
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          background: '#ffffff'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div 
            style={{ 
              width: '54px', 
              height: '54px', 
              borderRadius: '14px', 
              background: '#eff6ff', 
              color: '#2563eb', 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              marginBottom: '12px'
            }}
          >
            <BookOpen size={28} />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>English Language Learning CRM</h2>
          <span style={{ fontSize: '13px', color: '#64748b' }}>Tizimga kirish uchun login va parolni kiriting</span>
        </div>

        {errorMsg && (
          <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Login / Username</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                className="form-input" 
                style={{ width: '100%', paddingLeft: '38px' }}
                required 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <User size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label>Parol (Password)</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="password" 
                className="form-input" 
                style={{ width: '100%', paddingLeft: '38px' }}
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Lock size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', height: '44px', fontSize: '15px' }}
            disabled={loading}
          >
            {loading ? 'Kirilmoqda...' : 'Tizimga Kirish'}
            <ArrowRight size={18} />
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '12px', color: '#64748b', background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
          <strong>Sinov uchun login:</strong> admin / admin123
        </div>
      </div>
    </div>
  );
}
