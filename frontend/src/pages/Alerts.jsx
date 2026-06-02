import React, { useEffect, useState } from 'react';
import api from '../api';

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [status, setStatus] = useState('');
  const [severity, setSeverity] = useState('');
  const [risk, setRisk] = useState([]);

  const load = async () => {
    const [{ data: a }, { data: r }] = await Promise.all([
      api.get('/alerts', { params: { status: status || undefined, severity: severity || undefined, limit: 300 } }),
      api.get('/alerts/predict')
    ]);
    setAlerts(a); setRisk(r);
  };

  useEffect(() => { load(); const id = setInterval(load, 4000); return () => clearInterval(id); }, [status, severity]);

  const ack = async (id, s) => { await api.patch(`/alerts/${id}`, { status: s }); load(); };

  const sevBadge = (s) => s === 'High' ? 'danger' : s === 'Medium' ? 'warn' : 'good';

  return (
    <div>
      <div className="card">
        <h3>Risk Prediction (last 7 days)</h3>
        {risk.length === 0 && <div className="muted">No alert history yet.</div>}
        <div className="grid grid-4">
          {risk.map(r => (
            <div key={r.location} className={`param ${r.risk === 'High' ? 'danger' : r.risk === 'Medium' ? 'warn' : 'safe'}`}>
              <div className="label">{r.location}</div>
              <div className="value">{r.risk}</div>
              <div className="muted">{r.alertCount} alerts · {r.highSeverity} high</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3>Alerts</h3>
        <div className="row">
          <select value={status} onChange={e=>setStatus(e.target.value)} data-testid="alerts-status">
            <option value="">All status</option>
            <option value="Active">Active</option>
            <option value="Acknowledged">Acknowledged</option>
            <option value="Resolved">Resolved</option>
          </select>
          <select value={severity} onChange={e=>setSeverity(e.target.value)} data-testid="alerts-severity">
            <option value="">All severity</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          <span className="muted">{alerts.length} alerts</span>
        </div>
        <div style={{maxHeight: 500, overflowY: 'auto'}}>
          <table>
            <thead>
              <tr><th>Time</th><th>Location</th><th>Parameter</th><th>Value</th><th>Range</th><th>Severity</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              {alerts.map(a => (
                <tr key={a._id} data-testid={`alert-${a._id}`}>
                  <td>{new Date(a.timestamp).toLocaleString()}</td>
                  <td>{a.location}</td><td>{a.parameter}</td><td>{a.value}</td><td>{a.threshold}</td>
                  <td><span className={`badge ${sevBadge(a.severity)}`}>{a.severity}</span></td>
                  <td><span className={`badge ${a.status === 'Active' ? 'warn' : a.status === 'Acknowledged' ? 'good' : 'safe'}`}>{a.status}</span></td>
                  <td>
                    {a.status === 'Active' && <button className="btn btn-sm" onClick={()=>ack(a._id, 'Acknowledged')}>Ack</button>}
                    {a.status !== 'Resolved' && <button className="btn btn-sm btn-secondary" style={{marginLeft:4}} onClick={()=>ack(a._id, 'Resolved')}>Resolve</button>}
                  </td>
                </tr>
              ))}
              {alerts.length === 0 && <tr><td colSpan="8" className="muted" style={{textAlign:'center', padding:20}}>No alerts. Start the simulation from Dashboard.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
