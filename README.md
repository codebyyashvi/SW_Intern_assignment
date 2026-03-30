# Stock Market Analytics Dashboard

A comprehensive stock market analytics platform for NSE (National Stock Exchange) stocks, featuring data collection, ML-ready metrics, and an interactive React dashboard.

**Status:** Production-Ready | **Python:** 3.10+ | **Node:** 18+

---

## 📋 Table of Contents

1. [Features](#features)
2. [Project Architecture](#project-architecture)
3. [Setup & Installation](#setup--installation)
4. [Running the Application](#running-the-application)
5. [API Documentation](#api-documentation)
6. [Data Logic & Metrics](#data-logic--metrics)
7. [Custom Insights](#custom-insights)
8. [Database Schema](#database-schema)
9. [Technologies](#technologies)

---

## ✨ Features

### Backend Features
✅ **Automated Data Collection** — Real-time stock data from yfinance  
✅ **SQLite Database** — Persistent storage with efficient querying  
✅ **Feature Engineering** — 6+ computed metrics per record  
✅ **REST API** — 5 endpoints for data retrieval  
✅ **CORS Support** — Frontend integration ready  
✅ **Auto-refresh** — Incremental data updates  

### Frontend Features
✅ **Interactive Dashboard** — Real-time metrics display  
✅ **Multiple Companies** — 16 NSE stocks preloaded  
✅ **Flexible Time Ranges** — 30/90/180 day views  
✅ **Stock Comparison** — Correlation coefficient calculation  
✅ **Chart Integration** — Interactive Chart.js visualizations  
✅ **Production UI** — Modern, responsive design  

### Data Metrics
✅ **Daily Return** — (Close - Open) / Open percentage  
✅ **7-day MA** — Moving average for trend analysis  
✅ **52-week High/Low** — Annual extremes  
✅ **Volatility Score** — 14-day standard deviation  
✅ **Correlation** — Stock pair relationship analysis  

---

## 🏗️ Project Architecture

```
SW_Intern_assignment/
├── backend/
│   ├── requirements.txt    # Python dependencies
│   ├── app.py              # FastAPI application and routes
│   ├── database.py         # SQLAlchemy setup & session management
│   ├── models.py           # ORM models (StockData)
│   ├── stock_data.db       # SQLite database (auto-created)
│   └── data/               # CSV fallback storage
├── frontend/
│   ├── src/
│   │   ├── App.jsx         # React main component
│   │   ├── App.css         # Production-level styling
│   │   └── main.jsx        # Entry point
│   ├── package.json        # Dependencies
│   └── vite.config.js      # Vite configuration
└── README.md               # This file
```

### Data Flow
```
yfinance → _download_symbol → _clean_and_transform → SQLite DB
                                                          ↓
                                            Frontend API Calls
                                                          ↓
                                            /data, /summary, /compare, /chart/*
```

---

## 🚀 Setup & Installation

### Prerequisites
- **Python 3.10+** with pip
- **Node.js 18+** with npm
- **Windows/Mac/Linux** with network access

### Step 1: Clone & Navigate
```bash
git clone <repo-url>
cd SW_Intern_assignment
```

### Step 2: Python Setup
```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# On Windows:
.venv\Scripts\Activate.ps1
# On Mac/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Navigate back to root
cd ..
```

### Step 3: Frontend Setup
```bash
cd frontend
npm install
cd ..
```

### Step 4: Database Initialization
The database is **auto-created** on first API call. No manual setup needed!

```bash
# Database will be created at: backend/stock_data.db
```

---

## ▶️ Running the Application

### Terminal 1: Start Backend
```bash
cd backend
uvicorn app:app --reload --port 8000
```

Expected output:
```
INFO:     Application startup complete
INFO:     Uvicorn running on http://127.0.0.1:8000
```

**API Swagger Docs:** http://localhost:8000/docs

### Terminal 2: Start Frontend
```bash
cd frontend
npm run dev
```

Expected output:
```
  VITE v8.0.1  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

Visit **http://localhost:5173** in your browser.

---

## 📡 API Documentation

### Health Check
```
GET /
```
**Response:**
```json
{
  "status": "ok",
  "message": "Stock Market Analytics API is running"
}
```

### List Companies
```
GET /companies
```
**Response:**
```json
[
  { "symbol": "INFY", "ticker": "INFY.NS" },
  { "symbol": "TCS", "ticker": "TCS.NS" },
  ...
]
```

### Get Stock Data
```
GET /data/{symbol}?days=30&refresh=false
```

**Parameters:**
- `symbol` — Company symbol (INFY, TCS, RELIANCE, HDFCBANK, ITC, SBIN, WIPRO, BAJAJFINSV, ASIANPAINT, MARUTI, HDFC, ICICIBANK, POWERGRID, BHARTIARTL, JSWSTEEL, SUNPHARMA)
- `days` — Number of days (5-365, default: 30)
- `refresh` — Force fetch new data (default: false)

**Response:**
```json
{
  "symbol": "INFY",
  "days": 30,
  "count": 30,
  "data": [
    {
      "date": "2026-02-28",
      "open": 2950.25,
      "high": 3020.00,
      "low": 2940.50,
      "close": 3015.75,
      "volume": 5234000,
      "daily_return": 0.0223,
      "ma_7": 2995.50,
      "high_52w": 3250.00,
      "low_52w": 2800.00,
      "volatility_14d": 0.0185
    },
    ...
  ]
}
```

### Get Stock Summary
```
GET /summary/{symbol}?refresh=false
```

**Response:**
```json
{
  "symbol": "INFY",
  "latest_date": "2026-03-30",
  "latest_close": 3050.50,
  "daily_return": 0.0145,
  "moving_average_7": 3025.30,
  "high_52w": 3250.00,
  "low_52w": 2800.00,
  "average_close_52w": 3012.50,
  "average_volume_52w": 5123000,
  "volatility_score_14d": 0.0198
}
```

### Compare Two Stocks
```
GET /compare?symbol1=INFY&symbol2=TCS&days=90&refresh=false
```

**Response:**
```json
{
  "symbol1": "INFY",
  "symbol2": "TCS",
  "days": 90,
  "correlation": 0.876,
  "performance": [
    {
      "date": "2025-12-30",
      "perf_1": 0.0,
      "perf_2": 0.0
    },
    ...
  ]
}
```

### Compare Two Stocks (with Charts)
```
GET /compare?symbol1=INFY&symbol2=TCS&days=90&refresh=false
```

**Response:** Performance comparison data with correlation coefficient (see response example above)

---

## 📊 Data Logic & Metrics

### Daily Return
```
daily_return = (close - open) / open
```
Shows percentage change from market open to close each day. Positive values indicate gains.

**Use Case:** Quick profitability assessment for day traders.

### 7-Day Moving Average (ma_7)
```
ma_7 = mean(close prices for last 7 days)
```
Smooths out daily volatility to show the trend direction.

**Use Case:** Identify trend reversal points and support/resistance levels.

### 52-Week High/Low
```
high_52w = max(high prices in last 252 trading days)
low_52w = min(low prices in last 252 trading days)
```
Trading window = 252 days/year (excludes weekends & holidays).

**Use Case:** Assess if stock is near annual peaks or valleys.

### Volatility Score (14-day)
```
volatility_14d = std_dev(daily_returns for last 14 days)
```
Higher values = more price fluctuations.

**Use Case:** Risk assessment and option pricing.

### Correlation
```
correlation = pearson_correlation(symbol1_close, symbol2_close)
```
Range: -1 to 1
- **1.0** = Perfect positive (move together)
- **0.0** = No relationship
- **-1.0** = Perfect negative (opposite moves)

**Use Case:** Portfolio diversification and pair trading strategy.

---

## 💡 Custom Insights

### 1. Correlation Analysis
**What:** Measure how two stocks move relative to each other.

**Frontend Display:**
- Comparison chart showing synchronized price movements
- Correlation coefficient (0.876 = strong positive relationship)

**Use:** Reduces portfolio risk if you select negatively correlated stocks.

### 2. Volatility Heatmap
**What:** Visualize risk levels over time using color-coded bars.

**Color Coding:**
- 🟢 Green: Low volatility (< 2%)
- 🟡 Yellow: Medium volatility (2-4%)
- 🔴 Red: High volatility (> 4%)

**Use:** Identify high-risk periods for risk allocation.

### 3. Trend Reversals
**What:** When 7-day MA crosses price, it signals trend change.

**Interpretation:**
- Price above MA: Uptrend
- Price below MA: Downtrend
- Crossover: Potential reversal

**Use:** Entry/exit signals for trading strategies.

---

## 🗄️ Database Schema

### StockData Table
```sql
CREATE TABLE stock_data (
  id INTEGER PRIMARY KEY,
  symbol TEXT NOT NULL,
  date DATETIME NOT NULL,
  open FLOAT,
  high FLOAT,
  low FLOAT,
  close FLOAT,
  volume FLOAT,
  daily_return FLOAT,
  ma_7 FLOAT,
  high_52w FLOAT,
  low_52w FLOAT,
  volatility_14d FLOAT,
  created_at DATETIME,
  updated_at DATETIME,
  UNIQUE(symbol, date)
);

-- Indexes for efficient querying
CREATE INDEX idx_symbol_date ON stock_data(symbol, date);
```

**Why SQLite over CSV:**
✅ Atomic upserts (update or insert)  
✅ Indexed searches by symbol + date  
✅ Concurrent read support  
✅ No file locks during updates  
✅ Scalable to millions of records  

---

## 🔧 Technologies

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| FastAPI | 0.116+ | REST API framework |
| SQLAlchemy | 2.0+ | ORM database layer |
| SQLite | Built-in | Persistent data storage |
| Pandas | Latest | Data transformation |
| yfinance | 0.2.65+ | Financial data source |

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 19.2+ | UI framework |
| Chart.js | 4.5+ | Interactive charting |
| react-chartjs-2 | 5.3+ | React wrapper for Chart.js |
| Vite | 8.0+ | Build tool |
| CSS Grid/Flexbox | Native | Responsive layout |
| Tailwind CSS | 3.4+ | Utility styling |

---

## 📝 Notes

### Environment Variables (Optional)
Create `backend/.env` for custom configuration:
```
VITE_API_BASE=http://localhost:8000
DATABASE_URL=sqlite:///stock_data.db
```

### Data Refresh Strategy
- **First Load:** Fetches 2 years of data from yfinance
- **Caching:** Data stored in SQLite, no re-fetch unless `refresh=true`
- **Incremental Updates:** Only new dates are added on refresh

### Performance Tips
1. **Cache Headers:** API responses are cacheable for 5 minutes
2. **Batch Requests:** Load multiple stocks in parallel
3. **Pagination:** Use `days` parameter to limit data payload

### Known Limitations
- yfinance may rate-limit after 2000+ requests/day
- Market data lags by 1-2 days
- Holidays: Markets closed on Indian national holidays
- Weekend data: Excluded (252 trading days ≠ calendar year)

---

## 🐛 Troubleshooting

### Issue: `ModuleNotFoundError: No module named 'sqlalchemy'`
```bash
cd backend
pip install -r requirements.txt
```

### Issue: Database locked error
```bash
# SQLite has exclusive write lock. Wait 30ms and retry.
# Check no other process is writing to stock_data.db
```

### Issue: CORS error in frontend
Backend CORS is enabled for all origins. Ensure:
- Backend running on `http://localhost:8000`
- Frontend running on `http://localhost:5173`
- Network connectivity exists

---

## 📈 Next Steps & Enhancements

- [ ] Add predictive ML models (LSTM forecasting)
- [ ] Implement real-time WebSocket updates
- [ ] Add user authentication & portfolios
- [ ] Export reports to PDF/Excel
- [ ] Mobile app version
- [ ] Advanced filtering & screeners
- [ ] Backtesting framework

---

## 📄 License

Educational assignment for internship program.

---

## ✍️ Author

**Yash V** | Intern, Software Engineering  
**Date:** March 2026
- Compare two stocks chart and correlation

## Setup Instructions

## 1. Backend setup

From backend folder:

```bash
python -m venv .venv
.venv\\Scripts\\activate
pip install -r requirements.txt
```

Run backend:

```bash
uvicorn backend.app:app --reload --port 8000
```

Open Swagger docs:
- http://127.0.0.1:8000/docs

## 2. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on Vite default port (usually 5173).

If backend host is different, set:

```bash
# frontend/.env
VITE_API_BASE=http://127.0.0.1:8000
```

## API Examples

```bash
curl http://127.0.0.1:8000/companies
curl "http://127.0.0.1:8000/data/INFY?days=30"
curl http://127.0.0.1:8000/summary/TCS
curl "http://127.0.0.1:8000/compare?symbol1=INFY&symbol2=TCS&days=90"
```

## Notes

- API caches downloaded data in `backend/data/` to avoid repeated downloads.
- Add more symbols by extending `SYMBOL_MAP` in `backend/app.py`.
