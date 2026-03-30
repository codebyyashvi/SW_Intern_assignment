import './App.css'
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js'
import { useEffect, useMemo, useState } from 'react'
import { Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler)

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://127.0.0.1:8000'

const dayOptions = [30, 90, 180]

const numberFmt = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 2,
})

const percentFmt = new Intl.NumberFormat('en-IN', {
  style: 'percent',
  maximumFractionDigits: 2,
})

function App() {
  const [companies, setCompanies] = useState([])
  const [selectedSymbol, setSelectedSymbol] = useState('INFY')
  const [rangeDays, setRangeDays] = useState(30)
  const [seriesData, setSeriesData] = useState([])
  const [summary, setSummary] = useState(null)
  const [compareSymbol, setCompareSymbol] = useState('TCS')
  const [comparison, setComparison] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const res = await fetch(`${API_BASE}/companies`)
        if (!res.ok) {
          throw new Error('Failed to load companies')
        }
        const payload = await res.json()
        setCompanies(payload)

        if (payload.length > 0) {
          setSelectedSymbol((previous) => (
            payload.some((company) => company.symbol === previous) ? previous : payload[0].symbol
          ))
        }
      } catch (fetchError) {
        setError(fetchError.message)
      }
    }

    loadCompanies()
  }, [])

  useEffect(() => {
    if (!selectedSymbol) {
      return
    }

    const loadStockBundle = async () => {
      setLoading(true)
      setError('')

      try {
        const [dataRes, summaryRes] = await Promise.all([
          fetch(`${API_BASE}/data/${selectedSymbol}?days=${rangeDays}`),
          fetch(`${API_BASE}/summary/${selectedSymbol}`),
        ])

        if (!dataRes.ok || !summaryRes.ok) {
          throw new Error('Unable to fetch stock data')
        }

        const dataJson = await dataRes.json()
        const summaryJson = await summaryRes.json()

        setSeriesData(dataJson.data ?? [])
        setSummary(summaryJson)
      } catch (fetchError) {
        setError(fetchError.message)
      } finally {
        setLoading(false)
      }
    }

    loadStockBundle()
  }, [selectedSymbol, rangeDays])

  useEffect(() => {
    if (!selectedSymbol || !compareSymbol || selectedSymbol === compareSymbol) {
      setComparison(null)
      return
    }

    const loadComparison = async () => {
      try {
        const res = await fetch(`${API_BASE}/compare?symbol1=${selectedSymbol}&symbol2=${compareSymbol}&days=${rangeDays}`)
        if (!res.ok) {
          throw new Error('Comparison unavailable')
        }
        const payload = await res.json()
        setComparison(payload)
      } catch {
        setComparison(null)
      }
    }

    loadComparison()
  }, [selectedSymbol, compareSymbol, rangeDays])

  const chartData = useMemo(() => {
    const labels = seriesData.map((row) => row.date)
    const closePoints = seriesData.map((row) => row.close)
    const maPoints = seriesData.map((row) => row.ma_7)

    return {
      labels,
      datasets: [
        {
          label: `${selectedSymbol} Close`,
          data: closePoints,
          borderColor: '#0f4c5c',
          backgroundColor: 'rgba(15, 76, 92, 0.16)',
          tension: 0.25,
          fill: true,
          pointRadius: 0,
        },
        {
          label: '7-day MA',
          data: maPoints,
          borderColor: '#e36414',
          backgroundColor: 'rgba(227, 100, 20, 0.2)',
          tension: 0.25,
          pointRadius: 0,
        },
      ],
    }
  }, [seriesData, selectedSymbol])

  const compareChartData = useMemo(() => {
    if (!comparison?.performance) {
      return null
    }

    return {
      labels: comparison.performance.map((row) => row.date),
      datasets: [
        {
          label: `${comparison.symbol1} Performance %`,
          data: comparison.performance.map((row) => row.perf_1),
          borderColor: '#007f5f',
          pointRadius: 0,
          tension: 0.2,
        },
        {
          label: `${comparison.symbol2} Performance %`,
          data: comparison.performance.map((row) => row.perf_2),
          borderColor: '#bc4749',
          pointRadius: 0,
          tension: 0.2,
        },
      ],
    }
  }, [comparison])

  const topGainer = useMemo(() => {
    if (seriesData.length === 0) {
      return null
    }
    return [...seriesData].sort((a, b) => b.daily_return - a.daily_return)[0]
  }, [seriesData])

  const topLoser = useMemo(() => {
    if (seriesData.length === 0) {
      return null
    }
    return [...seriesData].sort((a, b) => a.daily_return - b.daily_return)[0]
  }, [seriesData])

  return (
    <div className="app-shell">
      <aside className="left-rail">
        <h1>Market Pulse</h1>
        <p>NSE stocks analytics dashboard</p>

        <div className="company-list">
          {companies.map((company) => (
            <button
              key={company.symbol}
              className={selectedSymbol === company.symbol ? 'company active' : 'company'}
              onClick={() => setSelectedSymbol(company.symbol)}
              type="button"
            >
              <span>{company.symbol}</span>
              <small>{company.ticker}</small>
            </button>
          ))}
        </div>
      </aside>

      <main className="main-panel">
        <section className="panel-header">
          <div>
            <h2>{selectedSymbol} Overview</h2>
            <p>Cleaned stock series with return, moving average, and 52-week analytics.</p>
          </div>

          <div className="range-switcher">
            {dayOptions.map((opt) => (
              <button
                key={opt}
                className={rangeDays === opt ? 'range-btn active' : 'range-btn'}
                onClick={() => setRangeDays(opt)}
                type="button"
              >
                {opt}D
              </button>
            ))}
          </div>
        </section>

        {error && <div className="error-box">{error}</div>}

        <section className="cards-grid">
          <article>
            <h3>Latest Close</h3>
            <strong>{summary ? numberFmt.format(summary.latest_close) : '--'}</strong>
          </article>
          <article>
            <h3>Daily Return</h3>
            <strong>{summary ? percentFmt.format(summary.daily_return) : '--'}</strong>
          </article>
          <article>
            <h3>52W High / Low</h3>
            <strong>
              {summary
                ? `${numberFmt.format(summary.high_52w)} / ${numberFmt.format(summary.low_52w)}`
                : '--'}
            </strong>
          </article>
          <article>
            <h3>Volatility Score</h3>
            <strong>{summary ? numberFmt.format(summary.volatility_score_14d) : '--'}</strong>
          </article>
        </section>

        <section className="chart-card">
          <h3>Closing Price Trend</h3>
          {loading ? (
            <p>Loading chart data...</p>
          ) : (
            <Line
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'bottom' },
                },
              }}
            />
          )}
        </section>

        <section className="insights-grid">
          <article>
            <h3>Top Gainer (Selected Range)</h3>
            <p>{topGainer ? `${topGainer.date} (${percentFmt.format(topGainer.daily_return)})` : '--'}</p>
          </article>
          <article>
            <h3>Top Loser (Selected Range)</h3>
            <p>{topLoser ? `${topLoser.date} (${percentFmt.format(topLoser.daily_return)})` : '--'}</p>
          </article>
          <article>
            <h3>Compare Two Stocks</h3>
            <div className="compare-controls">
              <label htmlFor="compare">Against</label>
              <select
                id="compare"
                value={compareSymbol}
                onChange={(e) => setCompareSymbol(e.target.value)}
              >
                {companies
                  .filter((company) => company.symbol !== selectedSymbol)
                  .map((company) => (
                    <option key={company.symbol} value={company.symbol}>
                      {company.symbol}
                    </option>
                  ))}
              </select>
            </div>
            <p>
              Correlation: {comparison ? numberFmt.format(comparison.correlation) : '--'}
            </p>
          </article>
        </section>

        {compareChartData && (
          <section className="chart-card compare-card">
            <h3>Performance Comparison (%)</h3>
            <Line
              data={compareChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'bottom' },
                },
              }}
            />
          </section>
        )}
      </main>
    </div>
  )
}

export default App
