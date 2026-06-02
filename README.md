# 💧 Smart Water Quality Monitoring System (SWQMS)

A full-stack web-based simulation platform for **monitoring, analyzing, and visualizing urban water quality** in real time.

Built using **React.js (Vite), Node.js/Express.js, MongoDB, Leaflet, and Chart.js**.

---

## 📸 Features

### 🔐 Authentication & Security

* JWT Authentication
* Role-Based Access Control (RBAC)

  * 👨‍💼 Admin
  * 👷 Operator

### ⚡ Real-Time Simulation Engine

* ▶️ Start Simulation
* ⏸️ Pause
* 🔄 Resume
* ⏹️ Stop
* 🔁 Replay
* 🚀 Adjustable Simulation Speed

### 🧪 Water Quality Monitoring

Monitor multiple water-quality parameters:

* pH
* Hardness
* Total Dissolved Solids (TDS)
* Chloramines
* Sulfate
* Conductivity
* Organic Carbon
* Trihalomethanes
* Turbidity

✅ WHO & BIS safety ranges included

### 📊 Water Quality Analysis

* Water Quality Index (WQI) Calculation
* Quality Classification:

  * 🟢 Excellent
  * 🟡 Good
  * 🟠 Poor
  * 🔴 Unsafe

### 📈 Trend Analysis

* Interactive Time-Series Charts
* Historical Data Visualization
* Real-Time Parameter Tracking

### 🗺️ Geographic Visualization

* OpenStreetMap + Leaflet Integration
* Color-Coded Monitoring Locations
* Contamination Heatmap
* Interactive Map Controls

### 🚨 Alert Management

* Threshold Breach Detection
* Alert Acknowledgement
* Alert Resolution Workflow
* Risk Prediction:

  * 🟢 Low
  * 🟡 Medium
  * 🔴 High

### 🔍 Advanced Analytics

* Contamination Detection
* Source/Origin Tracing
* Risk Assessment
* Data Summaries

### 📄 Reporting

* CSV Export
* PDF Report Generation
* Summary Reports

### ⚙️ Administrative Controls

* Add Water Records
* Edit Existing Data
* Delete Records
* Full Dataset Management

---

## 🏗️ Project Structure

```text
swqms/
├── backend/              # Node.js + Express API
│   ├── models/           # Mongoose Schemas
│   ├── routes/           # REST API Routes
│   ├── middleware/       # JWT Authentication
│   ├── utils/            # WQI & Threshold Utilities
│   ├── seed.js           # Dataset + User Seeding
│   └── server.js
│
├── frontend/             # React + Vite SPA
│   └── src/pages/
│       ├── Login
│       ├── Dashboard
│       ├── MapView
│       ├── Alerts
│       ├── Reports
│       └── Admin
│
├── dataset.csv
└── README.md
```

---

## 🛠️ Prerequisites

Install the following before running the project:

### 📦 Node.js

Version 18 or higher

https://nodejs.org

### 🍃 MongoDB

MongoDB Community Edition v6+

https://www.mongodb.com/try/download/community

### 🧶 Yarn (Recommended)

```bash
npm install -g yarn
```

### ✅ Verify Installation

```bash
node -v
mongod --version
yarn -v
```

---

# 🚀 Setup Guide

## 1️⃣ Extract the Project

```bash
unzip swqms.zip
cd swqms
```

---

## 2️⃣ Start MongoDB

### Windows

```bash
"C:\Program Files\MongoDB\Server\6.0\bin\mongod.exe" --dbpath C:\data\db
```

### macOS

```bash
brew services start mongodb-community
```

### Linux

```bash
sudo systemctl start mongod
```

---

## 3️⃣ Configure Backend

```bash
cd backend
cp .env.example .env
yarn install
```

Update:

```env
JWT_SECRET=your_random_secret
```

Default users:

```text
Admin    : admin / admin123
Operator : operator / operator123
```

---

## 4️⃣ Start Backend

```bash
yarn start
```

Expected output:

```text
[mongo] connected: mongodb://localhost:27017/swqms
[seed] empty DB detected, running seed...
[seed] user created: admin/admin
[seed] user created: operator/operator
[seed] imported 6720 water records
[server] listening on :5000
```

---

## 5️⃣ Start Frontend

Open a new terminal:

```bash
cd frontend
yarn install
yarn dev
```

Visit:

```text
http://localhost:3000
```

---

## 6️⃣ Login

### 👨‍💼 Admin

```text
Username: admin
Password: admin123
```

### 👷 Operator

```text
Username: operator
Password: operator123
```

---

## 7️⃣ Run Simulation

Navigate to:

```text
Dashboard → Start
```

Features available:

* 📊 Live Parameter Updates
* 📈 Trend Charts
* 🧪 WQI Monitoring
* 🗺️ Interactive Map
* 🚨 Alerts Dashboard
* 📄 Report Downloads

---

# 🌍 System Modules

| Module            | Description                  |
| ----------------- | ---------------------------- |
| 🔐 Authentication | JWT-based Login System       |
| 📊 Dashboard      | Live Monitoring & Statistics |
| 🗺️ Map View      | Geographic Visualization     |
| 🚨 Alerts         | Threshold Breach Management  |
| 📈 Analytics      | WQI & Trend Analysis         |
| 📄 Reports        | CSV/PDF Exports              |
| ⚙️ Admin Panel    | CRUD Operations              |

---

# 🔌 API Endpoints

## Authentication

```http
POST /api/auth/login
```

## Data

```http
GET /api/data
GET /api/data/latest
GET /api/data/locations
GET /api/data/timeseries
GET /api/data/summary
```

## Simulation

```http
POST /api/simulation/start
POST /api/simulation/pause
POST /api/simulation/resume
POST /api/simulation/stop
POST /api/simulation/replay
POST /api/simulation/speed

GET  /api/simulation/state
```

## Alerts

```http
GET   /api/alerts
PATCH /api/alerts/:id
GET   /api/alerts/origin
GET   /api/alerts/predict
```

## Reports

```http
GET /api/reports/csv
GET /api/reports/pdf
```

## Admin

```http
POST   /api/admin/data
PUT    /api/admin/data/:id
DELETE /api/admin/data/:id
```

---

# 🏭 Production Build

Frontend:

```bash
cd frontend
yarn build
```

Backend:

```bash
cd ../backend
yarn start
```

Application:

```text
http://localhost:5000
```

---

# 🔄 Reset Database

```bash
mongosh swqms --eval "db.dropDatabase()"
```

---

# 🐞 Troubleshooting

### MongoDB Connection Issues

✔ Verify MongoDB service is running

```bash
mongod
```

Check:

```env
MONGO_URL=mongodb://localhost:27017/swqms
```

---

### Port Already In Use

Change:

```env
PORT=5000
```

or

```bash
vite --port 3001
```

---

### Dataset Not Imported

Verify:

```text
dataset.csv
```

exists at the project root.

---

### CORS Issues

Ensure frontend proxy points to:

```text
http://localhost:5000
```

---

### Leaflet Markers Missing

* Open Browser Console
* Clear Cache
* Reload Application

---

# 💻 Tech Stack

| Technology         | Usage             |
| ------------------ | ----------------- |
| ⚛️ React.js (Vite) | Frontend          |
| 🟢 Node.js         | Runtime           |
| 🚂 Express.js      | Backend API       |
| 🍃 MongoDB         | Database          |
| 🗺️ Leaflet        | Map Visualization |
| 📊 Chart.js        | Data Charts       |
| 🔐 JWT             | Authentication    |

---

## 🌊 Smart Monitoring for Safer Water

**SWQMS helps visualize, analyze, and predict water quality conditions through real-time simulation and interactive analytics.**
