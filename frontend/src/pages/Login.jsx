import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="page-center" style={{ background: 'var(--bg)' }}>
      <div style={{ width: '100%', maxWidth: 400, padding: '0 1rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 8 }}>
            <span style={{ color: 'var(--accent)' }}>Team</span>Flow
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: 14 }}>Sign in to your workspace</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="label">Email</label>
              <input className="input" type="email" placeholder="you@company.com"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="label">Password</label>
              <input className="input" type="password" placeholder="••••••••"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
            </div>
            {error && <p className="error-msg" style={{ marginBottom: '0.75rem' }}>{error}</p>}
            <button className="btn btn-primary" type="submit" disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '10px' }}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div style={{ borderTop: '1px solid var(--border)', marginTop: '1.25rem', paddingTop: '1rem', fontSize: 13, color: 'var(--text2)', textAlign: 'center' }}>
            No account? <Link to="/signup" style={{ color: 'var(--accent)' }}>Create one</Link>
          </div>

          {/* Demo credentials */}
          <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--bg3)', borderRadius: 'var(--radius-sm)', fontSize: 12, color: 'var(--text2)' }}>
            <div style={{ fontWeight: 500, marginBottom: 4, color: 'var(--text)' }}>Demo accounts</div>
            <div>Admin: admin@teamflow.dev / admin123</div>
            <div>Member: alice@teamflow.dev / member123</div>
          </div>
        </div>
      </div>
    </div>
  );
}
