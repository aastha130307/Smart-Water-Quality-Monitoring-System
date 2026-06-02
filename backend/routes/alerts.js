const express = require('express');
const Alert = require('../models/Alert');
const WaterData = require('../models/WaterData');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  const { status, severity, location, limit = 200 } = req.query;
  const q = {};
  if (status) q.status = status;
  if (severity) q.severity = severity;
  if (location) q.location = location;
  const alerts = await Alert.find(q).sort({ timestamp: -1 }).limit(parseInt(limit)).lean();
  res.json(alerts);
});

router.patch('/:id', async (req, res) => {
  const { status } = req.body || {};
  if (!['Active','Acknowledged','Resolved'].includes(status)) {
    return res.status(400).json({ message: 'invalid status' });
  }
  const updated = await Alert.findByIdAndUpdate(req.params.id,
    { status, acknowledgedBy: req.user.username, acknowledgedAt: new Date() },
    { new: true });
  res.json(updated);
});

router.get('/origin', async (req, res) => {
  const { parameter } = req.query;
  const q = parameter ? { parameter } : {};
  const origins = await Alert.aggregate([
    { $match: q },
    { $sort: { timestamp: 1 } },
    { $group: {
        _id: { location: '$location', parameter: '$parameter' },
        firstAt: { $first: '$timestamp' },
        severity: { $first: '$severity' },
        value: { $first: '$value' }
    } },
    { $sort: { firstAt: 1 } }
  ]);
 
  const locs = {};
  for (const o of origins) locs[o._id.location] = true;
  const coords = await WaterData.aggregate([
    { $match: { location: { $in: Object.keys(locs) } } },
    { $group: { _id: '$location', lat: { $first: '$latitude' }, lng: { $first: '$longitude' } } }
  ]);
  const coordMap = {};
  coords.forEach(c => coordMap[c._id] = { lat: c.lat, lng: c.lng });
  res.json(origins.map(o => ({
    location: o._id.location,
    parameter: o._id.parameter,
    firstAt: o.firstAt,
    severity: o.severity,
    value: o.value,
    ...(coordMap[o._id.location] || {})
  })));
});


router.get('/predict', async (req, res) => {
  const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7);
  const byLoc = await Alert.aggregate([
    { $match: { timestamp: { $gte: since } } },
    { $group: { _id: '$location',
                count: { $sum: 1 },
                high: { $sum: { $cond: [ { $eq: ['$severity','High'] }, 1, 0 ] } } } }
  ]);
  const result = byLoc.map(b => {
    let risk = 'Low';
    if (b.high >= 5 || b.count >= 25) risk = 'High';
    else if (b.high >= 2 || b.count >= 10) risk = 'Medium';
    return { location: b._id, alertCount: b.count, highSeverity: b.high, risk };
  });
  res.json(result);
});

module.exports = router;
