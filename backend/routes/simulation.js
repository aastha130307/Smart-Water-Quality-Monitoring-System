const express = require('express');
const WaterData = require('../models/WaterData');
const Alert = require('../models/Alert');
const { authenticate, authorize } = require('../middleware/auth');
const { detectAlerts, classifyWQI } = require('../utils/thresholds');

const router = express.Router();
router.use(authenticate);

const state = {
  running: false,
  paused: false,
  index: 0,
  speed: 1,
  intervalMs: 2000,
  total: 0,
  current: null,
  startedAt: null,
  ids: []
};
let timer = null;


const lastAlertAt = new Map();
const DEDUP_WINDOW_MS = 6 * 60 * 60 * 1000; 

async function primeIds() {
  if (state.ids.length === 0) {
    const docs = await WaterData.find({}, { _id: 1 }).sort({ timestamp: 1 }).lean();
    state.ids = docs.map(d => d._id);
    state.total = state.ids.length;
  }
}

async function processOne() {
  if (state.index >= state.total) {
    state.running = false;
    return false;
  }
  const id = state.ids[state.index];
  const doc = await WaterData.findById(id).lean();
  if (doc) {
    state.current = { ...doc, category: classifyWQI(doc.wqi) };
    const alerts = detectAlerts(doc);
    const toInsert = [];
    const now = Date.now();
    for (const a of alerts) {
      const key = `${doc.location}::${a.parameter}`;
      const prev = lastAlertAt.get(key);
     
      if (prev && now - prev < DEDUP_WINDOW_MS) continue;
      lastAlertAt.set(key, now);
      toInsert.push({
        timestamp: doc.timestamp,
        location: doc.location,
        parameter: a.parameter,
        value: a.value,
        threshold: a.threshold,
        severity: a.severity,
        status: 'Active'
      });
    }
    if (toInsert.length > 0) {
      await Alert.insertMany(toInsert);
    }
  }
  state.index++;
  return true;
}


async function tick() {
  if (!state.running || state.paused) return;
  
  let batchSize = 1;
  if (state.speed >= 500) batchSize = 50;
  else if (state.speed >= 100) batchSize = 10;
  else if (state.speed >= 50) batchSize = 5;
  else if (state.speed >= 25) batchSize = 2;
  if (state.speed >= 10000) batchSize = 200; 

  for (let i = 0; i < batchSize; i++) {
    const ok = await processOne();
    if (!ok) break;
  }
}

function restartTimer() {
  if (timer) clearInterval(timer);
  
  let effective = Math.floor(state.intervalMs / state.speed);
  if (state.speed >= 10000) effective = 10;
  else if (state.speed >= 500) effective = 30;
  else if (state.speed >= 100) effective = 50;
  else if (state.speed >= 25) effective = 80;
  const ms = Math.max(10, effective);
  timer = setInterval(tick, ms);
}

router.post('/start', authorize('admin'), async (req, res) => {
  await primeIds();
  state.running = true;
  state.paused = false;
  state.startedAt = new Date();
  if (typeof req.body?.speed === 'number') state.speed = req.body.speed;
  if (typeof req.body?.intervalMs === 'number') state.intervalMs = req.body.intervalMs;
  restartTimer();
  res.json({ message: 'started', state: publicState() });
});

router.post('/pause', authorize('admin'), (req, res) => {
  state.paused = true;
  res.json({ message: 'paused', state: publicState() });
});

router.post('/resume', authorize('admin'), (req, res) => {
  if (!state.ids.length) return res.status(400).json({ message: 'not started' });
  state.paused = false;
  state.running = true;
  restartTimer();
  res.json({ message: 'resumed', state: publicState() });
});

router.post('/stop', authorize('admin'), (req, res) => {
  state.running = false; state.paused = false;
  if (timer) clearInterval(timer);
  res.json({ message: 'stopped', state: publicState() });
});

router.post('/replay', authorize('admin'), async (req, res) => {
  state.index = 0;
  state.running = true;
  state.paused = false;
  lastAlertAt.clear();
  await primeIds();
  restartTimer();
  res.json({ message: 'replay', state: publicState() });
});

router.post('/speed', authorize('admin'), (req, res) => {
  const { speed } = req.body || {};
  if (!speed || speed <= 0) return res.status(400).json({ message: 'invalid speed' });
  state.speed = speed;
  if (state.running && !state.paused) restartTimer();
  res.json({ message: 'updated', state: publicState() });
});


router.post('/skip-to-end', authorize('admin'), async (req, res) => {
  await primeIds();
  if (timer) clearInterval(timer);
  state.running = false;
  state.paused = false;

  let processed = 0;
  while (state.index < state.total) {
    await processOne();
    processed++;
    if (processed > 20000) break; 
  }
  res.json({ message: 'finished', state: publicState(), processed });
});

router.get('/state', (req, res) => res.json(publicState()));

function publicState() {
  return {
    running: state.running,
    paused: state.paused,
    index: state.index,
    total: state.total,
    speed: state.speed,
    intervalMs: state.intervalMs,
    current: state.current
  };
}

module.exports = router;
