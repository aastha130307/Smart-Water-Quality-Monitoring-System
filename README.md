# Smart Water Quality Monitoring System (SWQMS)

A full-stack web-based simulation platform for monitoring, analyzing and visualizing
urban water quality. Built as per the attached SRS & SDD.

**Tech stack:** React.js (Vite) + Node.js/Express.js + MongoDB + Leaflet + Chart.js

## Features

- JWT authentication with Role-Based Access Control (Admin / Operator)
- Real-time simulation engine (Start / Pause / Resume / Stop / Replay + Speed)
- Multi-parameter monitoring (pH, Hardness, TDS, Chloramines, Sulfate, Conductivity,
  Organic Carbon, Trihalomethanes, Turbidity) with WHO/BIS safety ranges
- Water Quality Index (WQI) calculation + classification (Excellent/Good/Poor/Unsafe)
- Time-series trend analysis with line charts
- Map-based visualization (OpenStreetMap + Leaflet) with color-coded markers
- Heatmap of contamination intensity
- Contamination detection, origin tracing and risk prediction (Low/Med/High)
- Alerts with acknowledge/resolve workflow
- Report generation (CSV + PDF)
- Admin: manual data entry, edit, delete

## Project Structure

```
swqms/
├── backend/              Node.js + Express API
│   ├── models/           Mongoose schemas
│   ├── routes/           REST endpoints
│   ├── middleware/       JWT auth
│   ├── utils/            WQI + thresholds
│   ├── seed.js           Auto-loads CSV dataset + seeds users
│   └── server.js
├── frontend/             React + Vite SPA
│   └── src/pages/        Login, Dashboard, MapView, Alerts, Reports, Admin
├── dataset.csv           Delhi water-quality dataset (included)
└── README.md
```

---

## Prerequisites (install these on your laptop)

1. **Node.js** v18 or higher  — https://nodejs.org
2. **MongoDB Community Edition** v6+  — https://www.mongodb.com/try/download/community
   - Make sure `mongod` is running on default port `27017`.
3. **Yarn** (recommended) — `npm install -g yarn`  (or just use npm)

Verify:
```bash
node -v
mongod --version
yarn -v
```

---

## Step-by-Step Setup

### 1. Unzip the project

```bash
unzip swqms.zip
cd swqms
```

### 2. Start MongoDB (if not already running)

- **Windows:** MongoDB usually runs as a service after install. Otherwise run:
  `"C:\Program Files\MongoDB\Server\6.0\bin\mongod.exe" --dbpath C:\data\db`
- **macOS (Homebrew):** `brew services start mongodb-community`
- **Linux:** `sudo systemctl start mongod`

### 3. Configure & install the backend

```bash
cd backend
cp .env.example .env       
yarn install               
```

Open `.env` and change `JWT_SECRET` to any random string. Default credentials
`admin/admin123` and `operator/operator123` are defined there — feel free to change.

### 4. Start the backend (auto-seeds DB + dataset on first run)

```bash
yarn start                 
```

You should see:
```
[mongo] connected: mongodb://localhost:27017/swqms
[seed] empty DB detected, running seed...
[seed] user created: admin/admin
[seed] user created: operator/operator
[seed] imported 6720 water records
[server] listening on :5000
```

### 5. Install & start the frontend (new terminal)

```bash
cd frontend
yarn install               
yarn dev                   
```

Open http://localhost:3000 in your browser.

### 6. Log in

- **Admin:**    `admin` / `admin123`   (full access)
- **Operator:** `operator` / `operator123`  (read + acknowledge alerts)

### 7. Run the simulation

1. Go to **Dashboard** → click **Start**.
2. Current record updates every ~2s. Adjust speed via the dropdown.
3. Watch WQI, parameter cards, and the trend chart update in real time.
4. Switch to **Map View** to see color-coded locations + heatmap.
5. **Alerts** page shows threshold breaches; Admin can also see **Risk Prediction**.
6. **Reports** page downloads CSV or PDF summaries.

---

## Building for Production (optional)

```bash
cd frontend
yarn build
cd ../backend
yarn start
```

The backend will automatically serve `frontend/dist` at `http://localhost:5000`.

---

## Reset the database

```bash
mongosh swqms --eval "db.dropDatabase()"
```

## API Endpoints (quick reference)

| Method | Endpoint                        | Access   |
|--------|---------------------------------|----------|
| POST   | /api/auth/login                 | public   |
| GET    | /api/data                       | auth     |
| GET    | /api/data/locations             | auth     |
| GET    | /api/data/latest                | auth     |
| GET    | /api/data/timeseries            | auth     |
| GET    | /api/data/summary               | auth     |
| POST   | /api/simulation/start           | admin    |
| POST   | /api/simulation/pause           | admin    |
| POST   | /api/simulation/resume          | admin    |
| POST   | /api/simulation/stop            | admin    |
| POST   | /api/simulation/replay          | admin    |
| POST   | /api/simulation/speed           | admin    |
| GET    | /api/simulation/state           | auth     |
| GET    | /api/alerts                     | auth     |
| PATCH  | /api/alerts/:id                 | auth     |
| GET    | /api/alerts/origin              | auth     |
| GET    | /api/alerts/predict             | auth     |
| GET    | /api/reports/csv                | auth     |
| GET    | /api/reports/pdf                | auth     |
| POST   | /api/admin/data                 | admin    |
| PUT    | /api/admin/data/:id             | admin    |
| DELETE | /api/admin/data/:id             | admin    |

---

## Troubleshooting

- **Backend won't connect to MongoDB:** confirm `mongod` is running, then check `MONGO_URL` in `backend/.env`.
- **Port already in use:** change `PORT` in `backend/.env` (5000) or use another Vite port via `--port`.
- **CSV not imported:** verify `dataset.csv` is next to the `backend/` folder or edit `DATASET_PATH` in `.env`.
- **CORS/proxy issues:** frontend dev server proxies `/api` to `http://localhost:5000` (see `vite.config.js`). Make sure backend is on 5000.
- **Leaflet markers not showing:** check browser console; clear cache and reload.

Enjoy exploring your data! 💧
