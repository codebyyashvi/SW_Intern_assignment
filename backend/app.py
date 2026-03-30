from __future__ import annotations

from pathlib import Path
from typing import Dict, List

import numpy as np
import pandas as pd
import yfinance as yf
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware


BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

SYMBOL_MAP: Dict[str, str] = {
	"INFY": "INFY.NS",
	"TCS": "TCS.NS",
	"RELIANCE": "RELIANCE.NS",
	"HDFCBANK": "HDFCBANK.NS",
	"ITC": "ITC.NS",
	"SBIN": "SBIN.NS",
}


app = FastAPI(
	title="Stock Market Analytics API",
	description="NSE stock analytics with returns, moving averages, volatility, and comparisons.",
	version="1.0.0",
)

app.add_middleware(
	CORSMiddleware,
	allow_origins=["*"],
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)


def _normalize_symbol(symbol: str) -> str:
	clean = symbol.strip().upper()
	return SYMBOL_MAP.get(clean, clean)

def _storage_path(symbol: str) -> Path:
	return DATA_DIR / f"{symbol.replace('.', '_')}.csv"

def _download_symbol(symbol: str, period: str = "2y") -> pd.DataFrame:
	df = yf.download(symbol, period=period, interval="1d", auto_adjust=False, progress=False)

	if df.empty:
		raise HTTPException(status_code=404, detail=f"No data found for symbol: {symbol}")

	if isinstance(df.columns, pd.MultiIndex):
		df.columns = [col[0] for col in df.columns]

	df = df.reset_index().rename(columns={"Date": "date"})
	return df

def _clean_and_transform(df: pd.DataFrame) -> pd.DataFrame:
	rename_map = {
		"Open": "open",
		"High": "high",
		"Low": "low",
		"Close": "close",
		"Volume": "volume",
	}
	df = df.rename(columns=rename_map)

	if "date" not in df.columns:
		if "Datetime" in df.columns:
			df = df.rename(columns={"Datetime": "date"})
		else:
			raise HTTPException(status_code=500, detail="Date column missing from source data")

	df["date"] = pd.to_datetime(df["date"], errors="coerce")

	numeric_cols = ["open", "high", "low", "close", "volume"]
	for col in numeric_cols:
		if col in df.columns:
			df[col] = pd.to_numeric(df[col], errors="coerce")

	df = df.sort_values("date").drop_duplicates(subset=["date"]) 
	df[numeric_cols] = df[numeric_cols].replace([np.inf, -np.inf], np.nan)
	df[numeric_cols] = df[numeric_cols].ffill().bfill()
	df = df.dropna(subset=["date", "open", "close"])

	df["daily_return"] = (df["close"] - df["open"]) / df["open"]
	df["ma_7"] = df["close"].rolling(window=7, min_periods=1).mean()
	df["high_52w"] = df["high"].rolling(window=252, min_periods=1).max()
	df["low_52w"] = df["low"].rolling(window=252, min_periods=1).min()

	# Custom metric: rolling volatility score using 14-day return std deviation.
	df["volatility_14d"] = df["daily_return"].rolling(window=14, min_periods=2).std().fillna(0.0)

	return df

def _save_cache(symbol: str, df: pd.DataFrame) -> None:
	cache_df = df.copy()
	cache_df["date"] = cache_df["date"].dt.strftime("%Y-%m-%d")
	cache_df.to_csv(_storage_path(symbol), index=False)

def _load_cache(symbol: str) -> pd.DataFrame | None:
	path = _storage_path(symbol)
	if not path.exists():
		return None

	cached = pd.read_csv(path)
	cached["date"] = pd.to_datetime(cached["date"], errors="coerce")
	return cached

def get_symbol_data(raw_symbol: str, refresh: bool = False) -> pd.DataFrame:
	symbol = _normalize_symbol(raw_symbol)

	if not refresh:
		cached = _load_cache(symbol)
		if cached is not None and not cached.empty:
			return cached

	downloaded = _download_symbol(symbol)
	transformed = _clean_and_transform(downloaded)
	_save_cache(symbol, transformed)
	return transformed


def _public_symbol(symbol: str) -> str:
	return symbol.replace(".NS", "")


@app.get("/")
def healthcheck() -> Dict[str, str]:
	return {"status": "ok", "message": "Stock Market Analytics API is running"}


@app.get("/companies")
def list_companies() -> List[Dict[str, str]]:
	return [{"symbol": key, "ticker": ticker} for key, ticker in SYMBOL_MAP.items()]


@app.get("/data/{symbol}")
def last_days_data(
	symbol: str,
	days: int = Query(default=30, ge=5, le=365),
	refresh: bool = Query(default=False),
) -> Dict[str, object]:
	df = get_symbol_data(symbol, refresh=refresh)
	latest = df.tail(days).copy()

	latest["date"] = latest["date"].dt.strftime("%Y-%m-%d")
	payload = latest[
		["date", "open", "high", "low", "close", "volume", "daily_return", "ma_7", "high_52w", "low_52w", "volatility_14d"]
	].to_dict(orient="records")

	return {
		"symbol": _public_symbol(_normalize_symbol(symbol)),
		"days": days,
		"count": len(payload),
		"data": payload,
	}


@app.get("/summary/{symbol}")
def summary(symbol: str, refresh: bool = Query(default=False)) -> Dict[str, object]:
	df = get_symbol_data(symbol, refresh=refresh)
	trailing_52w = df.tail(252)

	avg_close = float(trailing_52w["close"].mean())
	high_52w = float(trailing_52w["high"].max())
	low_52w = float(trailing_52w["low"].min())
	avg_volume = float(trailing_52w["volume"].mean())
	latest = df.iloc[-1]

	return {
		"symbol": _public_symbol(_normalize_symbol(symbol)),
		"latest_date": latest["date"].strftime("%Y-%m-%d"),
		"latest_close": float(latest["close"]),
		"daily_return": float(latest["daily_return"]),
		"moving_average_7": float(latest["ma_7"]),
		"high_52w": high_52w,
		"low_52w": low_52w,
		"average_close_52w": avg_close,
		"average_volume_52w": avg_volume,
		"volatility_score_14d": float(latest["volatility_14d"]),
	}


@app.get("/compare")
def compare(
	symbol1: str = Query(..., min_length=1),
	symbol2: str = Query(..., min_length=1),
	days: int = Query(default=90, ge=30, le=365),
	refresh: bool = Query(default=False),
) -> Dict[str, object]:
	df1 = get_symbol_data(symbol1, refresh=refresh).tail(days).copy()
	df2 = get_symbol_data(symbol2, refresh=refresh).tail(days).copy()

	m1 = df1[["date", "close"]].rename(columns={"close": "close_1"})
	m2 = df2[["date", "close"]].rename(columns={"close": "close_2"})
	merged = pd.merge(m1, m2, on="date", how="inner").sort_values("date")

	if merged.empty:
		raise HTTPException(status_code=404, detail="No overlapping data found for comparison")

	base1 = float(merged.iloc[0]["close_1"])
	base2 = float(merged.iloc[0]["close_2"])

	merged["perf_1"] = (merged["close_1"] / base1 - 1.0) * 100
	merged["perf_2"] = (merged["close_2"] / base2 - 1.0) * 100
	corr = float(merged["close_1"].corr(merged["close_2"]))

	result_rows = merged[["date", "perf_1", "perf_2"]].copy()
	result_rows["date"] = result_rows["date"].dt.strftime("%Y-%m-%d")

	return {
		"symbol1": _public_symbol(_normalize_symbol(symbol1)),
		"symbol2": _public_symbol(_normalize_symbol(symbol2)),
		"days": days,
		"correlation": corr,
		"performance": result_rows.to_dict(orient="records"),
	}


@app.on_event("startup")
def preload_companies() -> None:
	# Warm cache during startup for a smoother first API response.
	for symbol in SYMBOL_MAP:
		try:
			get_symbol_data(symbol)
		except Exception:
			continue
