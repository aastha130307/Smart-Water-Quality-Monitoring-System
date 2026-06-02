const express = require('express');
const WaterData = require('../models/WaterData');
const { authenticate, authorize } = require('../middleware/auth');
const { computeWQI } = require('../utils/thresholds');

const router = express.Router();
router.use(authenticate, authorize('admin'));

router.post('/data', async (req, res) => {
  const b = req.body || {};
  if (!b.location || b.latitude == null || b.longitude == null || !b.timestamp) {
    return res.status(400).json({ message: 'timestamp, location, latitude, longitude are required' });
  }
  const wqi = b.wqi != null ? b.wqi : computeWQI(b);
  const doc = await WaterData.create({ ...b, wqi });
  res.json(doc);
});

router.put('/data/:id', async (req, res) => {
  const updated = await WaterData.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});

router.delete('/data/:id', async (req, res) => {
  await WaterData.findByIdAndDelete(req.params.id);
  res.json({ message: 'deleted' });
});

router.post('/reset', async (req, res) => {
  await WaterData.deleteMany({});
  res.json({ message: 'all records deleted' });
});

module.exports = router;
