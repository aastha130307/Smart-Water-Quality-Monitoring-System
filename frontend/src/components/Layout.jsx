import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

export default function Layout() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">SWQMS</div>
        <nav>
          <NavLink to="/" end data-testid="nav-dashboard">Dashboard</NavLink>
          <NavLink to="/map" data-testid="nav-map">Map View</NavLink>
          <NavLink to="/alerts" data-testid="nav-alerts">Alerts</NavLink>
          <NavLink to="/reports" data-testid="nav-reports">Reports</NavLink>
          {user.role === 'admin' &&
            <NavLink to="/admin" data-testid="nav-admin">Admin</NavLink>}
        </nav>
      </aside>
      <main className="main">
        <div className="topbar">
          <h2>Smart Water Quality Monitoring System</h2>
          <div>
            <span className="user" data-testid="current-user">{user.username} ({user.role})</span>
            <button className="btn btn-sm btn-secondary" style={{marginLeft: 12}}
              onClick={logout} data-testid="logout-btn">Logout</button>
          </div>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
