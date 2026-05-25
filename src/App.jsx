import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabaseClient";

import {
  LayoutDashboard,
  Wallet,
  TrendingUp,
  TrendingDown,
  Landmark,
  PieChart,
  Settings,
  Search,
  Bell,
  Plus,
} from "lucide-react";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

import { Line, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

const MONTHS = [
  ["01", "January"],
  ["02", "February"],
  ["03", "March"],
  ["04", "April"],
  ["05", "May"],
  ["06", "June"],
  ["07", "July"],
  ["08", "August"],
  ["09", "September"],
  ["10", "October"],
  ["11", "November"],
  ["12", "December"],
];

const fmt = (n) =>
  new Intl.NumberFormat("en-IN").format(Number(n || 0));

export default function App() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [month, setMonth] = useState("");

  // ─────────────────────────────────────────────
  // FETCH
  // ─────────────────────────────────────────────

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("transactions")
        .select("*")
        .order("date", {
          ascending: false,
        });

      setTransactions(data || []);
      setLoading(false);
    };

    load();
  }, []);

  // ─────────────────────────────────────────────
  // FILTER
  // ─────────────────────────────────────────────

  const filtered = useMemo(() => {
    return transactions.filter((row) => {
      const text = Object.values(row)
        .join(" ")
        .toLowerCase();

      return (
        (!search ||
          text.includes(search.toLowerCase())) &&
        (!month ||
          row.date?.includes(`-${month}-`))
      );
    });
  }, [transactions, search, month]);

  const income = transactions.filter(
    (x) => x.type === "income"
  );

  const expenses = transactions.filter(
    (x) => x.type === "expense"
  );

  const totalIncome = income.reduce(
    (a, b) => a + Number(b.amount || 0),
    0
  );

  const totalExpense = expenses.reduce(
    (a, b) => a + Number(b.amount || 0),
    0
  );

  const balance = totalIncome - totalExpense;

  // ─────────────────────────────────────────────
  // CHARTS
  // ─────────────────────────────────────────────

  const lineData = {
    labels: MONTHS.slice(-6).map(([, l]) =>
      l.slice(0, 3)
    ),

    datasets: [
      {
        label: "Income",

        data: MONTHS.slice(-6).map(([m]) =>
          income
            .filter((r) =>
              r.date?.includes(`-${m}-`)
            )
            .reduce(
              (a, b) =>
                a + Number(b.amount || 0),
              0
            )
        ),

        borderColor: "#22c55e",
        backgroundColor:
          "rgba(34,197,94,.08)",

        fill: true,
        tension: 0.4,
      },

      {
        label: "Expense",

        data: MONTHS.slice(-6).map(([m]) =>
          expenses
            .filter((r) =>
              r.date?.includes(`-${m}-`)
                  )


            .reduce(
              (a, b) =>
                a + Number(b.amount || 0),
              0
            )
        ),

        borderColor: "#ef4444",
        backgroundColor:
          "rgba(239,68,68,.08)",

        fill: true,
        tension: 0.4,
      },
    ],
  };

  const expenseMap = expenses.reduce(
    (acc, item) => {
      acc[item.category] =
        (acc[item.category] || 0) +
        Number(item.amount);

      return acc;
    },
    {}
  );

  const pieData = {
    labels: Object.keys(expenseMap),

    datasets: [
      {
        data: Object.values(expenseMap),

        backgroundColor: [
          "#3B82F6",
          "#8B5CF6",
          "#22C55E",
          "#F97316",
          "#EF4444",
          "#14B8A6",
        ],
      },
    ],
  };

  if (loading) {
    return (
      <div className="loader">
        Loading dashboard...
      </div>
    );
  }

  return (
    <>
      <style>{css}</style>

      <div className="layout">
        {/* SIDEBAR */}

        <aside className="sidebar">
          <div>
            <div className="brand">
              GM
            </div>

            <div className="brandText">
              Green Meadows
            </div>

            <div className="menu">
              <SidebarItem
                icon={<LayoutDashboard size={18} />}
                label="Dashboard"
                active
              />

              <SidebarItem
                icon={<Wallet size={18} />}
                label="Transactions"
              />

              <SidebarItem
                icon={<PieChart size={18} />}
                label="Analytics"
              />

              <SidebarItem
                icon={<Landmark size={18} />}
                label="Finance"
              />

              <SidebarItem
                icon={<Settings size={18} />}
                label="Settings"
              />
            </div>
          </div>

          <div className="profile">
            <div className="avatar">
              GM
            </div>

            <div>
              <div className="profileName">
                Block A
              </div>

              <div className="profileSub">
                Finance Admin
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN */}

        <main className="main">
          {/* TOPBAR */}

          <div className="topbar">
            <div>
              <div className="eyebrow">
                FINANCE OVERVIEW
              </div>

              <div className="title">
                Balance Sheet
              </div>
            </div>
{/*}
            <div className="topActions">
              <button className="iconBtn">
                <Bell size={18} />
              </button>

              <button className="addBtn">
                <Plus size={18} />
                Add Transaction
              </button>
            </div>
*/}
            
          </div>



          {/* KPI */}

          <div className="kpiGrid">
            <Kpi
              icon={<TrendingUp size={18} />}
              label="Income"
              value={`₹${fmt(totalIncome)}`}
              green
            />

            <Kpi
              icon={<TrendingDown size={18} />}
              label="Expense"
              value={`₹${fmt(totalExpense)}`}
              red
            />

            <Kpi
              icon={<Wallet size={18} />}
              label="Balance"
              value={`₹${fmt(balance)}`}
              blue
            />
  {/*}
            <Kpi
              icon={<PieChart size={18} />}
              label="Transactions"
              value={transactions.length}
              purple
            />
          </div>
  */}

                    {/* TABLE */}

          <div className="tableCard">
            <div className="tableHeader">
              <div>
                <div className="tableTitle">
                  Transactions
                </div>

                <div className="tableSub">
                  Monthly overview of all transactions
                </div>
              </div>

              <div className="filters">
                <div className="search">
                  <Search size={15} />

                  <input
                    placeholder="Search transactions..."
                    value={search}
                    onChange={(e) =>
                      setSearch(
                        e.target.value
                      )
                    }
                  />
                </div>

                <select
                  value={month}
                  onChange={(e) =>
                    setMonth(
                      e.target.value
                    )
                  }
                >
                  <option value="">
                    All Months
                  </option>

                  {MONTHS.map(([v, l]) => (
                    <option
                      key={v}
                      value={v}
                    >
                      {l}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="tableWrap">
              <table className="modernTable">
                <thead>
                  <tr>
                    <th>Date</th>                    
                    <th>Flat</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th align="right">
                      Amount
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id}>
                      <td>
{/*}

                        <div className="date">
                          {r.date}
                        </div>
*/}
                        <div className="date">
                          {new Date(r.date)
                            .toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                            })
                            .replace(",", "")}
                        </div>

                      </td>
{/*}
                      <td>
                        <div className="titleCell">
                          {r.title}
                        </div>
                      </td>
*/}
                      <td>
                        <div className="flat">
                          {r.flat_no ||
                            "-"}
                        </div>
                      </td>

                      <td>
                        <span className="category">
                          {r.category}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`status ${
                            r.type
                          }`}
                        >
                          {r.type}
                        </span>
                      </td>

                      <td align="right">
                        <span
                          className={`amount ${
                            r.type ===
                            "income"
                              ? "greenText"
                              : "redText"
                          }`}
                        >
                          ₹
                          {fmt(r.amount)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* CHARTS */}

          <div className="chartGrid">
            <div className="card">
              <div className="cardTitle">
                Financial Trend
              </div>

              <div className="chartWrap">
                <Line
                  data={lineData}
                  options={{
                    responsive: true,
                    maintainAspectRatio:
                      false,
                  }}
                />
              </div>
            </div>

            <div className="card">
              <div className="cardTitle">
                Expense Breakdown
              </div>

              <div className="chartWrap">
                <Doughnut data={pieData} />
              </div>
            </div>
          </div>


        </main>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────
// KPI
// ─────────────────────────────────────────────

function Kpi({
  icon,
  label,
  value,
  green,
  red,
  blue,
  purple,
}) {
  return (
    <div className="kpi">
      <div className="kpiTop">
        <div>{label}</div>

        <div
          className={`kpiIcon ${
            green
              ? "green"
              : red
              ? "red"
              : blue
              ? "blue"
              : "purple"
          }`}
        >
          {icon}
        </div>
      </div>

      <div className="kpiValue">
        {value}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SIDEBAR ITEM
// ─────────────────────────────────────────────

function SidebarItem({
  icon,
  label,
  active,
}) {
  return (
    <div
      className={`sideItem ${
        active ? "sideActive" : ""
      }`}
    >
      {icon}
      {label}
    </div>
  );
}

// ─────────────────────────────────────────────
// CSS
// ─────────────────────────────────────────────

const css = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

*{
  margin:0;
  padding:0;
  box-sizing:border-box;
}

body{
  font-family:'Inter',sans-serif;
  background:#0F172A;
  color:#E2E8F0;
}

.layout{
  display:grid;
  grid-template-columns:280px 1fr;
  min-height:100vh;
}

/* SIDEBAR */

.sidebar{
  background:#111827;
  border-right:1px solid rgba(255,255,255,.06);
  padding:28px;
  display:flex;
  flex-direction:column;
  justify-content:space-between;
}

.brand{
  width:52px;
  height:52px;
  border-radius:18px;
  background:linear-gradient(135deg,#3B82F6,#8B5CF6);
  display:flex;
  align-items:center;
  justify-content:center;
  font-weight:800;
  font-size:18px;
}

.brandText{
  margin-top:16px;
  font-size:24px;
  font-weight:800;
}

.menu{
  margin-top:40px;
  display:flex;
  flex-direction:column;
  gap:10px;
}

.sideItem{
  display:flex;
  align-items:center;
  gap:14px;
  padding:14px 18px;
  border-radius:16px;
  color:#94A3B8;
  cursor:pointer;
  transition:.2s;
}

.sideItem:hover{
  background:rgba(255,255,255,.05);
}

.sideActive{
  background:linear-gradient(
    135deg,
    rgba(59,130,246,.2),
    rgba(139,92,246,.2)
  );
  color:white;
}

.profile{
  display:flex;
  align-items:center;
  gap:14px;
  background:rgba(255,255,255,.04);
  padding:16px;
  border-radius:20px;
}

.avatar{
  width:44px;
  height:44px;
  border-radius:14px;
  background:#3B82F6;
  display:flex;
  align-items:center;
  justify-content:center;
  font-weight:700;
}

.profileName{
  font-weight:700;
}

.profileSub{
  color:#94A3B8;
  font-size:13px;
  margin-top:2px;
}

/* MAIN */

.main{
  padding:32px;
  overflow:auto;
}

.topbar{
  display:flex;
  justify-content:space-between;
  align-items:center;
}

.eyebrow{
  color:#64748B;
  font-size:12px;
  letter-spacing:.08em;
}

.title{
  font-size:42px;
  font-weight:800;
  margin-top:8px;
}

.topActions{
  display:flex;
  gap:14px;
}

.iconBtn{
  width:50px;
  height:50px;
  border:none;
  border-radius:18px;
  background:#1E293B;
  color:white;
  cursor:pointer;
}

.addBtn{
  height:50px;
  padding:0 22px;
  border:none;
  border-radius:18px;
  background:linear-gradient(
    135deg,
    #3B82F6,
    #8B5CF6
  );
  color:white;
  font-weight:700;
  display:flex;
  align-items:center;
  gap:10px;
  cursor:pointer;
}

/* KPI */

.kpiGrid{
  display:grid;
  grid-template-columns:repeat(4,1fr);
  gap:16px;
  margin-top:28px;
}

.kpi{
  background:rgba(255,255,255,.05);
  border:1px solid rgba(255,255,255,.06);
  backdrop-filter:blur(16px);
  border-radius:28px;
  padding:24px;
}

.kpiTop{
  display:flex;
  justify-content:space-between;
  color:#94A3B8;
}

.kpiValue{  
  font-size:32px;
  font-weight:800;
}

.kpiIcon{
  width:42px;
  height:42px;
  border-radius:14px;
  display:flex;
  align-items:center;
  justify-content:center;
}

.green{
  background:rgba(34,197,94,.15);
  color:#22C55E;
}

.red{
  background:rgba(239,68,68,.15);
  color:#EF4444;
}

.blue{
  background:rgba(59,130,246,.15);
  color:#3B82F6;
}

.purple{
  background:rgba(139,92,246,.15);
  color:#8B5CF6;
}

/* CARDS */

.chartGrid{
  display:grid;
  grid-template-columns:2fr 1fr;
  gap:24px;
  margin-top:28px;
}

.card,
.tableCard{
  background:rgba(255,255,255,.05);
  border:1px solid rgba(255,255,255,.06);
  backdrop-filter:blur(18px);
  border-radius:30px;
  padding:28px;
}

.cardTitle{
  font-size:20px;
  font-weight:700;
}

.chartWrap{
  height:320px;
  margin-top:24px;
}

/* TABLE */

.tableCard{
  margin-top:28px;
}

.tableHeader{
  display:flex;
  justify-content:space-between;
  align-items:center;
  margin-bottom:24px;
}

.tableTitle{
  font-size:24px;
  font-weight:800;
}

.tableSub{
  color:#94A3B8;
  margin-top:6px;
}

.filters{
  display:flex;
  gap:14px;
}

.search{
  display:flex;
  align-items:center;
  gap:10px;
  background:#111827;
  border:1px solid rgba(255,255,255,.06);
  padding:14px 18px;
  border-radius:18px;
  width:280px;
}

.search input{
  background:none;
  border:none;
  outline:none;
  color:white;
  width:100%;
  font-family:inherit;
}

select{
  background:#111827;
  border:1px solid rgba(255,255,255,.06);
  color:white;
  border-radius:18px;
  padding:18px;
  outline:none;
  font-family:inherit;
}

.tableWrap{
  overflow:auto;
}

.modernTable{
  width:100%;
  border-collapse:separate;
  border-spacing:0 14px;
}

.modernTable thead th{
  color:#64748B;
  font-size:12px;
  text-transform:uppercase;
  padding:0 18px;
  text-align:left;
}

.modernTable tbody tr{
  background:rgba(255,255,255,.04);
  transition:.2s;
}

.modernTable tbody tr:hover{
  transform:translateY(-2px);
  background:rgba(255,255,255,.07);
}

.modernTable td{
  padding:22px 18px;
}

.modernTable tr td:first-child{
  border-radius:20px 0 0 20px;
}

.modernTable tr td:last-child{
  border-radius:0 20px 20px 0;
}

.date{
  color:#CBD5E1;
  font-weight:400;
  font-size:12px;
  white-space: nowrap;
}

.titleCell{
  font-weight:400;
  font-size:12px;
  white-space: nowrap;
}

.flat{
  color:#CBD5E1;
  font-size:12px;
  font-weight:400;
  white-space: nowrap;
}

.category{  
  color:#CBD5E1;
  font-size:12px;
  font-weight:400;
  white-space: nowrap;
}

.status{
  padding:8px 14px;
  border-radius:999px;
  font-size:12px;
  font-weight:400;
  text-transform:capitalize;
}

.status.income{
  background:rgba(34,197,94,.15);
  color:#22C55E;
  white-space: nowrap;
}

.status.expense{
  background:rgba(239,68,68,.15);
  color:#EF4444;
}

.amount{
  font-weight:800;
  font-size:14px;
  white-space: nowrap;
}

.greenText{
  color:#22C55E;
}

.redText{
  color:#EF4444;
}

.loader{
  height:100vh;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:20px;
}

/* RESPONSIVE */

@media(max-width:1200px){

  .layout{
    grid-template-columns:1fr;
  }

  .sidebar{
    display:none;
  }

  .kpiGrid{
    grid-template-columns:1fr 1fr;
  }

  .chartGrid{
    grid-template-columns:1fr;
  }
}

@media(max-width:768px){

  .main{
    padding:20px;
  }

  .topbar{
    flex-direction:column;
    align-items:flex-start;
    gap:20px;
  }

  .kpiGrid{
    grid-template-columns:1fr;
  }

  .tableHeader{
    flex-direction:column;
    align-items:flex-start;
    gap:20px;
  }

  .filters{
    width:100%;
    flex-direction:column;
  }

  .search{
    width:100%;
  }

  .title{
    font-size:32px;
  }
}
`;