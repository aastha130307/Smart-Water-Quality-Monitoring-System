const express = require('express');
const WaterData = require('../models/WaterData');
const { authenticate } = require('../middleware/auth');
const { classifyWQI } = require('../utils/thresholds');

const router = express.Router();
router.use(authenticate);


router.get('/', async (req, res) => {
  const { location, parameter, from, to, limit = 100, skip = 0 } = req.query;
  const q = {};
  if (location) q.location = location;
  if (from || to) q.timestamp = {};
  if (from) q.timestamp.$gte = new Date(from);
  if (to)   q.timestamp.$lte = new Date(to);
  const total = await WaterData.countDocuments(q);
  const data = await WaterData.find(q).sort({ timestamp: 1 })
    .skip(parseInt(skip)).limit(Math.min(parseInt(limit), 1000)).lean();
  res.json({ total, data });
});

router.get('/locations', async (req, res) => {
  const locations = await WaterData.aggregate([
    { $group: { _id: '$location',
                lat: { $first: '$latitude' },
                lng: { $first: '$longitude' },
                count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);
  res.json(locations.map(l => ({ name: l._id, lat: l.lat, lng: l.lng, count: l.count })));
});


router.get('/latest', async (req, res) => {
  const latest = await WaterData.aggregate([
    { $sort: { timestamp: -1 } },
    { $group: {
        _id: '$location',
        doc: { $first: '$$ROOT' }
    } },
    { $replaceRoot: { newRoot: '$doc' } }
  ]);
  res.json(latest.map(d => ({ ...d, category: classifyWQI(d.wqi) })));
});

router.get('/timeseries', async (req, res) => {
  const { location, parameter = 'wqi', limit = 200 } = req.query;
  if (!location) return res.status(400).json({ message: 'location required' });
  const docs = await WaterData.find({ location }).sort({ timestamp: 1 }).limit(parseInt(limit)).lean();
  res.json(docs.map(d => ({ t: d.timestamp, v: d[parameter] })));
});


router.get('/summary', async (req, res) => {
  const total = await WaterData.countDocuments();
  const locCount = (await WaterData.distinct('location')).length;
  const avgWqi = await WaterData.aggregate([{ $group: { _id: null, avg: { $avg: '$wqi' } } }]);
  res.json({
    total,
    locations: locCount,
    avgWqi: avgWqi[0] ? +avgWqi[0].avg.toFixed(2) : 0
  });
});

module.exports = router;
