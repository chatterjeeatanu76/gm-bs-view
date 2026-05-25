import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'

import { Bar, Doughnut, Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  Filler
)

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const fmt = (n) =>
  new Intl.NumberFormat('en-IN').format(Number(n ?? 0))

const MONTHS = [
  ['01', 'January'],
  ['02', 'February'],
  ['03', 'March'],
  ['04', 'April'],
  ['05', 'May'],
  ['06', 'June'],
  ['07', 'July'],
  ['08', 'August'],
  ['09', 'September'],
  ['10', 'October'],
  ['11', 'November'],
  ['12', 'December'],
]

// ─────────────────────────────────────────────────────────────
// App
// ─────────────────────────────────────────────────────────────

export default function App() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [tab, setTab] = useState('overview')

  const [incSearch, setIncSearch] = useState('')
  const [incMonth, setIncMonth] = useState('')

  const [expSearch, setExpSearch] = useState('')
  const [expMonth, setExpMonth] = useState('')

  // ───────────────────────────────────────────────────────────
  // Fetch Transactions
  // ───────────────────────────────────────────────────────────

  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .order('date', { ascending: false })

        if (error) throw error

        setTransactions(data ?? [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  // ───────────────────────────────────────────────────────────
  // Split Income / Expense
  // ───────────────────────────────────────────────────────────

  const income = transactions.filter(
    (item) => item.type === 'income'
  )

  const expenses = transactions.filter(
    (item) => item.type === 'expense'
  )

  // ───────────────────────────────────────────────────────────
  // KPI
  // ───────────────────────────────────────────────────────────

  const totalIncome = income.reduce(
    (a, b) => a + Number(b.amount ?? 0),
    0
  )

  const totalExpense = expenses.reduce(
    (a, b) => a + Number(b.amount ?? 0),
    0
  )

  const balance = totalIncome - totalExpense

  const savingsRate =
    totalIncome > 0
      ? ((balance / totalIncome) * 100).toFixed(1)
      : '0.0'

  // ───────────────────────────────────────────────────────────
  // Filters
  // ───────────────────────────────────────────────────────────

  const filterRows = (rows, search, month) =>
    rows.filter((row) => {
      const text = Object.values(row)
        .join(' ')
        .toLowerCase()

      return (
        (!search ||
          text.includes(search.toLowerCase())) &&
        (!month ||
          (row.date ?? '').includes(`-${month}-`))
      )
    })

  const filteredIncome = filterRows(
    income,
    incSearch,
    incMonth
  )

  const filteredExpenses = filterRows(
    expenses,
    expSearch,
    expMonth
  )

  // ───────────────────────────────────────────────────────────
  // Charts
  // ───────────────────────────────────────────────────────────

  const last6Months = MONTHS.slice(-6)

  const lineData = {
    labels: last6Months.map(([, l]) =>
      l.slice(0, 3)
    ),

    datasets: [
      {
        label: 'Income',
        data: last6Months.map(([m]) =>
          income
            .filter((r) =>
              (r.date ?? '').includes(`-${m}-`)
            )
            .reduce(
              (a, b) =>
                a + Number(b.amount ?? 0),
              0
            )
        ),

        borderColor: '#16a34a',
        backgroundColor: 'rgba(22,163,74,0.1)',
        fill: true,
        tension: 0.4,
      },

      {
        label: 'Expense',
        data: last6Months.map(([m]) =>
          expenses
            .filter((r) =>
              (r.date ?? '').includes(`-${m}-`)
            )
            .reduce(
              (a, b) =>
                a + Number(b.amount ?? 0),
              0
            )
        ),

        borderColor: '#dc2626',
        backgroundColor: 'rgba(220,38,38,0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  }

  const barData = {
    labels: ['Income', 'Expense', 'Balance'],

    datasets: [
      {
        data: [
          totalIncome,
          totalExpense,
          balance,
        ],

        backgroundColor: [
          '#16a34a',
          '#dc2626',
          '#2563eb',
        ],

        borderRadius: 10,
      },
    ],
  }

  const expenseMap = expenses.reduce((acc, item) => {
    acc[item.category] =
      (acc[item.category] ?? 0) +
      Number(item.amount)

    return acc
  }, {})

  const pieData = {
    labels: Object.keys(expenseMap),

    datasets: [
      {
        data: Object.values(expenseMap),

        backgroundColor: [
          '#2563eb',
          '#7c3aed',
          '#16a34a',
          '#dc2626',
          '#f59e0b',
          '#0f766e',
        ],
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
  }

  // ───────────────────────────────────────────────────────────
  // Loading / Error
  // ───────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={styles.center}>
        Loading...
      </div>
    )
  }

  if (error) {
    return (
      <div style={styles.center}>
        <div>
          <h3>⚠️ Could not load data</h3>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  // ───────────────────────────────────────────────────────────
  // UI
  // ───────────────────────────────────────────────────────────

  return (
    <div style={styles.app}>
      {/* Header */}

      <div style={styles.header}>
        <div style={styles.headerTop}>
          <div>
            <div style={styles.smallText}>
              Property Finance
            </div>

            <h1 style={styles.title}>
              Balance Sheet
            </h1>
          </div>
        </div>

        {/* KPI */}

        <div style={styles.kpiGrid}>
          <KpiCard
            title="Income"
            value={`₹${fmt(totalIncome)}`}
            color="#16a34a"
          />

          <KpiCard
            title="Expense"
            value={`₹${fmt(totalExpense)}`}
            color="#dc2626"
          />

          <KpiCard
            title="Balance"
            value={`₹${fmt(balance)}`}
            color="#2563eb"
          />

          <KpiCard
            title="Savings"
            value={`${savingsRate}%`}
            color="#7c3aed"
          />
        </div>

        {/* Tabs */}

        <div style={styles.tabs}>
          {[
            ['overview', 'Overview'],
            ['income', 'Income'],
            ['expense', 'Expense'],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                ...styles.tabBtn,
                ...(tab === key
                  ? styles.activeTab
                  : {}),
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}

      <div style={styles.body}>
        {/* Overview */}

        {tab === 'overview' && (
          <>
            <Card title="6 Month Trend">
              <div style={{ height: 260 }}>
                <Line
                  data={lineData}
                  options={chartOptions}
                />
              </div>
            </Card>

            <div style={styles.grid2}>
              <Card title="Income vs Expense">
                <div style={{ height: 240 }}>
                  <Bar
                    data={barData}
                    options={chartOptions}
                  />
                </div>
              </Card>

              <Card title="Expense Breakdown">
                <div style={{ height: 240 }}>
                  <Doughnut
                    data={pieData}
                    options={chartOptions}
                  />
                </div>
              </Card>
            </div>
          </>
        )}

        {/* Income */}

        {tab === 'income' && (
          <Card title="Income Records">
            <div style={styles.filters}>
              <input
                style={styles.input}
                placeholder="Search..."
                value={incSearch}
                onChange={(e) =>
                  setIncSearch(e.target.value)
                }
              />

              <select
                style={styles.select}
                value={incMonth}
                onChange={(e) =>
                  setIncMonth(e.target.value)
                }
              >
                <option value="">
                  All Months
                </option>

                {MONTHS.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            <Table
              rows={filteredIncome}
              type="income"
            />
          </Card>
        )}

        {/* Expense */}

        {tab === 'expense' && (
          <Card title="Expense Records">
            <div style={styles.filters}>
              <input
                style={styles.input}
                placeholder="Search..."
                value={expSearch}
                onChange={(e) =>
                  setExpSearch(e.target.value)
                }
              />

              <select
                style={styles.select}
                value={expMonth}
                onChange={(e) =>
                  setExpMonth(e.target.value)
                }
              >
                <option value="">
                  All Months
                </option>

                {MONTHS.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>

            <Table
              rows={filteredExpenses}
              type="expense"
            />
          </Card>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Components
// ─────────────────────────────────────────────────────────────

function Card({ title, children }) {
  return (
    <div style={styles.card}>
      <h3 style={styles.cardTitle}>{title}</h3>
      {children}
    </div>
  )
}

function KpiCard({ title, value, color }) {
  return (
    <div style={styles.kpiCard}>
      <div style={styles.kpiTitle}>{title}</div>

      <div
        style={{
          ...styles.kpiValue,
          color,
        }}
      >
        {value}
      </div>
    </div>
  )
}

function Table({ rows, type }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th>Date</th>
            <th>Flat</th>
            <th>Title</th>
            <th>Category</th>
            <th>Amount</th>
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={5}
                style={{ padding: 20 }}
              >
                No records found
              </td>
            </tr>
          ) : (
            rows.map((r) => (
              <tr key={r.id}>
                <td>{r.date}</td>

                <td>{r.flat_no || '-'}</td>

                <td>{r.title}</td>

                <td>{r.category}</td>

                <td
                  style={{
                    color:
                      type === 'income'
                        ? '#16a34a'
                        : '#dc2626',

                    fontWeight: 700,
                  }}
                >
                  ₹{fmt(r.amount)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────

const styles = {
  app: {
    background: '#f1f5f9',
    minHeight: '100vh',
    fontFamily: 'Inter, sans-serif',
  },

  header: {
    background: '#0f172a',
    padding: 20,
    color: 'white',
  },

  headerTop: {
    marginBottom: 20,
  },

  smallText: {
    color: '#94a3b8',
    fontSize: 12,
  },

  title: {
    margin: 0,
    fontSize: 32,
    fontWeight: 800,
  },

  body: {
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },

  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
  },

  kpiCard: {
    background: 'white',
    borderRadius: 16,
    padding: 16,
  },

  kpiTitle: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 8,
  },

  kpiValue: {
    fontSize: 24,
    fontWeight: 800,
  },

  tabs: {
    display: 'flex',
    gap: 8,
    marginTop: 20,
  },

  tabBtn: {
    border: 'none',
    padding: '10px 16px',
    borderRadius: 10,
    background: '#1e293b',
    color: '#94a3b8',
    cursor: 'pointer',
    fontWeight: 600,
  },

  activeTab: {
    background: 'white',
    color: '#0f172a',
  },

  card: {
    background: 'white',
    borderRadius: 20,
    padding: 20,
  },

  cardTitle: {
    marginTop: 0,
    marginBottom: 16,
    fontSize: 18,
  },

  grid2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
  },

  filters: {
    display: 'flex',
    gap: 10,
    marginBottom: 16,
  },

  input: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    border: '1px solid #cbd5e1',
  },

  select: {
    padding: 10,
    borderRadius: 10,
    border: '1px solid #cbd5e1',
  },

  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },

  center: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: 'Inter, sans-serif',
  },
}