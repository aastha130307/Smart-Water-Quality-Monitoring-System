import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Login() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { username, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/');
    } catch (ex) {
      setErr(ex.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="login-wrap">
      <form className="login-box" onSubmit={submit}>
        <h1>SWQMS</h1>
        <p>Smart Water Quality Monitoring System</p>
        <input data-testid="login-username" value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" />
        <input data-testid="login-password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
        <button className="btn" type="submit" data-testid="login-submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
        {err && <div className="error" data-testid="login-error">{err}</div>}
        <div className="hint">Default: admin/admin123 or operator/operator123</div>
      </form>
    </div>
  );
}
