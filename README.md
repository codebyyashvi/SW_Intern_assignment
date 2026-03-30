# Stock Market Analytics Assignment

This project implements all required parts of the internship assignment:

- Part 1: Data collection, cleaning, and feature engineering with Pandas
- Part 2: FastAPI backend with required REST endpoints
- Part 3: React dashboard with interactive charts and insights

## Project Structure

- backend/app.py: FastAPI application and data pipeline logic
- backend/data/: CSV cache for fetched stock data
- frontend/: Vite + React dashboard
- requirements.txt: Python dependencies

## Features Implemented

### Data Collection and Preparation

Data is fetched using yfinance for NSE symbols and then cleaned with Pandas.

Transformations included:
- Missing-value handling with forward/backward fill
- Incorrect type handling with robust numeric/date conversion
- Date parsing and standardization
- Daily Return = (close - open) / open
- 7-day moving average (`ma_7`)
- 52-week rolling high/low (`high_52w`, `low_52w`)

Custom metric:
- 14-day volatility score (`volatility_14d`) using standard deviation of daily returns

### Backend API (FastAPI)

FastAPI auto-generates Swagger docs at `/docs`.

Implemented endpoints:
- `GET /companies`: list available companies
- `GET /data/{symbol}?days=30`: last N days (default 30) with derived metrics
- `GET /summary/{symbol}`: 52-week high/low/average close and latest summary
- `GET /compare?symbol1=INFY&symbol2=TCS&days=90`: performance comparison and correlation

### Frontend Dashboard

Implemented in React with Chart.js:
- Left panel with company list
- Closing price chart on selection
- Last 30/90/180 day filters
- Key metrics cards
- Top gainer/loser in selected range
- Compare two stocks chart and correlation

## Setup Instructions

## 1. Backend setup

From project root:

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
