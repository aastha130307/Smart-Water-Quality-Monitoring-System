require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const User = require('./models/User');
const WaterData = require('./models/WaterData');
const { computeWQI } = require('./utils/thresholds');

async function seed() {
  const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/swqms';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGO_URL);
  }

 
  const users = [
    { username: process.env.ADMIN_USERNAME || 'admin',
      password: process.env.ADMIN_PASSWORD || 'admin123', role: 'admin' },
    { username: process.env.OPERATOR_USERNAME || 'operator',
      password: process.env.OPERATOR_PASSWORD || 'operator123', role: 'operator' }
  ];
  for (const u of users) {
    const exists = await User.findOne({ username: u.username });
    if (!exists) {
      const hash = await bcrypt.hash(u.password, 10);
      await User.create({ username: u.username, password: hash, role: u.role });
      console.log(`[seed] user created: ${u.username}/${u.role}`);
    } else {
      console.log(`[seed] user exists: ${u.username}`);
    }
  }

  
  const count = await WaterData.countDocuments();
  if (count > 0) {
    console.log(`[seed] WaterData already has ${count} records, skipping CSV import`);
    return;
  }

  const datasetPath = path.resolve(__dirname, process.env.DATASET_PATH || '../dataset.csv');
  if (!fs.existsSync(datasetPath)) {
    console.warn(`[seed] dataset not found at ${datasetPath}, skipping`);
    return;
  }

  console.log(`[seed] importing dataset from ${datasetPath} ...`);
  const batch = [];
  const BATCH_SIZE = 500;
  let imported = 0;

  await new Promise((resolve, reject) => {
    fs.createReadStream(datasetPath)
      .pipe(csv())
      .on('data', (row) => {
        const doc = {
          timestamp: new Date(row.Timestamp),
          location: row.Location,
          latitude: parseFloat(row.Latitude),
          longitude: parseFloat(row.Longitude),
          ph: parseFloat(row.ph),
          hardness: parseFloat(row.Hardness),
          solids: parseFloat(row.Solids),
          chloramines: parseFloat(row.Chloramines),
          sulfate: parseFloat(row.Sulfate),
          conductivity: parseFloat(row.Conductivity),
          organic_carbon: parseFloat(row.Organic_carbon),
          trihalomethanes: parseFloat(row.Trihalomethanes),
          turbidity: parseFloat(row.Turbidity),
          potability: parseInt(row.Potability)
        };
        
        const providedWqi = parseFloat(row.WQI);
        doc.wqi = isNaN(providedWqi) ? computeWQI(doc) : providedWqi;
        if (!isNaN(doc.latitude) && !isNaN(doc.longitude) && doc.location) {
          batch.push(doc);
        }
      })
      .on('end', async () => {
        try {
          while (batch.length > 0) {
            const chunk = batch.splice(0, BATCH_SIZE);
            await WaterData.insertMany(chunk, { ordered: false });
            imported += chunk.length;
          }
          console.log(`[seed] imported ${imported} water records`);
          resolve();
        } catch (e) { reject(e); }
      })
      .on('error', reject);
  });
}

if (require.main === module) {
  seed().then(() => { console.log('[seed] done'); process.exit(0); })
        .catch(e => { console.error(e); process.exit(1); });
}

module.exports = seed;
