/**
 * Login Page — Premium dark-themed authentication screen.
 */
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Login.css';

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await register(form.name, form.email, form.password);
      } else {
        await login(form.email, form.password);
      }
      navigate('/');
    } catch (err) {
      const rawErr = err.response?.data?.error;
      const errMsg = typeof rawErr === 'string' ? rawErr : rawErr?.message || err.message || 'Authentication failed. Please try again.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Ambient Orbs */}
      <div className="login-orb orb-1" />
      <div className="login-orb orb-2" />
      <div className="login-orb orb-3" />

      <div className="login-container animate-in">
        <div className="login-brand">
          <span className="login-logo"></span>
          <h1 className="login-title">CloudPilot</h1>
          <p className="login-subtitle">Multi-Cloud Infrastructure Dashboard</p>
        </div>

        <div className="login-card glass-card">
          <h2>{isRegister ? 'Create Account' : 'Welcome Back'}</h2>
          <p className="text-muted mb-2">
            {isRegister ? 'Set up your dashboard access' : 'Sign in to your dashboard'}
          </p>

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            {isRegister && (
              <div className="form-group">
                <label htmlFor="login-name">Full Name</label>
                <input
                  id="login-name"
                  type="text"
                  className="input-field"
                  placeholder="Enter your name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
            )}
            <div className="form-group">
              <label htmlFor="login-email">Email</label>
              <input
                id="login-email"
                type="email"
                className="input-field"
                placeholder="you@company.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={8}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
              {loading ? '⏳ Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div className="login-switch">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}
            <button onClick={() => { setIsRegister(!isRegister); setError(''); }}>
              {isRegister ? 'Sign In' : 'Create one'}
            </button>
          </div>

          <div className="login-providers">
            <span className="provider-dot" style={{ color: 'var(--aws-color)' }} title="AWS">●</span>
            <span className="provider-dot" style={{ color: 'var(--azure-color)' }} title="Azure">●</span>
            <span className="provider-dot" style={{ color: 'var(--gcp-color)' }} title="GCP">●</span>
          </div>
        </div>
      </div>
    </div>
  );
}
