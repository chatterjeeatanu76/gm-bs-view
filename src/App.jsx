import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  ArcElement, LineElement, PointElement,
  Tooltip, Legend, Filler,
} from 'chart.js'
import { Bar, Doughnut, Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  ArcElement, LineElement, PointElement,
  Tooltip, Legend, Filler
)

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat('en-IN').format(n ?? 0)

const MONTHS = [
  ['01','January'], ['02','February'], ['03','March'],  ['04','April'],
  ['05','May'],     ['06','June'],     ['07','July'],   ['08','August'],
  ['09','September'],['10','October'], ['11','November'],['12','December'],
]

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [income,   setIncome]   = useState([])
  const [expenses, setExpenses] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)
  const [tab,      setTab]      = useState('overview') // 'overview' | 'income' | 'expenditure'
  const [period,   setPeriod]   = useState('month')    // 'month' | 'q2' | 'fy'
  const [incSearch, setIncSearch] = useState('')
  const [incMonth,  setIncMonth]  = useState('')
  const [expSearch, setExpSearch] = useState('')
  const [expMonth,  setExpMonth]  = useState('')

  // ── Fetch ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [{ data: inc, error: e1 }, { data: exp, error: e2 }] = await Promise.all([
          supabase.from('income').select('*').order('date', { ascending: false }),
          supabase.from('expenditure').select('*').order('date', { ascending: false }),
        ])
        if (e1 || e2) throw e1 || e2
        setIncome(inc ?? [])
        setExpenses(exp ?? [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // ── KPIs ────────────────────────────────────────────────────────────────────
  const totalIncome  = income.reduce((a, b) => a + (b.amount ?? 0), 0)
  const totalExpense = expenses.reduce((a, b) => a + (b.amount ?? 0), 0)
  const balance      = totalIncome - totalExpense
  const savingsRate  = totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(1) : '0.0'

  // ── Filters ─────────────────────────────────────────────────────────────────
  const filterRows = (rows, search, month) =>
    rows.filter(row => {
      const text = Object.values(row).join(' ').toLowerCase()
      return (
        (!search || text.includes(search.toLowerCase())) &&
        (!month  || (row.date ?? '').includes(`-${month}-`))
      )
    })

  const filteredIncome   = filterRows(income,   incSearch, incMonth)
  const filteredExpenses = filterRows(expenses, expSearch, expMonth)

  // ── Trend chart ─────────────────────────────────────────────────────────────
  const last6Months = MONTHS.slice(-6)
  const lineData = {
    labels: last6Months.map(([, l]) => l.slice(0, 3)),
    datasets: [
      {
        label: 'Income',
        data: last6Months.map(([m]) =>
          income.filter(r => (r.date ?? '').includes(`-${m}-`))
                .reduce((a, b) => a + (b.amount ?? 0), 0)
        ),
        borderColor: '#1a7a4a', backgroundColor: 'rgba(26,122,74,0.07)',
        tension: 0.4, fill: true, pointRadius: 3,
        pointBackgroundColor: '#1a7a4a', borderWidth: 2,
      },
      {
        label: 'Expense',
        data: last6Months.map(([m]) =>
          expenses.filter(r => (r.date ?? '').includes(`-${m}-`))
                  .reduce((a, b) => a + (b.amount ?? 0), 0)
        ),
        borderColor: '#c0392b', backgroundColor: 'rgba(192,57,43,0.07)',
        tension: 0.4, fill: true, pointRadius: 3,
        pointBackgroundColor: '#c0392b', borderWidth: 2,
      },
    ],
  }

  const barData = {
    labels: ['Income', 'Expense', 'Balance'],
    datasets: [{
      data: [totalIncome, totalExpense, balance],
      backgroundColor: ['#1a7a4a', '#c0392b', '#1c4f7a'],
      borderRadius: 8, borderSkipped: false,
    }],
  }

  const expenseMap = expenses.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] ?? 0) + item.amount
    return acc
  }, {})
  const pieData = {
    labels: Object.keys(expenseMap),
    datasets: [{
      data: Object.values(expenseMap),
      backgroundColor: ['#1c4f7a', '#534AB7', '#1a7a4a', '#c0392b', '#d4a017', '#0f6e56'],
      borderWidth: 2, borderColor: '#fff',
    }],
  }

  const chartBase = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { family: 'DM Sans', size: 10 } } },
      y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { family: 'DM Sans', size: 10 }, callback: v => '₹' + Math.round(v / 1000) + 'K' } },
    },
  }
  const lineOpts = {
    ...chartBase,
    plugins: { legend: { display: true, position: 'top', labels: { font: { family: 'DM Sans', size: 11 }, boxWidth: 10, padding: 12 } } },
  }
  const pieOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: true, position: 'bottom', labels: { font: { family: 'DM Sans', size: 11 }, boxWidth: 10, padding: 10 } } },
  }

  if (loading) return <Loader />
  if (error)   return <ErrorBanner message={error} />

  return (
    <>
      <style>{css}</style>
      <div className="bs-wrap">

        {/* ── HEADER ── */}
        <div className="bs-hdr">

          {/* Top row */}
          <div className="bs-hdr-top">
            <div className="bs-identity">
              <div className="bs-avatar">BS</div>
              <div>
                <div className="bs-prop-label">Property Finance</div>
                <div className="bs-prop-name">Sunrise Residency</div>
              </div>
            </div>
            <div className="bs-hdr-actions">
              <button className="bs-icon-btn" aria-label="Notifications"><BellIcon /></button>
              <button className="bs-icon-btn" aria-label="Settings"><SettingsIcon /></button>
            </div>
          </div>

          {/* Hero */}
          <div className="bs-eyebrow">Financial statement</div>
          <div className="bs-title">Balance Sheet</div>
          <div className="bs-live-row">
            <span className="bs-live-dot" />
            Live · Last updated just now
          </div>

          {/* Period selector */}
          <div className="bs-period-row">
            {[['month','This month'],['q2','Q2 2025'],['fy','FY 2025']].map(([key, label]) => (
              <button
                key={key}
                className={`bs-period-btn ${period === key ? 'active' : ''}`}
                onClick={() => setPeriod(key)}
              >{label}</button>
            ))}
          </div>

          {/* KPI Grid */}
          <div className="bs-kpi-grid">
            <KpiCard label="Income"      value={`₹${fmt(totalIncome)}`}  color="#e8f5ee" change="+8.3%" up icon={<TrendUpIcon />}  iconColor="#1a7a4a" />
            <KpiCard label="Expense"     value={`₹${fmt(totalExpense)}`} color="#fdecea" change="+3.1%" up={false} icon={<WalletIcon />} iconColor="#c0392b" />
            <KpiCard label="Net balance" value={`₹${fmt(balance)}`}      color="#d6eaff" change="+12.6%" up icon={<BankIcon />}   iconColor="#7eb3e8" />
            <KpiCard label="Savings rate" value={`${savingsRate}%`}      color="#ede7f6" change="+2.1%"  up icon={<PieIcon />}    iconColor="#b39ddb" />
          </div>

          {/* Tab nav — inside header */}
          <div className="bs-tab-nav">
            {[['overview','Overview'],['income','Income'],['expenditure','Expenditure']].map(([key, label]) => (
              <button
                key={key}
                className={`bs-tab-btn ${tab === key ? 'active' : ''}`}
                onClick={() => setTab(key)}
              >{label}</button>
            ))}
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="bs-body">

          {/* OVERVIEW */}
          {tab === 'overview' && (
            <>
              <div className="bs-card">
                <div className="bs-card-title">6-month trend</div>
                <div className="bs-chart-tall"><Line data={lineData} options={lineOpts} /></div>
              </div>
              <div className="bs-two-col">
                <div className="bs-card">
                  <div className="bs-card-title">Income vs Expense</div>
                  <div className="bs-chart"><Bar data={barData} options={chartBase} /></div>
                </div>
                <div className="bs-card">
                  <div className="bs-card-title">Expense breakdown</div>
                  <div className="bs-chart"><Doughnut data={pieData} options={pieOpts} /></div>
                </div>
              </div>
            </>
          )}

          {/* INCOME */}
          {tab === 'income' && (
            <div className="bs-card">
              <div className="bs-table-hdr">
                <div className="bs-card-title" style={{ marginBottom: 0 }}>Income records</div>
                <span className="bs-badge bs-badge-green">{filteredIncome.length} {filteredIncome.length === 1 ? 'entry' : 'entries'}</span>
              </div>
              <div className="bs-filters">
                <div className="bs-search-box">
                  <SearchIcon />
                  <input
                    type="text" placeholder="Search date, flat or category…"
                    value={incSearch} onChange={e => setIncSearch(e.target.value)}
                  />
                </div>
                <select className="bs-select" value={incMonth} onChange={e => setIncMonth(e.target.value)}>
                  <option value="">All months</option>
                  {MONTHS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div className="bs-table-wrap">
                <table className="bs-table">
                  <thead>
                    <tr>
                      <th style={{ width: '28%' }}>Date</th>
                      <th style={{ width: '14%' }}>Flat</th>
                      <th style={{ width: '34%' }}>Category</th>
                      <th style={{ width: '24%', textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIncome.length === 0
                      ? <tr><td colSpan={4} className="bs-empty">No records found</td></tr>
                      : filteredIncome.map(r => (
                          <tr key={r.id}>
                            <td>{r.date}</td>
                            <td>{r.flat_no}</td>
                            <td><span className="bs-tag bs-tag-green">{r.category}</span></td>
                            <td className="amt-income text-right">₹{fmt(r.amount)}</td>
                          </tr>
                        ))
                    }
                  </tbody>
                </table>
              </div>
              <div className="bs-total-row">
                <span>Total shown</span>
                <span className="amt-income">₹{fmt(filteredIncome.reduce((a, b) => a + (b.amount ?? 0), 0))}</span>
              </div>
            </div>
          )}

          {/* EXPENDITURE */}
          {tab === 'expenditure' && (
            <div className="bs-card">
              <div className="bs-table-hdr">
                <div className="bs-card-title" style={{ marginBottom: 0 }}>Expenditure records</div>
                <span className="bs-badge bs-badge-red">{filteredExpenses.length} {filteredExpenses.length === 1 ? 'entry' : 'entries'}</span>
              </div>
              <div className="bs-filters">
                <div className="bs-search-box">
                  <SearchIcon />
                  <input
                    type="text" placeholder="Search date or category…"
                    value={expSearch} onChange={e => setExpSearch(e.target.value)}
                  />
                </div>
                <select className="bs-select" value={expMonth} onChange={e => setExpMonth(e.target.value)}>
                  <option value="">All months</option>
                  {MONTHS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div className="bs-table-wrap">
                <table className="bs-table">
                  <thead>
                    <tr>
                      <th style={{ width: '32%' }}>Date</th>
                      <th style={{ width: '44%' }}>Category</th>
                      <th style={{ width: '24%', textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpenses.length === 0
                      ? <tr><td colSpan={3} className="bs-empty">No records found</td></tr>
                      : filteredExpenses.map(r => (
                          <tr key={r.id}>
                            <td>{r.date}</td>
                            <td><span className="bs-tag bs-tag-red">{r.category}</span></td>
                            <td className="amt-expense text-right">₹{fmt(r.amount)}</td>
                          </tr>
                        ))
                    }
                  </tbody>
                </table>
              </div>
              <div className="bs-total-row">
                <span>Total shown</span>
                <span className="amt-expense">₹{fmt(filteredExpenses.reduce((a, b) => a + (b.amount ?? 0), 0))}</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function KpiCard({ label, value, color, change, up, icon, iconColor }) {
  return (
    <div className="bs-kpi">
      <div className="bs-kpi-top">
        <span className="bs-kpi-label">{label}</span>
        <span style={{ color: iconColor, fontSize: 14 }}>{icon}</span>
      </div>
      <div className="bs-kpi-value" style={{ color }}>{value}</div>
      <div className="bs-kpi-change" style={{ color: up ? '#1a7a4a' : '#c0392b' }}>
        {up ? <ArrowUpIcon /> : <ArrowDownIcon />}{change} vs last month
      </div>
    </div>
  )
}

function Loader() {
  return (
    <div className="bs-loader">
      <div className="bs-spinner" />
      <p>Loading balance sheet…</p>
    </div>
  )
}

function ErrorBanner({ message }) {
  return (
    <div className="bs-error">
      <p>⚠️ Could not load data</p>
      <small>{message}</small>
    </div>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const BellIcon     = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
const SettingsIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
const TrendUpIcon  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
const WalletIcon   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>
const BankIcon     = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/></svg>
const PieIcon      = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>
const ArrowUpIcon  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="10" height="10"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
const ArrowDownIcon= () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="10" height="10"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
const SearchIcon   = () => <svg viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>

// ─── CSS ──────────────────────────────────────────────────────────────────────
const css = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #eef2f7; font-family: 'DM Sans', sans-serif; color: #1e293b; }

.bs-wrap {
  max-width: 480px;
  margin: 0 auto;
  background: #f0f2f5;
  min-height: 100vh;
}

/* ── Header ── */
.bs-hdr {
  background: #0B1120;
  padding: 28px 20px 0;
}
.bs-hdr-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.bs-identity { display: flex; align-items: center; gap: 10px; }
.bs-avatar {
  width: 38px; height: 38px; border-radius: 10px;
  background: #1e2d45;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700; color: #7eb3e8; letter-spacing: .5px;
}
.bs-prop-label { font-size: 10px; color: #3b6ea0; font-weight: 600; letter-spacing: .07em; text-transform: uppercase; margin-bottom: 2px; }
.bs-prop-name  { font-size: 13px; color: #c8ddf0; font-weight: 600; }
.bs-hdr-actions { display: flex; gap: 7px; }
.bs-icon-btn {
  width: 34px; height: 34px; border-radius: 9px;
  background: #141e30; border: 0.5px solid #1e2d45;
  color: #5a7a9a; display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all .15s;
}
.bs-icon-btn:hover { background: #1e2d45; color: #c8ddf0; }

.bs-eyebrow { font-size: 10px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: #3b6ea0; margin-bottom: 6px; }
.bs-title   { font-size: 26px; font-weight: 800; color: #fff; letter-spacing: -.3px; line-height: 1.1; margin-bottom: 8px; }
.bs-live-row { font-size: 11px; color: #3b6ea0; display: flex; align-items: center; gap: 6px; margin-bottom: 16px; }
.bs-live-dot { width: 6px; height: 6px; border-radius: 50%; background: #1a7a4a; display: inline-block; }

/* Period */
.bs-period-row { display: flex; gap: 6px; margin-bottom: 18px; }
.bs-period-btn {
  padding: 5px 12px; border-radius: 7px;
  font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 600;
  border: none; cursor: pointer; transition: all .15s;
  background: #141e30; color: #3b6ea0;
}
.bs-period-btn.active { background: #1c4f7a; color: #7eb3e8; }

/* KPI Grid */
.bs-kpi-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-top: 1px solid #141e30;
}
.bs-kpi {
  padding: 14px 16px;
  border-right: 1px solid #141e30;
  border-bottom: 1px solid #141e30;
}
.bs-kpi:nth-child(even) { border-right: none; }
.bs-kpi-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }
.bs-kpi-label { font-size: 10px; font-weight: 600; letter-spacing: .07em; text-transform: uppercase; color: #3b6ea0; }
.bs-kpi-value { font-size: 18px; font-weight: 800; letter-spacing: -.3px; margin-bottom: 3px; }
.bs-kpi-change { display: flex; align-items: center; gap: 3px; font-size: 10px; font-weight: 600; }

/* Tab nav */
.bs-tab-nav {
  display: flex;
  gap: 0;
  background: rgba(0,0,0,0.3);
  border-radius: 12px 12px 0 0;
  padding: 5px 5px 0;
  margin-top: 16px;
}
.bs-tab-btn {
  flex: 1; padding: 10px 0;
  border: none; border-radius: 8px 8px 0 0;
  font-family: 'DM Sans', sans-serif;
  font-size: 13px; font-weight: 600;
  cursor: pointer; transition: all .2s;
  background: transparent;
  color: rgba(255,255,255,0.45);
}
.bs-tab-btn.active { background: #f0f2f5; color: #0B1120; }

/* ── Body ── */
.bs-body { padding: 16px; display: flex; flex-direction: column; gap: 14px; }

/* Card */
.bs-card {
  background: #fff;
  border-radius: 0 0 16px 16px;
  padding: 18px;
  border: 0.5px solid #e2e8f0;
}
.bs-card + .bs-card,
.bs-two-col { margin-top: 0; }
.bs-card:not(:first-child) { border-radius: 16px; }
.bs-card-title { font-size: 11px; font-weight: 700; color: #94a3b8; letter-spacing: .06em; text-transform: uppercase; margin-bottom: 12px; }

/* Two col */
.bs-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.bs-two-col .bs-card { border-radius: 16px; }

/* Charts */
.bs-chart      { height: 200px; }
.bs-chart-tall { height: 220px; }

/* Table */
.bs-table-hdr   { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.bs-filters     { display: grid; grid-template-columns: 1fr auto; gap: 8px; margin-bottom: 12px; }
.bs-search-box  {
  display: flex; align-items: center; gap: 8px;
  background: #f8fafc; border: 1px solid #e2e8f0;
  border-radius: 10px; padding: 0 10px; height: 38px;
}
.bs-search-box input { border: none; outline: none; background: transparent; font-family: 'DM Sans', sans-serif; font-size: 13px; width: 100%; color: #1e293b; }
.bs-select { height: 38px; border-radius: 10px; border: 1px solid #e2e8f0; background: #f8fafc; font-family: 'DM Sans', sans-serif; font-size: 12px; padding: 0 8px; color: #1e293b; outline: none; cursor: pointer; }

.bs-table-wrap { overflow-x: auto; }
.bs-table { width: 100%; border-collapse: collapse; font-size: 12.5px; table-layout: fixed; }
.bs-table th { text-align: left; padding: 0 6px 9px; font-size: 10px; font-weight: 700; color: #94a3b8; letter-spacing: .05em; text-transform: uppercase; border-bottom: 1px solid #f1f5f9; }
.bs-table td { padding: 9px 6px; border-bottom: 1px solid #f8fafc; color: #334155; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bs-table tr:last-child td { border-bottom: none; }
.bs-table tr:hover td { background: #f8fbff; }
.text-right { text-align: right; }
.amt-income  { color: #1a7a4a; font-weight: 700; }
.amt-expense { color: #c0392b; font-weight: 700; }
.bs-empty    { text-align: center; color: #94a3b8; padding: 24px 6px; }

/* Tags & badges */
.bs-tag { font-size: 10px; font-weight: 600; padding: 2px 7px; border-radius: 4px; }
.bs-tag-green  { background: #e6f4ee; color: #1a5c38; }
.bs-tag-red    { background: #fdecea; color: #8b2020; }
.bs-badge      { font-size: 10px; font-weight: 700; padding: 3px 9px; border-radius: 20px; }
.bs-badge-green { background: #e6f4ee; color: #1a5c38; }
.bs-badge-red   { background: #fdecea; color: #8b2020; }

/* Total row */
.bs-total-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 6px 0;
  border-top: 1.5px dashed #e2e8f0;
  margin-top: 4px;
  font-size: 13px; font-weight: 700; color: #64748b;
}

/* Loader / Error */
.bs-loader { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; gap: 14px; color: #64748b; }
.bs-spinner { width: 34px; height: 34px; border: 3px solid #e2e8f0; border-top-color: #0B1120; border-radius: 50%; animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.bs-error { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; gap: 8px; color: #c0392b; text-align: center; padding: 20px; }
`
