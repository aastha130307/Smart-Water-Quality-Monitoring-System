import React, { useEffect, useRef, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend, Filler
} from 'chart.js';
import api from '../api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const PARAMS = [
  { key: 'ph', label: 'pH', unit: '', safe: [6.5, 8.5] },
  { key: 'hardness', label: 'Hardness', unit: 'mg/L', safe: [0, 300] },
  { key: 'solids', label: 'TDS', unit: 'mg/L', safe: [0, 500] },
  { key: 'chloramines', label: 'Chloramines', unit: 'mg/L', safe: [0, 4] },
  { key: 'sulfate', label: 'Sulfate', unit: 'mg/L', safe: [0, 250] },
  { key: 'conductivity', label: 'Conductivity', unit: 'µS/cm', safe: [0, 800] },
  { key: 'organic_carbon', label: 'Organic Carbon', unit: 'ppm', safe: [0, 10] },
  { key: 'trihalomethanes', label: 'Trihalomethanes', unit: 'µg/L', safe: [0, 80] },
  { key: 'turbidity', label: 'Turbidity', unit: 'NTU', safe: [0, 5] }
];


const LINE_COLORS = [
  '#4fc3f7', '#ff8a65', '#9ccc65', '#ba68c8', '#f06292',
  '#ffd54f', '#4db6ac', '#e57373', '#7986cb', '#a1887f'
];

function safetyClass(v, [min, max]) {
  if (v == null || isNaN(v)) return '';
  if (v >= min && v <= max) return 'safe';
  const dist = v > max ? (v - max) / Math.max(1, max) : (min - v) / Math.max(1, min || 1);
  return dist > 0.4 ? 'danger' : 'warn';
}

function wqiBadge(wqi) {
  if (wqi >= 85) return { cls: 'safe', label: 'Excellent' };
  if (wqi >= 70) return { cls: 'good', label: 'Good' };
  if (wqi >= 50) return { cls: 'warn', label: 'Poor' };
  return { cls: 'danger', label: 'Unsafe' };
}

export default function Dashboard() {
  const [simState, setSimState] = useState(null);
  const [summary, setSummary] = useState({});
  const [locations, setLocations] = useState([]);
  const [selected, setSelected] = useState('');
  const [compareLocations, setCompareLocations] = useState([]); 
  const [seriesMap, setSeriesMap] = useState({}); 
  const [chartParam, setChartParam] = useState('wqi');
  const [compareMode, setCompareMode] = useState(false);
  const autoPickedRef = useRef(false); 
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const loadState = async () => {
    try {
      const [{ data: s }, { data: sum }, { data: locs }] = await Promise.all([
        api.get('/simulation/state'),
        api.get('/data/summary'),
        api.get('/data/locations')
      ]);
      setSimState(s); setSummary(sum); setLocations(locs);
      if (!autoPickedRef.current && locs.length) {
        setSelected((prev) => prev || locs[0].name);
        autoPickedRef.current = true;
      }
    } catch (e) { console.error(e); }
  };

  const loadSeriesFor = async (locs, param) => {
    if (!locs || locs.length === 0) { setSeriesMap({}); return; }
    const entries = await Promise.all(
      locs.map(async (loc) => {
        try {
          const { data } = await api.get('/data/timeseries', { params: { location: loc, parameter: param, limit: 300 } });
          return [loc, data];
        } catch { return [loc, []]; }
      })
    );
    const m = {};
    for (const [loc, data] of entries) m[loc] = data;
    setSeriesMap(m);
  };

  useEffect(() => {
    loadState();
    const id = setInterval(loadState, 2000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const locs = compareMode ? compareLocations : (selected ? [selected] : []);
    loadSeriesFor(locs, chartParam);
  }, [selected, chartParam, compareMode, compareLocations]);

  const control = async (action, body = {}) => {
    try { await api.post(`/simulation/${action}`, body); loadState(); }
    catch (e) { alert(e.response?.data?.message || e.message); }
  };

  const cur = simState?.current;
  const wqi = cur?.wqi ?? 0;
  const wqiB = wqiBadge(wqi);

  const activeLocs = compareMode ? compareLocations : (selected ? [selected] : []);
  
  const labelSet = new Set();
  activeLocs.forEach(loc => (seriesMap[loc] || []).forEach(p => labelSet.add(new Date(p.t).getTime())));
  const labels = Array.from(labelSet).sort((a, b) => a - b);
  const labelStrs = labels.map(t => {
    const d = new Date(t);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  });

  const datasets = activeLocs.map((loc, i) => {
    const color = LINE_COLORS[i % LINE_COLORS.length];
    const pts = seriesMap[loc] || [];
    const idx = new Map(pts.map(p => [new Date(p.t).getTime(), p.v]));
    const values = labels.map(t => (idx.has(t) ? idx.get(t) : null));
    return {
      label: loc,
      data: values,
      borderColor: color,
      backgroundColor: color + '33',
      fill: activeLocs.length === 1,
      tension: 0.3,
      spanGaps: true,
      pointRadius: 0,
      borderWidth: 2
    };
  });

  return (
    <div>
      <div className="grid grid-4" style={{ marginBottom: 16 }}>
        <div className="card"><h3>Records</h3><div style={{ fontSize: 22 }} data-testid="stat-records">{summary.total || 0}</div></div>
        <div className="card"><h3>Locations</h3><div style={{ fontSize: 22 }} data-testid="stat-locations">{summary.locations || 0}</div></div>
        <div className="card"><h3>Avg WQI</h3><div style={{ fontSize: 22 }} data-testid="stat-avgwqi">{summary.avgWqi || 0}</div></div>
        <div className="card"><h3>Sim Progress</h3>
          <div data-testid="stat-sim">{simState?.index || 0} / {simState?.total || 0}</div>
          <div className="muted">speed {simState?.speed || 1}x</div>
        </div>
      </div>

      <div className="card">
        <h3>Simulation Control</h3>
        <div className="row">
          <span className={`status-pill ${simState?.running && !simState?.paused ? 'status-running'
            : simState?.paused ? 'status-paused' : 'status-stopped'}`} data-testid="sim-status">
            {simState?.running ? (simState.paused ? 'PAUSED' : 'RUNNING') : 'STOPPED'}
          </span>
          {user.role === 'admin' && <>
            <button className="btn btn-sm" onClick={() => control('start', { speed: simState?.speed || 1 })} data-testid="sim-start">Start</button>
            <button className="btn btn-sm btn-secondary" onClick={() => control('pause')} data-testid="sim-pause">Pause</button>
            <button className="btn btn-sm" onClick={() => control('resume')} data-testid="sim-resume">Resume</button>
            <button className="btn btn-sm btn-danger" onClick={() => control('stop')} data-testid="sim-stop">Stop</button>
            <button className="btn btn-sm btn-outline" onClick={() => control('replay')} data-testid="sim-replay">Replay</button>
            <label>Speed:
              <select onChange={(e) => control('speed', { speed: parseFloat(e.target.value) })} data-testid="sim-speed" value={simState?.speed || 1}>
                <option value="0.5">0.5x</option>
                <option value="1">1x</option>
                <option value="2">2x</option>
                <option value="5">5x</option>
                <option value="10">10x</option>
                <option value="25">25x</option>
                <option value="50">50x</option>
                <option value="100">100x</option>
                <option value="500">500x</option>
                <option value="10000">MAX</option>
              </select>
            </label>
            <button className="btn btn-sm btn-outline" onClick={() => control('skip-to-end')} data-testid="sim-skip" title="Process all remaining records instantly">Skip to End</button>
          </>}
          {user.role !== 'admin' && <span className="muted">(Admin-only controls)</span>}
        </div>
      </div>

      {cur && (
        <div className="card">
          <h3>Current Reading — {cur.location} <span className={`badge ${wqiB.cls}`} style={{ marginLeft: 8 }} data-testid="wqi-badge">WQI {wqi} · {wqiB.label}</span></h3>
          <div className="muted">{new Date(cur.timestamp).toLocaleString()}</div>
          <div className="grid grid-4" style={{ marginTop: 12 }}>
            {PARAMS.map(p => (
              <div key={p.key} className={`param ${safetyClass(cur[p.key], p.safe)}`} data-testid={`param-${p.key}`}>
                <div className="label">{p.label}</div>
                <div className="value">{cur[p.key]?.toFixed?.(2) ?? '—'}<span className="unit">{p.unit}</span></div>
                <div className="muted">safe: {p.safe[0]}–{p.safe[1]}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <h3>Trend Analysis</h3>
        <div className="row" style={{ flexWrap: 'wrap', gap: 12 }}>
          <label>
            <input type="checkbox" checked={compareMode} onChange={e => setCompareMode(e.target.checked)} data-testid="trend-compare-toggle" /> Compare mode
          </label>

          {!compareMode && (
            <label>Location:
              <select value={selected} onChange={e => setSelected(e.target.value)} data-testid="trend-location">
                {locations.map(l => <option key={l.name} value={l.name}>{l.name}</option>)}
              </select>
            </label>
          )}

          {compareMode && (
            <label style={{ minWidth: 260 }}>Locations (hold Ctrl/Cmd to pick multiple):
              <select multiple size={Math.min(6, Math.max(3, locations.length))}
                value={compareLocations}
                onChange={e => setCompareLocations(Array.from(e.target.selectedOptions).map(o => o.value))}
                data-testid="trend-compare-locations" style={{ minWidth: 260 }}>
                {locations.map(l => <option key={l.name} value={l.name}>{l.name}</option>)}
              </select>
            </label>
          )}

          <label>Parameter:
            <select value={chartParam} onChange={e => setChartParam(e.target.value)} data-testid="trend-param">
              <option value="wqi">WQI</option>
              {PARAMS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
            </select>
          </label>
        </div>
        <div className="chart-container" data-testid="trend-chart">
          {activeLocs.length === 0 ? (
            <div className="muted" style={{ padding: 20 }}>Select at least one location to view its trend.</div>
          ) : (
            <Line data={{ labels: labelStrs, datasets }} options={{
              responsive: true, maintainAspectRatio: false,
              plugins: { legend: { labels: { color: '#cfd8dc' } } },
              scales: {
                x: { ticks: { color: '#90a4ae', maxTicksLimit: 8 }, grid: { color: '#1e2a3a' } },
                y: { ticks: { color: '#90a4ae' }, grid: { color: '#1e2a3a' } }
              }
            }} />
          )}
        </div>
      </div>
    </div>
  );
}
