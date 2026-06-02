import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import 'leaflet.markercluster';
import api from '../api';

function colorFor(wqi) {
  if (wqi >= 85) return '#2ecc71';
  if (wqi >= 70) return '#3498db';
  if (wqi >= 50) return '#f39c12';
  return '#e74c3c';
}
function labelFor(wqi) {
  if (wqi >= 85) return 'Excellent';
  if (wqi >= 70) return 'Good';
  if (wqi >= 50) return 'Poor';
  return 'Unsafe';
}

const BASEMAPS = {
  street: { name: 'Street', url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '&copy; OpenStreetMap contributors' },
  dark:   { name: 'Dark',   url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', attribution: '&copy; OpenStreetMap &copy; CARTO' },
  light:  { name: 'Light',  url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', attribution: '&copy; OpenStreetMap &copy; CARTO' },
  satellite: { name: 'Satellite', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attribution: 'Tiles &copy; Esri' },
  terrain:{ name: 'Terrain', url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', attribution: 'Map data: &copy; OpenStreetMap, SRTM | Map style: &copy; OpenTopoMap' }
};

function HeatLayer({ points, show }) {
  const map = useMap();
  const layerRef = useRef(null);
  useEffect(() => {
    if (layerRef.current) { map.removeLayer(layerRef.current); layerRef.current = null; }
    if (show && points.length) {
      layerRef.current = L.heatLayer(points, {
        radius: 38, blur: 28, max: 1.0,
        gradient: { 0.2: '#2ecc71', 0.4: '#f1c40f', 0.7: '#e67e22', 1.0: '#e74c3c' }
      }).addTo(map);
    }
    return () => { if (layerRef.current) { map.removeLayer(layerRef.current); layerRef.current = null; } };
  }, [points, show, map]);
  return null;
}

function ClusterLayer({ markers, onFlyTo }) {
  const map = useMap();
  const groupRef = useRef(null);
  useEffect(() => {
    if (groupRef.current) { map.removeLayer(groupRef.current); groupRef.current = null; }
    const group = L.markerClusterGroup({
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      maxClusterRadius: 45
    });
    markers.forEach(m => {
      if (m.latitude == null || m.longitude == null) return;
      const color = colorFor(m.wqi);
      const iconHtml = `<div style="background:${color};width:16px;height:16px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 6px rgba(0,0,0,0.6);"></div>`;
      const marker = L.marker([m.latitude, m.longitude], {
        icon: L.divIcon({ html: iconHtml, className: 'swqms-marker', iconSize: [20, 20] })
      });
      const popupHtml = `
        <div style="font-size:13px;min-width:200px">
          <b style="font-size:14px">${m.location}</b>
          <div style="margin:4px 0">
            <span style="display:inline-block;padding:2px 8px;border-radius:10px;background:${color};color:#fff;font-weight:600">
              WQI ${m.wqi} · ${labelFor(m.wqi)}
            </span>
          </div>
          <div>pH: <b>${m.ph?.toFixed?.(2) ?? '-'}</b> · TDS: <b>${m.solids?.toFixed?.(0) ?? '-'}</b></div>
          <div>Turbidity: <b>${m.turbidity?.toFixed?.(2) ?? '-'}</b> · Chloramines: <b>${m.chloramines?.toFixed?.(2) ?? '-'}</b></div>
          <div>Conductivity: <b>${m.conductivity?.toFixed?.(0) ?? '-'}</b> · Sulfate: <b>${m.sulfate?.toFixed?.(0) ?? '-'}</b></div>
          <div style="margin-top:4px;color:#666">${new Date(m.timestamp).toLocaleString()}</div>
        </div>`;
      marker.bindPopup(popupHtml);
      marker.on('click', () => {
        if (onFlyTo) onFlyTo([m.latitude, m.longitude]);
      });
      group.addLayer(marker);
    });
    group.addTo(map);
    groupRef.current = group;
    return () => { if (groupRef.current) { map.removeLayer(groupRef.current); groupRef.current = null; } };
  }, [markers, map, onFlyTo]);
  return null;
}


function MapRefExposer({ onReady }) {
  const map = useMap();
  useEffect(() => { if (onReady) onReady(map); }, [map, onReady]);
  return null;
}

export default function MapView() {
  const [markers, setMarkers] = useState([]);
  const [origins, setOrigins] = useState([]);
  const [showHeat, setShowHeat] = useState(true);
  const [showOrigin, setShowOrigin] = useState(false);
  const [showClusters, setShowClusters] = useState(true);
  const [basemap, setBasemap] = useState('dark');
  const mapRef = useRef(null);

  const load = async () => {
    try {
      const [{ data: latest }, { data: origin }] = await Promise.all([
        api.get('/data/latest'),
        api.get('/alerts/origin')
      ]);
      setMarkers(latest || []);
      setOrigins(origin || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  const flyTo = (coords) => {
    if (mapRef.current) mapRef.current.flyTo(coords, 14, { duration: 1.0 });
  };

  const heatPoints = markers
    .filter(m => m.latitude && m.longitude)
    .map(m => [m.latitude, m.longitude, Math.max(0, (100 - (m.wqi || 0))) / 100]);

  const center = markers.length ? [markers[0].latitude, markers[0].longitude] : [28.6139, 77.2090];
  const tile = BASEMAPS[basemap];

  
  const counts = { excellent: 0, good: 0, poor: 0, unsafe: 0 };
  markers.forEach(m => {
    if (m.wqi >= 85) counts.excellent++;
    else if (m.wqi >= 70) counts.good++;
    else if (m.wqi >= 50) counts.poor++;
    else counts.unsafe++;
  });

  return (
    <div>
      <div className="card">
        <h3>Geo Visualization</h3>

        <div className="row" style={{ flexWrap: 'wrap', gap: 12, marginBottom: 8 }}>
          <label>Basemap:
            <select value={basemap} onChange={e => setBasemap(e.target.value)} data-testid="basemap-select">
              {Object.entries(BASEMAPS).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
            </select>
          </label>
          <label><input type="checkbox" checked={showHeat} onChange={e => setShowHeat(e.target.checked)} data-testid="toggle-heat" /> Heatmap</label>
          <label><input type="checkbox" checked={showClusters} onChange={e => setShowClusters(e.target.checked)} data-testid="toggle-clusters" /> Cluster markers</label>
          <label><input type="checkbox" checked={showOrigin} onChange={e => setShowOrigin(e.target.checked)} data-testid="toggle-origin" /> Contamination origins</label>
        </div>

        <div className="row" style={{ flexWrap: 'wrap', gap: 14, marginBottom: 8 }}>
          <span className="badge safe" data-testid="legend-excellent">Excellent · {counts.excellent}</span>
          <span className="badge good" data-testid="legend-good">Good · {counts.good}</span>
          <span className="badge warn" data-testid="legend-poor">Poor · {counts.poor}</span>
          <span className="badge danger" data-testid="legend-unsafe">Unsafe · {counts.unsafe}</span>
          <label style={{ marginLeft: 'auto' }}>Jump to:
            <select onChange={e => {
              const m = markers.find(x => x.location === e.target.value);
              if (m) flyTo([m.latitude, m.longitude]);
            }} data-testid="map-jumpto" defaultValue="">
              <option value="" disabled>Select location…</option>
              {markers.map(m => <option key={m.location} value={m.location}>{m.location}</option>)}
            </select>
          </label>
        </div>

        <div className="map-container" data-testid="map">
          <MapContainer center={center} zoom={11} style={{ height: '100%', width: '100%' }}>
            <MapRefExposer onReady={(m) => { mapRef.current = m; }} />
            <TileLayer key={basemap} url={tile.url} attribution={tile.attribution} />

            <HeatLayer points={heatPoints} show={showHeat} />

            {showClusters && <ClusterLayer markers={markers} onFlyTo={flyTo} />}

            {!showClusters && markers.map((m, i) => (
              <CircleMarker key={i} center={[m.latitude, m.longitude]}
                radius={10}
                eventHandlers={{ click: () => flyTo([m.latitude, m.longitude]) }}
                pathOptions={{ color: '#fff', weight: 2, fillColor: colorFor(m.wqi), fillOpacity: 0.9 }}>
                <Popup>
                  <div style={{ fontSize: 13, minWidth: 200 }}>
                    <b style={{ fontSize: 14 }}>{m.location}</b>
                    <div style={{ margin: '4px 0' }}>
                      <span style={{
                        display: 'inline-block', padding: '2px 8px', borderRadius: 10,
                        background: colorFor(m.wqi), color: '#fff', fontWeight: 600
                      }}>WQI {m.wqi} · {labelFor(m.wqi)}</span>
                    </div>
                    <div>pH: <b>{m.ph?.toFixed?.(2)}</b> · TDS: <b>{m.solids?.toFixed?.(0)}</b></div>
                    <div>Turbidity: <b>{m.turbidity?.toFixed?.(2)}</b> · Chloramines: <b>{m.chloramines?.toFixed?.(2)}</b></div>
                    <div>Conductivity: <b>{m.conductivity?.toFixed?.(0)}</b> · Sulfate: <b>{m.sulfate?.toFixed?.(0)}</b></div>
                    <div style={{ marginTop: 4, color: '#888' }}>{new Date(m.timestamp).toLocaleString()}</div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}

            {showOrigin && origins.map((o, i) => (
              <CircleMarker key={`o${i}`} center={[o.lat, o.lng]} radius={16}
                pathOptions={{ color: '#ff1744', fillColor: '#ff1744', fillOpacity: 0.35, weight: 2, dashArray: '4' }}>
                <Popup>
                  <b>Contamination Origin</b><br />
                  {o.location} — {o.parameter}<br />
                  First at: {new Date(o.firstAt).toLocaleString()}<br />
                  Severity: {o.severity}
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
