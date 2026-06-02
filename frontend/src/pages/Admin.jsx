import React, { useEffect, useState } from 'react';
import api from '../api';

export default function Admin() {
  const [form, setForm] = useState({
    timestamp: new Date().toISOString().slice(0, 16),
    location: '', latitude: '', longitude: '',
    ph: '', hardness: '', solids: '', chloramines: '', sulfate: '',
    conductivity: '', organic_carbon: '', trihalomethanes: '', turbidity: ''
  });
  const [msg, setMsg] = useState('');
  const [records, setRecords] = useState([]);
  const [locations, setLocations] = useState([]);
  const [filterLoc, setFilterLoc] = useState('');

  const load = async () => {
    const [{ data: locs }, { data: recs }] = await Promise.all([
      api.get('/data/locations'),
      api.get('/data', { params: { location: filterLoc || undefined, limit: 100 } })
    ]);
    setLocations(locs);
    setRecords(recs.data);
  };

  useEffect(() => { load(); }, [filterLoc]);

  const onChange = (k, v) => setForm({ ...form, [k]: v });

  const submit = async (e) => {
    e.preventDefault();
    setMsg('');
    const body = { ...form };
    ['latitude', 'longitude', 'ph', 'hardness', 'solids', 'chloramines', 'sulfate',
      'conductivity', 'organic_carbon', 'trihalomethanes', 'turbidity'].forEach(k => {
      if (body[k] !== '') body[k] = parseFloat(body[k]); else delete body[k];
    });
    body.timestamp = new Date(form.timestamp).toISOString();
    try {
      await api.post('/admin/data', body);
      setMsg('Record added successfully');
      load();
    } catch (e) { setMsg(e.response?.data?.message || 'Error'); }
  };

  const del = async (id) => {
    if (!confirm('Delete this record?')) return;
    await api.delete(`/admin/data/${id}`);
    load();
  };

  return (
    <div>
      <div className="card">
        <h3>Add Water Data Record</h3>
        <form onSubmit={submit}>
          <div className="grid grid-4">
            <label>Timestamp<input type="datetime-local" value={form.timestamp} onChange={e=>onChange('timestamp', e.target.value)} required /></label>
            <label>Location<input value={form.location} onChange={e=>onChange('location', e.target.value)} required data-testid="admin-location" /></label>
            <label>Latitude<input type="number" step="0.0001" value={form.latitude} onChange={e=>onChange('latitude', e.target.value)} required /></label>
            <label>Longitude<input type="number" step="0.0001" value={form.longitude} onChange={e=>onChange('longitude', e.target.value)} required /></label>
            <label>pH<input type="number" step="0.01" value={form.ph} onChange={e=>onChange('ph', e.target.value)} /></label>
            <label>Hardness<input type="number" step="0.01" value={form.hardness} onChange={e=>onChange('hardness', e.target.value)} /></label>
            <label>TDS (Solids)<input type="number" step="0.01" value={form.solids} onChange={e=>onChange('solids', e.target.value)} /></label>
            <label>Chloramines<input type="number" step="0.01" value={form.chloramines} onChange={e=>onChange('chloramines', e.target.value)} /></label>
            <label>Sulfate<input type="number" step="0.01" value={form.sulfate} onChange={e=>onChange('sulfate', e.target.value)} /></label>
            <label>Conductivity<input type="number" step="0.01" value={form.conductivity} onChange={e=>onChange('conductivity', e.target.value)} /></label>
            <label>Organic Carbon<input type="number" step="0.01" value={form.organic_carbon} onChange={e=>onChange('organic_carbon', e.target.value)} /></label>
            <label>Trihalomethanes<input type="number" step="0.01" value={form.trihalomethanes} onChange={e=>onChange('trihalomethanes', e.target.value)} /></label>
            <label>Turbidity<input type="number" step="0.01" value={form.turbidity} onChange={e=>onChange('turbidity', e.target.value)} /></label>
          </div>
          <div className="row" style={{marginTop:12}}>
            <button className="btn" type="submit" data-testid="admin-add">Add Record</button>
            <span className="muted">{msg}</span>
          </div>
        </form>
      </div>

      <div className="card">
        <h3>Existing Records</h3>
        <div className="row">
          <label>Filter by location:
            <select value={filterLoc} onChange={e=>setFilterLoc(e.target.value)}>
              <option value="">All</option>
              {locations.map(l => <option key={l.name} value={l.name}>{l.name}</option>)}
            </select>
          </label>
          <span className="muted">{records.length} shown</span>
        </div>
        <div style={{maxHeight: 400, overflowY: 'auto'}}>
          <table>
            <thead><tr><th>Timestamp</th><th>Location</th><th>WQI</th><th>pH</th><th>TDS</th><th>Turbidity</th><th></th></tr></thead>
            <tbody>
              {records.map(r => (
                <tr key={r._id}>
                  <td>{new Date(r.timestamp).toLocaleString()}</td>
                  <td>{r.location}</td><td>{r.wqi}</td>
                  <td>{r.ph?.toFixed?.(2)}</td><td>{r.solids?.toFixed?.(0)}</td><td>{r.turbidity?.toFixed?.(2)}</td>
                  <td><button className="btn btn-sm btn-danger" onClick={()=>del(r._id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
