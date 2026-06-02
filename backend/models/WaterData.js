const mongoose = require('mongoose');

const WaterDataSchema = new mongoose.Schema({
  timestamp: { type: Date, required: true, index: true },
  location: { type: String, required: true, index: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  wqi: { type: Number },
  ph: { type: Number },
  hardness: { type: Number },
  solids: { type: Number },           
  chloramines: { type: Number },
  sulfate: { type: Number },
  conductivity: { type: Number },
  organic_carbon: { type: Number },
  trihalomethanes: { type: Number },
  turbidity: { type: Number },
  potability: { type: Number }
}, { timestamps: true });

WaterDataSchema.index({ location: 1, timestamp: 1 });

module.exports = mongoose.model('WaterData', WaterDataSchema);
