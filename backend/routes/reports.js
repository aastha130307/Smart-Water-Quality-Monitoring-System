const express = require('express');
const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');
const WaterData = require('../models/WaterData');
const Alert = require('../models/Alert');
const { authenticate } = require('../middleware/auth');
const { classifyWQI } = require('../utils/thresholds');

const router = express.Router();
router.use(authenticate);

router.get('/csv', async (req, res) => {
  const { location, from, to, limit = 5000 } = req.query;
  const q = {};
  if (location) q.location = location;
  if (from || to) q.timestamp = {};
  if (from) q.timestamp.$gte = new Date(from);
  if (to)   q.timestamp.$lte = new Date(to);
  const data = await WaterData.find(q).sort({ timestamp: 1 }).limit(parseInt(limit)).lean();
  const rows = data.map(d => ({
    timestamp: d.timestamp, location: d.location, latitude: d.latitude, longitude: d.longitude,
    wqi: d.wqi, category: classifyWQI(d.wqi), ph: d.ph, hardness: d.hardness, solids: d.solids,
    chloramines: d.chloramines, sulfate: d.sulfate, conductivity: d.conductivity,
    organic_carbon: d.organic_carbon, trihalomethanes: d.trihalomethanes, turbidity: d.turbidity
  }));
  const parser = new Parser();
  const csv = parser.parse(rows);
  res.header('Content-Type', 'text/csv');
  res.attachment(`report_${Date.now()}.csv`);
  res.send(csv);
});

router.get('/pdf', async (req, res) => {
  const { location, from, to } = req.query;
  const q = {};
  if (location) q.location = location;
  if (from || to) q.timestamp = {};
  if (from) q.timestamp.$gte = new Date(from);
  if (to)   q.timestamp.$lte = new Date(to);

  const data = await WaterData.find(q).sort({ timestamp: 1 }).limit(500).lean();
  const alerts = await Alert.find(q.location ? { location: q.location } : {}).sort({ timestamp: -1 }).limit(50).lean();

  const avgWqi = data.length ? (data.reduce((s,d)=>s+(d.wqi||0),0)/data.length).toFixed(2) : 0;

  const doc = new PDFDocument({ margin: 40 });
  res.header('Content-Type', 'application/pdf');
  res.attachment(`report_${Date.now()}.pdf`);
  doc.pipe(res);

  doc.fontSize(20).text('Smart Water Quality Monitoring - Report', { align: 'center' });
  doc.moveDown();
  doc.fontSize(11).text(`Generated: ${new Date().toISOString()}`);
  if (location) doc.text(`Location: ${location}`);
  if (from) doc.text(`From: ${from}`);
  if (to)   doc.text(`To: ${to}`);
  doc.text(`Records: ${data.length}`);
  doc.text(`Average WQI: ${avgWqi} (${classifyWQI(avgWqi)})`);
  doc.moveDown();

  doc.fontSize(14).text('Recent Alerts', { underline: true });
  doc.fontSize(10);
  if (alerts.length === 0) doc.text('No alerts in scope.');
  alerts.slice(0, 25).forEach(a => {
    doc.text(`${new Date(a.timestamp).toISOString()}  [${a.severity}]  ${a.location} - ${a.parameter}=${a.value} (${a.threshold})  ${a.status}`);
  });
  doc.moveDown();

  doc.fontSize(14).text('Sample Readings (first 30)', { underline: true });
  doc.fontSize(9);
  data.slice(0, 30).forEach(d => {
    doc.text(`${new Date(d.timestamp).toISOString()}  ${d.location}  WQI=${d.wqi} pH=${d.ph?.toFixed?.(2)} TDS=${d.solids?.toFixed?.(0)} Turb=${d.turbidity?.toFixed?.(2)}`);
  });

  doc.end();
});

module.exports = router;
