import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabaseClient";

import {
  LayoutDashboard,
  Wallet,
  TrendingUp,
  TrendingDown,
  Settings,
  Search,
  FileText,
  Phone,
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
  const [transactions, setTransactions] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [month, setMonth] =
    useState("");

  const [activePage, setActivePage] =
    useState("dashboard");

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

  const filtered = useMemo(() => {
    return transactions.filter((row) => {
      const text = Object.values(row)
        .join(" ")
        .toLowerCase();

      return (
        (!search ||
          text.includes(
            search.toLowerCase()
          )) &&
        (!month ||
          row.date?.includes(
            `-${month}-`
          ))
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
    (a, b) =>
      a + Number(b.amount || 0),
    0
  );

  const totalExpense = expenses.reduce(
    (a, b) =>
      a + Number(b.amount || 0),
    0
  );

  const balance =
    totalIncome - totalExpense;

  const lineData = {
    labels: MONTHS.slice(-6).map(
      ([, l]) => l.slice(0, 3)
    ),

    datasets: [
      {
        label: "Income",

        data: MONTHS.slice(-6).map(
          ([m]) =>
            income
              .filter((r) =>
                r.date?.includes(
                  `-${m}-`
                )
              )
              .reduce(
                (a, b) =>
                  a +
                  Number(
                    b.amount || 0
                  ),
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

        data: MONTHS.slice(-6).map(
          ([m]) =>
            expenses
              .filter((r) =>
                r.date?.includes(
                  `-${m}-`
                )
              )
              .reduce(
                (a, b) =>
                  a +
                  Number(
                    b.amount || 0
                  ),
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
        data: Object.values(
          expenseMap
        ),

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
                icon={
                  <LayoutDashboard
                    size={18}
                  />
                }
                label="Dashboard"
                active={
                  activePage ===
                  "dashboard"
                }
                onClick={() =>
                  setActivePage(
                    "dashboard"
                  )
                }
              />

              <SidebarItem
                icon={
                  <Wallet size={18} />
                }
                label="Pay Now"
                active={
                  activePage ===
                  "paynow"
                }
                onClick={() =>
                  setActivePage(
                    "paynow"
                  )
                }
              />

              <SidebarItem
                icon={
                  <FileText
                    size={18}
                  />
                }
                label="Society Rules"
                active={
                  activePage ===
                  "rules"
                }
                onClick={() =>
                  setActivePage(
                    "rules"
                  )
                }
              />

              <SidebarItem
                icon={
                  <Phone size={18} />
                }
                label="Contact"
                active={
                  activePage ===
                  "contact"
                }
                onClick={() =>
                  setActivePage(
                    "contact"
                  )
                }
              />

              <SidebarItem
                icon={
                  <Settings
                    size={18}
                  />
                }
                label="Settings"
                active={
                  activePage ===
                  "settings"
                }
                onClick={() =>
                  setActivePage(
                    "settings"
                  )
                }
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
          {/* DASHBOARD */}

          {activePage ===
            "dashboard" && (
            <>
              <div className="topbar">
                <div>
                  <div className="eyebrow">
                    FINANCE OVERVIEW
                  </div>

                  <div className="title">
                    Balance Sheet
                  </div>
                </div>
              </div>

              {/* KPI */}

              <div className="kpiGrid">
                <Kpi
                  icon={
                    <TrendingUp
                      size={18}
                    />
                  }
                  label="Income"
                  value={`₹${fmt(
                    totalIncome
                  )}`}
                  green
                />

                <Kpi
                  icon={
                    <TrendingDown
                      size={18}
                    />
                  }
                  label="Expense"
                  value={`₹${fmt(
                    totalExpense
                  )}`}
                  red
                />

                <Kpi
                  icon={
                    <Wallet
                      size={18}
                    />
                  }
                  label="Balance"
                  value={`₹${fmt(
                    balance
                  )}`}
                  blue
                />
              </div>

              {/* TABLE */}

              <div className="tableCard">
                <div className="tableHeader">
                  <div>
                    <div className="tableTitle">
                      Transactions
                    </div>

                    <div className="tableSub">
                      Monthly overview
                      of all
                      transactions
                    </div>
                  </div>

                  <div className="filters">
                    <div className="search">
                      <Search
                        size={15}
                      />

                      <input
                        placeholder="Search transactions..."
                        value={
                          search
                        }
                        onChange={(
                          e
                        ) =>
                          setSearch(
                            e.target
                              .value
                          )
                        }
                      />
                    </div>

                    <select
                      value={month}
                      onChange={(
                        e
                      ) =>
                        setMonth(
                          e.target
                            .value
                        )
                      }
                    >
                      <option value="">
                        All Months
                      </option>

                      {MONTHS.map(
                        ([v, l]) => (
                          <option
                            key={v}
                            value={
                              v
                            }
                          >
                            {l}
                          </option>
                        )
                      )}
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
                      {filtered.map(
                        (r) => (
                          <tr
                            key={
                              r.id
                            }
                          >
                            <td>
                              <div className="date">
                                {new Date(
                                  r.date
                                )
                                  .toLocaleDateString(
                                    "en-GB",
                                    {
                                      day: "2-digit",
                                      month:
                                        "short",
                                    }
                                  )
                                  .replace(
                                    ",",
                                    ""
                                  )}
                              </div>
                            </td>

                            <td>
                              <div className="flat">
                                {r.flat_no ||
                                  "-"}
                              </div>
                            </td>

                            <td>
                              <span className="category">
                                {
                                  r.category
                                }
                              </span>
                            </td>

                            <td>
                              <span
                                className={`status ${r.type}`}
                              >
                                {
                                  r.type
                                }
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
                                {fmt(
                                  r.amount
                                )}
                              </span>
                            </td>
                          </tr>
                        )
                      )}
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
                      data={
                        lineData
                      }
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
                    Expense
                    Breakdown
                  </div>

                  <div className="chartWrap">
                    <Doughnut
                      data={
                        pieData
                      }
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* PAY NOW */}

          {activePage ===
            "paynow" && (
            <div className="payNowPage">
              <div className="pageHeading">
                <h1>
                  Pay Maintenance
                </h1>

                <p>
                  Securely pay
                  your monthly
                  society
                  maintenance
                  using QR
                  payment or
                  direct bank
                  transfer.
                </p>
              </div>

              <div className="payGrid">
                <div className="payCard">
                  <div className="payCardTitle">
                    Scan & Pay
                  </div>

                  <div className="qrWrapper">
                    <img
                      src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=GreenMeadowsMaintenance"
                      alt="QR"
                    />
                  </div>

                  <div className="paySub">
                    UPI ID:
                    greenmeadows@upi
                  </div>
                </div>

                <div className="payCard">
                  <div className="payCardTitle">
                    Bank Details
                  </div>

                  <div className="bankList">
                    <div className="bankRow">
                      <span>
                        Account
                        Name
                      </span>

                      <strong>
                        Green
                        Meadows
                        Society
                      </strong>
                    </div>

                    <div className="bankRow">
                      <span>
                        Bank
                        Name
                      </span>

                      <strong>
                        HDFC
                        Bank
                      </strong>
                    </div>

                    <div className="bankRow">
                      <span>
                        Account
                        Number
                      </span>

                      <strong>
                        50100234567891
                      </strong>
                    </div>

                    <div className="bankRow">
                      <span>
                        IFSC
                        Code
                      </span>

                      <strong>
                        HDFC0001234
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="noticeCard">
                ⚠ Kindly
                complete the
                maintenance
                payment before
                the 10th of
                every month to
                avoid late
                charges.
              </div>
            </div>
          )}

          {/* RULES */}

          {activePage ===
            "rules" && (
            <div className="pageCard">
              <h1>
                Society Rules
              </h1>

              <p className="rulesText">
                Please follow
                society
                guidelines to
                maintain a
                peaceful and
                clean
                environment.
              </p>

              <ul className="rulesList">
                <li>
                  Maintenance
                  payment
                  before 10th
                  of every
                  month.
                </li>

                <li>
                  No loud noise
                  after 10 PM.
                </li>

                <li>
                  Keep common
                  areas clean.
                </li>

                <li>
                  Visitor
                  parking only
                  in designated
                  areas.
                </li>
              </ul>

              <div className="pdfCard">
                <div>
                  <div className="pdfTitle">
                    Society Rule
                    Book
                  </div>

                  <div className="pdfSub">
                    View or
                    download
                    official
                    PDF.
                  </div>
                </div>

                <a
                  href="/society-rules.pdf"
                  target="_blank"
                  rel="noreferrer"
                  className="pdfBtn"
                >
                  View PDF
                </a>
              </div>
            </div>
          )}

          {/* CONTACT */}

          {activePage ===
            "contact" && (
            <div className="pageCard">
              <h1>Contact</h1>

              <div className="contactBox">
                <p>
                  📞 +91
                  9876543210
                </p>

                <p>
                  📧
                  support@greenmeadows.com
                </p>

                <p>
                  🕒 9 AM - 6
                  PM
                </p>
              </div>
            </div>
          )}

          {/* SETTINGS */}

          {activePage ===
            "settings" && (
            <div className="pageCard">
              <h1>Settings</h1>

              <p>
                Settings page
                content goes
                here.
              </p>
            </div>
          )}

          {/* MOBILE NAV */}

          <div className="mobileNav">
            <div
              className={`mobileItem ${
                activePage ===
                "dashboard"
                  ? "mobileActive"
                  : ""
              }`}
              onClick={() =>
                setActivePage(
                  "dashboard"
                )
              }
            >
              <LayoutDashboard
                size={20}
              />
              <span>
                Dashboard
              </span>
            </div>

            <div
              className={`mobileItem ${
                activePage ===
                "paynow"
                  ? "mobileActive"
                  : ""
              }`}
              onClick={() =>
                setActivePage(
                  "paynow"
                )
              }
            >
              <Wallet size={20} />
              <span>Pay</span>
            </div>

            <div
              className={`mobileItem ${
                activePage ===
                "rules"
                  ? "mobileActive"
                  : ""
              }`}
              onClick={() =>
                setActivePage(
                  "rules"
                )
              }
            >
              <FileText
                size={20}
              />
              <span>Rules</span>
            </div>

            <div
              className={`mobileItem ${
                activePage ===
                "contact"
                  ? "mobileActive"
                  : ""
              }`}
              onClick={() =>
                setActivePage(
                  "contact"
                )
              }
            >
              <Phone size={20} />
              <span>
                Contact
              </span>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

function Kpi({
  icon,
  label,
  value,
  green,
  red,
  blue,
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
              : "blue"
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

function SidebarItem({
  icon,
  label,
  active,
  onClick,
}) {
  return (
    <div
      onClick={onClick}
      className={`sideItem ${
        active
          ? "sideActive"
          : ""
      }`}
    >
      {icon}
      {label}
    </div>
  );
}

const css = `
*{
  margin:0;
  padding:0;
  box-sizing:border-box;
}

body{
  font-family:Inter,sans-serif;
  background:#0F172A;
  color:#E2E8F0;
}

.layout{
  display:grid;
  grid-template-columns:280px 1fr;
  min-height:100vh;
}

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

.main{
  padding:32px;
  overflow:auto;
}

.topbar{
  margin-bottom:28px;
}

.eyebrow{
  color:#64748B;
  font-size:12px;
}

.title{
  font-size:42px;
  font-weight:800;
  margin-top:8px;
}

.kpiGrid{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:16px;
}

.kpi,
.card,
.tableCard,
.pageCard{
  background:rgba(255,255,255,.05);
  border:1px solid rgba(255,255,255,.06);
  border-radius:28px;
  padding:24px;
}

.kpiTop{
  display:flex;
  justify-content:space-between;
}

.kpiValue{
  margin-top:0;
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
  padding:14px 18px;
  border-radius:18px;
}

.search input{
  background:none;
  border:none;
  outline:none;
  color:white;
  width:100%;
}

select{
  background:#111827;
  border:none;
  color:white;
  border-radius:18px;
  padding:14px;
}

.tableWrap{
  overflow:auto;
}

.modernTable{
  width:100%;
  border-collapse:separate;
  border-spacing:0 8px;
}

.modernTable tbody tr{
  background:rgba(255,255,255,.04);
}

.modernTable td,
.modernTable th{
  padding:18px;
}

.chartGrid{
  display:grid;
  grid-template-columns:2fr 1fr;
  gap:24px;
  margin-top:28px;
}

.chartWrap{
  height:320px;
  margin-top:20px;
}

.status{
  padding:8px 14px;
  border-radius:999px;
  font-size:14px;
}

.status.income{
  background:rgba(34,197,94,.15);
  color:#22C55E;
}

.status.expense{
  background:rgba(239,68,68,.15);
  color:#EF4444;
}

.amount{
  font-weight:700;
}

.greenText{
  color:#22C55E;
}

.redText{
  color:#EF4444;
}

.payNowPage{
  margin-top:20px;
}

.pageHeading h1{
  font-size:40px;
  font-weight:800;
}

.pageHeading p{
  color:#94A3B8;
  margin-top:10px;
  line-height:1.7;
}

.payGrid{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:24px;
  margin-top:28px;
}

.payCard{
  background:rgba(255,255,255,.05);
  border:1px solid rgba(255,255,255,.06);
  border-radius:30px;
  padding:30px;
}

.payCardTitle{
  font-size:22px;
  font-weight:700;
  margin-bottom:24px;
}

.qrWrapper{
  background:white;
  border-radius:24px;
  padding:20px;
  display:flex;
  justify-content:center;
}

.qrWrapper img{
  width:220px;
}

.paySub{
  margin-top:20px;
  text-align:center;
}

.bankList{
  display:flex;
  flex-direction:column;
  gap:18px;
}

.bankRow{
  display:flex;
  justify-content:space-between;
  gap:20px;
  padding-bottom:14px;
  border-bottom:1px solid rgba(255,255,255,.06);
}

.noticeCard{
  margin-top:28px;
  background:rgba(245,158,11,.12);
  border:1px solid rgba(245,158,11,.25);
  color:#FCD34D;
  padding:22px 24px;
  border-radius:22px;
  line-height:1.8;
}

.rulesText{
  margin-top:14px;
  color:#94A3B8;
  line-height:1.8;
}

.rulesList{
  margin-top:20px;
  padding-left:20px;
  line-height:2;
}

.pdfCard{
  margin-top:32px;
  background:rgba(255,255,255,.04);
  border:1px solid rgba(255,255,255,.06);
  border-radius:24px;
  padding:24px;
  display:flex;
  justify-content:space-between;
  align-items:center;
}

.pdfBtn{
  background:linear-gradient(
    135deg,
    #3B82F6,
    #8B5CF6
  );
  color:white;
  text-decoration:none;
  padding:14px 22px;
  border-radius:16px;
  font-weight:700;
}

.contactBox{
  margin-top:20px;
  display:flex;
  flex-direction:column;
  gap:16px;
}

.mobileNav{
  display:none;
}

.loader{
  height:100vh;
  display:flex;
  align-items:center;
  justify-content:center;
}

@media(max-width:1200px){

  .layout{
    grid-template-columns:1fr;
  }

  .sidebar{
    display:none;
  }
}

@media(max-width:768px){

  body{
    padding-bottom:90px;
  }

  .main{
    padding:18px;
  }

  .title{
    font-size:30px;
  }

  .tableHeader{
    flex-direction:column;
    align-items:flex-start;
    gap:18px;
  }

  .filters{
    width:100%;
    flex-direction:column;
    gap:12px;
  }

  .search{
    width:100%;
  }

  select{
    width:100%;
  }

  .kpiGrid,
  .chartGrid,
  .payGrid{
    grid-template-columns:1fr;
  }

  .modernTable{
    min-width:650px;
  }

  .pdfCard{
    flex-direction:column;
    align-items:flex-start;
    gap:18px;
  }

  .mobileNav{
    position:fixed;
    bottom:0;
    left:0;
    width:100%;
    height:74px;
    background:#111827;
    border-top:1px solid rgba(255,255,255,.08);
    display:flex;
    justify-content:space-around;
    align-items:center;
    z-index:999;
  }

  .mobileItem{
    display:flex;
    flex-direction:column;
    align-items:center;
    gap:6px;
    color:#94A3B8;
    font-size:11px;
    cursor:pointer;
  }

  .mobileActive{
    color:white;
  }
}
`;