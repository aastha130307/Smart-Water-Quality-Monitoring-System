import React, { useEffect, useState } from 'react';
import api, { BACKEND_URL } from '../api';

export default function Reports() {
  const [locations, setLocations] = useState([]);
  const [location, setLocation] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  useEffect(() => {
    api.get('/data/locations').then(r => setLocations(r.data));
  }, []);

  const download = async (format) => {
    const token = localStorage.getItem('token');
    const qs = new URLSearchParams();
    if (location) qs.set('location', location);
    if (from) qs.set('from', from);
    if (to) qs.set('to', to);
    const res = await fetch(`${BACKEND_URL || ''}/api/reports/${format}?${qs}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) { alert('Failed to download'); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `swqms_report_${Date.now()}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="card">
        <h3>Generate Report</h3>
        <div className="row">
          <label>Location:
            <select value={location} onChange={e=>setLocation(e.target.value)} data-testid="report-location">
              <option value="">All</option>
              {locations.map(l => <option key={l.name} value={l.name}>{l.name}</option>)}
            </select>
          </label>
          <label>From: <input type="datetime-local" value={from} onChange={e=>setFrom(e.target.value)} data-testid="report-from" /></label>
          <label>To: <input type="datetime-local" value={to} onChange={e=>setTo(e.target.value)} data-testid="report-to" /></label>
        </div>
        <div className="row">
          <button className="btn" onClick={() => download('csv')} data-testid="report-csv">Download CSV</button>
          <button className="btn btn-outline" onClick={() => download('pdf')} data-testid="report-pdf">Download PDF</button>
        </div>
        <div className="muted">CSV contains all filtered readings; PDF contains summary + recent alerts + sample readings.</div>
      </div>
    </div>
  );
}
