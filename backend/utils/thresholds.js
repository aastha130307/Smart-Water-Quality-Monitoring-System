
const THRESHOLDS = {
  ph:              { min: 6.5, max: 8.5,   permissible: 9.2,   weight: 0.11, tolerance: 0.05 },
  hardness:        { min: 0,   max: 300,   permissible: 600,   weight: 0.09, tolerance: 0.15 },

  solids:          { min: 0,   max: 500,   permissible: 2000,  weight: 0.11, tolerance: 0.20 },
  chloramines:     { min: 0,   max: 4,     permissible: 5,     weight: 0.12, tolerance: 0.10 },
  sulfate:         { min: 0,   max: 250,   permissible: 400,   weight: 0.10, tolerance: 0.15 },
 
  conductivity:    { min: 0,   max: 800,   permissible: 1500,  weight: 0.10, tolerance: 0.15 },
  organic_carbon:  { min: 0,   max: 10,    permissible: 15,    weight: 0.09, tolerance: 0.20 },
  trihalomethanes: { min: 0,   max: 80,    permissible: 100,   weight: 0.14, tolerance: 0.15 },
  turbidity:       { min: 0,   max: 5,     permissible: 10,    weight: 0.14, tolerance: 0.20 }
};


function computeWQI(row) {
  let totalScore = 0, totalWeight = 0;
  for (const [key, t] of Object.entries(THRESHOLDS)) {
    const v = row[key];
    if (v === undefined || v === null || isNaN(v)) continue;
    let score;
    if (v >= t.min && v <= t.max) {
      score = 100;
    } else {
      const dist = v > t.max ? (v - t.max) : (t.min - v);
      const range = Math.max(1, t.max - t.min);
      score = Math.max(0, 100 - (dist / range) * 100);
    }
    totalScore += score * t.weight;
    totalWeight += t.weight;
  }
  if (totalWeight === 0) return 0;
  return +(totalScore / totalWeight).toFixed(2);
}

function classifyWQI(wqi) {
  if (wqi >= 85) return 'Excellent';
  if (wqi >= 70) return 'Good';
  if (wqi >= 50) return 'Poor';
  return 'Unsafe';
}


function detectAlerts(row) {
  const alerts = [];
  for (const [key, t] of Object.entries(THRESHOLDS)) {
    const v = row[key];
    if (v === undefined || v === null || isNaN(v)) continue;
    if (v >= t.min && v <= t.max) continue; 
    const overMax = v > t.max;
    const bound = overMax ? t.max : t.min;
    const denom = Math.max(1, Math.abs(bound) || t.max || 1);
    const dist = overMax ? (v - t.max) / denom : (t.min - v) / denom;

    
    if (dist < t.tolerance) continue;

    
    let severity = 'Low';
    if (overMax) {
      if (v >= t.permissible * 1.25) severity = 'High';
      else if (v > t.permissible) severity = 'Medium';
    } else {
     
      if (dist > 0.5) severity = 'High';
      else if (dist > 0.25) severity = 'Medium';
    }

    alerts.push({
      parameter: key,
      value: +Number(v).toFixed(3),
      threshold: `${t.min} - ${t.max} (permissible ${t.permissible})`,
      severity
    });
  }
  return alerts;
}

module.exports = { THRESHOLDS, computeWQI, classifyWQI, detectAlerts };
