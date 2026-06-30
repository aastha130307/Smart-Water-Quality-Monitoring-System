require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL
}));
app.use(express.json({ limit: '5mb' }));

const PORT = process.env.PORT || 5000;
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/swqms';

mongoose.connect(MONGO_URL).then(async () => {
  console.log('[mongo] connected:', MONGO_URL);

  const User = require('./models/User');
  const WaterData = require('./models/WaterData');
  const Alert = require('./models/Alert');
  const userCount = await User.countDocuments();
  const dataCount = await WaterData.countDocuments();
  if (userCount === 0 || dataCount === 0) {
    console.log('[seed] empty DB detected, running seed...');
    try {
      await require('./seed')();
    } catch (e) {
      console.error('[seed] failed:', e.message);
    }
  }
  
  const removed = await Alert.deleteMany({});
  if (removed.deletedCount) console.log(`[startup] cleared ${removed.deletedCount} stale alerts`);
}).catch(err => {
  console.error('[mongo] connection error:', err.message);
  process.exit(1);
});

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/data', require('./routes/data'));
app.use('/api/simulation', require('./routes/simulation'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/admin', require('./routes/admin'));


const buildPath = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath));
  app.get('*', (req, res) => res.sendFile(path.join(buildPath, 'index.html')));
}

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: err.message || 'Server error' });
});

app.listen(PORT, () => console.log(`[server] listening on :${PORT}`));
