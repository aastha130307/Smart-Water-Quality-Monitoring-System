const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
  timestamp: { type: Date, required: true },
  location: { type: String, required: true },
  parameter: { type: String, required: true },
  value: { type: Number, required: true },
  threshold: { type: String },
  severity: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  status: { type: String, enum: ['Active', 'Acknowledged', 'Resolved'], default: 'Active' },
  acknowledgedBy: { type: String },
  acknowledgedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Alert', AlertSchema);
