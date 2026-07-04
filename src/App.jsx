import React, { useEffect, useMemo, useState, useCallback, createContext, useContext } from "react";
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
  History,
  Table,
  LayoutGrid,
  Zap,
  RefreshCw,
  CheckCircle,
  Save,
  Pencil,
  Loader2,
  PiggyBank,
  ArrowUpCircle,
  ArrowDownCircle,
  ClipboardList,
  Sun,
  Moon,
} from "lucide-react";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

import { Line, Doughnut, Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
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

const fmt = (n) => new Intl.NumberFormat("en-IN").format(Number(n || 0));
const ThemeContext = createContext(true);
const useTheme = () => useContext(ThemeContext);

// ── Generate all 55 flat IDs (101–111, 201–211, ... 501–511) ──────────────
const TOTAL_FLATS = 55;

function generateFlatIds() {
  const list = [];
  for (let floor = 1; floor <= 5; floor++) {
    for (let unit = 1; unit <= 11; unit++) {
      list.push(`${floor}${String(unit).padStart(2, "0")}`);
    }
  }
  return list; // 55 flats: 101,102...111, 201...511
}

const ALL_FLAT_IDS = generateFlatIds();

// ── Current month key e.g. "2025-06" ──────────────────────────────────────
function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// ─── ElectricityTracker component ─────────────────────────────────────────
function ElectricityTracker() {
  const dark = useTheme();
  const [dbRows, setDbRows] = useState({});
  const [loadingPage, setLoadingPage] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState(currentMonth());

  const [expanded, setExpanded] = useState(null);
  const [formData, setFormData] = useState({ amount: "", usn: "" });
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  // ── Load records for selected month from Supabase ────────────────────
  const loadData = useCallback(async () => {
    setLoadingPage(true);
    const { data, error } = await supabase
      .from("electricity_payments")
      .select("*")
      .eq("month", selectedMonth);

    if (error) {
      console.error("Load error:", error);
    } else {
      const map = {};
      (data || []).forEach((r) => { map[r.flat_no] = r; });
      setDbRows(map);
    }
    setLoadingPage(false);
  }, [selectedMonth]);

  useEffect(() => { loadData(); }, [loadData]);

  const flats = useMemo(() => {
    return ALL_FLAT_IDS.map((id) => {
      const row = dbRows[id];
      return {
        id,
        paid: row ? row.paid : false,
        amount: row ? row.amount : "",
        usn: row ? row.usn : "",
        dbId: row ? row.id : null,
      };
    });
  }, [dbRows]);

  const paidCount = flats.filter((f) => f.paid).length;
  const pendingCount = TOTAL_FLATS - paidCount;
  const pct = Math.round((paidCount / TOTAL_FLATS) * 100);

  const visible = useMemo(() => {
    return flats.filter((f) => {
      if (search && !f.id.toLowerCase().includes(search.toLowerCase())) return false;
      if (filter === "paid" && !f.paid) return false;
      if (filter === "pending" && f.paid) return false;
      return true;
    });
  }, [flats, search, filter]);

  function handleEdit(flatId) {
    const flat = flats.find((f) => f.id === flatId);
    setExpanded(flatId);
    setFormData({ amount: flat.amount || "", usn: flat.usn || "" });
    setErrorMsg("");
  }

  function handleCancel() {
    setExpanded(null);
    setFormData({ amount: "", usn: "" });
    setErrorMsg("");
  }

  async function handleSave(flatId) {
    if (!formData.amount.toString().trim() || !formData.usn.trim()) return;
    setSaving(true);
    setErrorMsg("");

    const payload = {
      flat_no: flatId,
      amount: parseFloat(formData.amount),
      usn: formData.usn.trim(),
      paid: true,
      month: selectedMonth,
      updated_at: new Date().toISOString(),
    };

    const flat = flats.find((f) => f.id === flatId);
    let error;

    if (flat.dbId) {
      ({ error } = await supabase
        .from("electricity_payments")
        .update(payload)
        .eq("id", flat.dbId));
    } else {
      ({ error } = await supabase
        .from("electricity_payments")
        .insert(payload));
    }

    setSaving(false);

    if (error) {
      console.error("Save error:", error);
      setErrorMsg("Failed to save. Please try again.");
      return;
    }

    await loadData();
    setExpanded(null);
    setFormData({ amount: "", usn: "" });
    setSavedFlash(flatId);
    setTimeout(() => setSavedFlash(null), 2000);
  }

  const canSave =
    formData.amount.toString().trim() !== "" &&
    formData.usn.trim() !== "";

  if (loadingPage) {
    return (
      <div className="elecLoader">
        <Loader2 size={28} className="spin" />
        <span>Loading electricity data...</span>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="topbar">
        <div className="eyebrow">Green Meadows : Block A</div>
        <div className="title" style={{ display: "flex", alignItems: "center", gap: 14 }}>
          Electricity Tracker
          <span className="elecMonthBadge">{selectedMonth}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="kpiGrid" style={{ marginBottom: 16 }}>
        <Kpi icon={<Zap size={18} />}         label="Total Flats" value={TOTAL_FLATS} blue />
        <Kpi icon={<CheckCircle size={18} />} label="Paid"        value={paidCount}   green />
        <Kpi icon={<Zap size={18} />}         label="Pending"     value={pendingCount} red />
      </div>

      {/* Progress bar */}
      <div className="elecProgressWrap">
        <div className="elecProgressFill" style={{ width: `${pct}%` }} />
        <span className="elecProgressLabel">{pct}% collected</span>
      </div>

      {/* Controls */}
      <div className="elecControls">
        {/* Row 1: search + month select + filter + refresh */}
        <div className="elecControlsRow">
          <div className="search" style={{ flex: 1 }}>
            <Search size={15} />
            <input
              placeholder="Search flat number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Month selector */}
          <select
            className="elecMonthSelect"
            value={selectedMonth}
            onChange={(e) => { setSelectedMonth(e.target.value); setExpanded(null); }}
          >
            {MONTHS.map(([v, l]) => {
              const yr = new Date().getFullYear();
              const key = `${yr}-${v}`;
              return <option key={key} value={key}>{l} {yr}</option>;
            })}
          </select>

          <div className="elecFilterGroup">
            {["all", "paid", "pending"].map((f) => (
              <button
                key={f}
                className={`elecFBtn ${filter === f ? "elecFActive" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          <button className="elecReset" onClick={loadData}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="tableCard" style={{ marginTop: 0 }}>
        {visible.length === 0 ? (
          <div className="elecEmpty">No flats match your search.</div>
        ) : (
          <div className="tableWrap">
            <table className="modernTable">
              <thead>
                <tr>
                  <th>Flat No.</th>
                  <th>Status</th>
                  <th>Amount</th>
                  <th>USN No.</th>
                  <th style={{ textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((f) => (
                  <>
                    {/* Main row — 5 columns */}
                    <tr key={f.id}>
                      <td style={{ fontWeight: 700, color: "white", fontSize: 14 }}>
                        {f.id}
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span className={`status ${f.paid ? "income" : "expense"}`}>
                            {f.paid ? "Paid" : "Pending"}
                          </span>
                          {savedFlash === f.id && (
                            <span className="elecSavedBadge">✓ Saved</span>
                          )}
                        </div>
                      </td>
                      <td style={{ fontWeight: 600, color: f.paid ? "#22C55E" : "#475569" }}>
                        {f.paid ? `₹ ${fmt(f.amount)}` : "—"}
                      </td>
                      <td style={{ color: f.paid ? (dark ? "#CBD5E1" : "#334155") : "#475569" }}>
                        {f.paid ? f.usn : "—"}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {!f.paid && (
                          <button
                            className="elecMarkPaidBtn"
                            onClick={() => handleEdit(f.id)}
                          >
                            Mark as Paid
                          </button>
                        )}
                      </td>
                    </tr>

                    {/* Inline expand form */}
                    {expanded === f.id && (
                      <tr key={`${f.id}-form`} className="elecFormRow">
                        <td colSpan={5}>
                          <div className="elecFormBox">
                            <div className="elecFormTitle">
                              {f.paid ? "Edit" : "Add"} payment details — Flat {f.id}
                            </div>
                            <div className="elecFormFields">
                              <div className="elecField">
                                <label className="elecLabel">Bill Amount (₹)</label>
                                <input
                                  className="elecInput"
                                  type="number"
                                  placeholder="e.g. 1250"
                                  value={formData.amount}
                                  onChange={(e) =>
                                    setFormData((p) => ({ ...p, amount: e.target.value }))
                                  }
                                  autoFocus
                                />
                              </div>
                              <div className="elecField">
                                <label className="elecLabel">USN / Receipt No.</label>
                                <input
                                  className="elecInput"
                                  type="text"
                                  placeholder="e.g. USN2025001"
                                  value={formData.usn}
                                  onChange={(e) =>
                                    setFormData((p) => ({ ...p, usn: e.target.value }))
                                  }
                                />
                              </div>
                            </div>
                            {errorMsg && (
                              <div className="elecError">{errorMsg}</div>
                            )}
                            <div className="elecFormActions">
                              <button
                                className="elecCancelBtn"
                                onClick={handleCancel}
                                disabled={saving}
                              >
                                Cancel
                              </button>
                              <button
                                className={`elecSaveBtn ${canSave && !saving ? "elecSaveActive" : "elecSaveDisabled"}`}
                                onClick={() => handleSave(f.id)}
                                disabled={!canSave || saving}
                              >
                                {saving ? (
                                  <><Loader2 size={13} className="spin" /> Saving...</>
                                ) : (
                                  <><Save size={13} /> Save</>
                                )}
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

// ─── MaintenanceDues component ────────────────────────────────────────────────
function MaintenanceDues() {
  const dark = useTheme();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState(currentMonth());

  const loadData = useCallback(async () => {
    setLoading(true);
    const [yr, mo] = selectedMonth.split("-");
    const from = `${yr}-${mo}-01`;
    const lastDay = new Date(Number(yr), Number(mo), 0).getDate();
    const to = `${yr}-${mo}-${String(lastDay).padStart(2, "0")}`;

    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("type", "income")
      .ilike("category", "%Maintenance%")
      .gte("date", from)
      .lte("date", to)
      .order("date", { ascending: false });

    if (error) console.error("Dues load error:", error);
    else setTransactions(data || []);
    setLoading(false);
  }, [selectedMonth]);

  useEffect(() => { loadData(); }, [loadData]);

  // Detect if flat_no is populated in the data
  const hasFlatNos = transactions.some((t) => t.flat_no);

  // Normalize flat_no: strip "Flat-", "flat ", spaces etc. → plain number string e.g. "309"
  const normFlat = (val) => val ? String(val).replace(/^flat[-\s]*/i, "").trim() : "";

  // Per-flat status map (when flat_no is used)
  const flats = useMemo(() => {
    return ALL_FLAT_IDS.map((id) => {
      const row = transactions.find((t) => t.flat_no && normFlat(t.flat_no) === String(id));
      return {
        id,
        paid: !!row,
        amount: row ? row.amount : null,
        date: row ? row.date : null,
        title: row ? row.title : null,
      };
    });
  }, [transactions]);

  const paidCount      = hasFlatNos ? flats.filter((f) => f.paid).length : transactions.length;
  const pendingCount   = TOTAL_FLATS - paidCount;
  const totalCollected = transactions.reduce((a, t) => a + Number(t.amount || 0), 0);
  const pct            = Math.round((paidCount / TOTAL_FLATS) * 100);

  const visible = useMemo(() => {
    if (hasFlatNos) {
      return flats.filter((f) => {
        const matchSearch = !search || f.id.toLowerCase().includes(search.toLowerCase());
        const matchFilter =
          filter === "all" ||
          (filter === "paid" && f.paid) ||
          (filter === "pending" && !f.paid);
        return matchSearch && matchFilter;
      });
    }
    // fallback: flat_no not used — show raw transactions (all = paid)
    return transactions.filter((t) => {
      const text = `${t.flat_no || ""} ${t.title || ""}`.toLowerCase();
      const matchSearch = !search || text.includes(search.toLowerCase());
      const matchFilter = filter === "all" || filter === "paid";
      return matchSearch && matchFilter;
    });
  }, [flats, transactions, hasFlatNos, search, filter]);

  if (loading) {
    return (
      <div className="elecLoader">
        <Loader2 size={28} className="spin" />
        <span>Loading maintenance dues...</span>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="topbar">
        <div className="eyebrow">Green Meadows : Block A</div>
        <div className="title" style={{ display: "flex", alignItems: "center", gap: 14 }}>
          Maintenance Dues
          <span className="elecMonthBadge">{selectedMonth}</span>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpiGrid" style={{ marginBottom: 16 }}>
        <Kpi icon={<ClipboardList size={18} />} label="Total Flats"    value={TOTAL_FLATS}            blue />
        <Kpi icon={<CheckCircle size={18} />}   label="Paid"           value={paidCount}              green />
        <Kpi icon={<Wallet size={18} />}        label="Pending"        value={pendingCount}           red />
      </div>

      {/* Collected amount + progress */}
      <div className="tableCard" style={{ marginBottom: 16, padding: "14px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ color: dark ? "#94A3B8" : "#64748B", fontSize: 13 }}>Amount Collected this month</span>
          <span style={{ fontWeight: 800, fontSize: 18, color: "#22C55E" }}>₹{fmt(totalCollected)}</span>
        </div>
        <div className="elecProgressWrap">
          <div className="elecProgressFill" style={{ width: `${pct}%` }} />
        </div>
        <span className="elecProgressLabel">{pct}% collected ({paidCount} of {TOTAL_FLATS} flats)</span>
      </div>

      {/* Controls */}
      <div className="elecControls">
        <div className="elecControlsRow">
          <div className="search" style={{ flex: 1 }}>
            <Search size={15} />
            <input
              placeholder="Search flat number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="elecMonthSelect"
            value={selectedMonth}
            onChange={(e) => { setSelectedMonth(e.target.value); }}
          >
            {MONTHS.map(([v, l]) => {
              const yr = new Date().getFullYear();
              const key = `${yr}-${v}`;
              return <option key={key} value={key}>{l} {yr}</option>;
            })}
          </select>
          <div className="elecFilterGroup">
            {["all", "paid", "pending"].map((f) => (
              <button
                key={f}
                className={`elecFBtn ${filter === f ? "elecFActive" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <button className="elecReset" onClick={loadData}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="tableCard" style={{ marginTop: 0 }}>
        {visible.length === 0 ? (
          <div className="elecEmpty">No transactions found for this month.</div>
        ) : (
          <div className="tableWrap">
            <table className="modernTable">
              <thead>
                <tr>
                  <th>{hasFlatNos ? "Flat No." : "#"}</th>
                  <th>{hasFlatNos ? "Status" : "Title"}</th>
                  <th>Date Paid</th>
                  <th style={{ textAlign: "right" }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {hasFlatNos
                  ? visible.map((f) => (
                      <tr key={f.id}>
                        <td style={{ fontWeight: 700, color: dark ? "white" : "#0F172A", fontSize: 14 }}>{f.id}</td>
                        <td>
                          <span className={`status ${f.paid ? "income" : "expense"}`}>
                            {f.paid ? "Paid" : "Pending"}
                          </span>
                        </td>
                        <td style={{ color: f.paid ? (dark ? "#CBD5E1" : "#334155") : "#475569" }}>
                          {f.paid
                            ? new Date(f.date).toLocaleDateString("en-GB", {
                                day: "2-digit", month: "short", year: "numeric",
                              }).replace(",", "")
                            : "—"}
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 700, color: f.paid ? "#22C55E" : "#475569" }}>
                          {f.paid ? `₹${fmt(f.amount)}` : "—"}
                        </td>
                      </tr>
                    ))
                  : visible.map((t, i) => (
                      <tr key={t.id}>
                        <td style={{ color: "#64748B" }}>{i + 1}</td>
                        <td style={{ fontWeight: 600, color: dark ? "white" : "#0F172A" }}>{t.title || "Maintenance"}</td>
                        <td style={{ color: dark ? "#CBD5E1" : "#334155" }}>
                          {t.date
                            ? new Date(t.date).toLocaleDateString("en-GB", {
                                day: "2-digit", month: "short", year: "numeric",
                              }).replace(",", "")
                            : "—"}
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 700, color: "#22C55E" }}>
                          ₹{fmt(t.amount)}
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="corpusFooter">
          <span>{visible.length} flat{visible.length !== 1 ? "s" : ""} shown</span>
          <span>
            Pending:{" "}
            <strong className="redText">{pendingCount} flat{pendingCount !== 1 ? "s" : ""}</strong>
          </span>
        </div>
      </div>
    </>
  );
}

// ─── CorpusFund component ──────────────────────────────────────────────────────
function CorpusFund() {
  const dark = useTheme();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [month, setMonth] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const loadData = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("corpus_transactions")
      .select("*")
      .order("date", { ascending: false });
    if (error) console.error("Corpus load error:", error);
    else setTransactions(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = useMemo(() => {
    return transactions.filter((row) => {
      const text = Object.values(row).join(" ").toLowerCase();
      const matchSearch = !search || text.includes(search.toLowerCase());
      const matchMonth  = !month  || row.date?.includes(`-${month}-`);
      const matchType   = typeFilter === "all" || row.type === typeFilter;
      return matchSearch && matchMonth && matchType;
    });
  }, [transactions, search, month, typeFilter]);

  const income      = transactions.filter((x) => x.type === "income");
  const expenses    = transactions.filter((x) => x.type === "expense");
  const totalIncome  = income.reduce((a, b)   => a + Number(b.amount || 0), 0);
  const totalExpense = expenses.reduce((a, b) => a + Number(b.amount || 0), 0);
  const balance      = totalIncome - totalExpense;

  if (loading) {
    return (
      <div className="elecLoader">
        <Loader2 size={28} className="spin" />
        <span>Loading corpus fund data...</span>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="topbar">
        <div className="eyebrow">Green Meadows : Block A</div>
        <div className="title">Corpus Fund</div>
      </div>

      {/* KPI cards */}
      <div className="kpiGrid" style={{ marginBottom: 28 }}>
        <Kpi icon={<ArrowUpCircle size={18} />}  label="Total Income"  value={`₹${fmt(totalIncome)}`}  green />
        <Kpi icon={<ArrowDownCircle size={18} />} label="Total Expense" value={`₹${fmt(totalExpense)}`} red />
        <Kpi icon={<PiggyBank size={18} />}       label="Corpus Balance" value={`₹${fmt(balance)}`}     blue />
      </div>

      {/* Table card */}
      <div className="tableCard" style={{ marginTop: 0 }}>
        <div className="tableHeader">
          <div>
            <div className="tableTitle">Corpus Transactions</div>
            <div className="tableSub">Complete income &amp; expenditure record</div>
          </div>
          <div className="tableHeaderRight">
            {/* Type filter pills */}
            <div className="elecFilterGroup">
              {["all", "income", "expense"].map((f) => (
                <button
                  key={f}
                  className={`elecFBtn ${typeFilter === f ? "elecFActive" : ""}`}
                  onClick={() => setTypeFilter(f)}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            <div className="filters">
              <div className="search">
                <Search size={15} />
                <input
                  placeholder="Search transactions..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select value={month} onChange={(e) => setMonth(e.target.value)}>
                <option value="">All Months</option>
                {MONTHS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <button className="elecReset" onClick={loadData}>
                <RefreshCw size={13} /> Refresh
              </button>
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="elecEmpty">No transactions found.</div>
        ) : (
          <div className="tableWrap">
            <table className="modernTable">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Flat No.</th>
                  <th>Type</th>
                  <th style={{ textAlign: "right" }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id}>
                    <td>
                      {new Date(r.date).toLocaleDateString("en-GB", {
                        day: "2-digit", month: "short", year: "numeric",
                      }).replace(",", "")}
                    </td>
                    <td style={{ fontWeight: 600, color: "white" }}>
                      {r.title || "—"}
                    </td>
                    <td>
                      <span className="category">{r.category || "—"}</span>
                    </td>
                    <td style={{ color: "#94A3B8" }}>
                      {r.flat_no || "—"}
                    </td>
                    <td>
                      <span className={`status ${r.type}`}>{r.type}</span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <span className={`amount ${r.type === "income" ? "greenText" : "redText"}`}>
                        ₹{fmt(r.amount)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Running balance footer */}
        <div className="corpusFooter">
          <span>
            {filtered.length} transaction{filtered.length !== 1 ? "s" : ""} shown
          </span>
          <span>
            Net:{" "}
            <strong className={balance >= 0 ? "greenText" : "redText"}>
              ₹{fmt(balance)}
            </strong>
          </span>
        </div>
      </div>
    </>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [month, setMonth] = useState(String(new Date().getMonth() + 1).padStart(2, "0")); // default current month
  const [activePage, setActivePage] = useState("dashboard");
  const [historySearch, setHistorySearch] = useState("");
  const [viewMode, setViewMode] = useState("table");
  const [mergedByFlat, setMergedByFlat] = useState(true); // default merged view
  const [txTypeFilter, setTxTypeFilter] = useState("all");
  const [darkMode, setDarkMode] = useState(true);
  const dark = darkMode;
  const [dashboardMonth, setDashboardMonth] = useState(currentMonth()); // "YYYY-MM", defaults to current month
  const [showOverallModal, setShowOverallModal] = useState(false);
  const [chartRange, setChartRange] = useState("all");

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("transactions")
        .select("*")
        .order("date", { ascending: false });
      setTransactions(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    return transactions.filter((row) => {
      const text = Object.values(row).join(" ").toLowerCase();
      return (
        (!search || text.includes(search.toLowerCase())) &&
        (!month || row.date?.includes(`-${month}-`))
      );
    });
  }, [transactions, search, month]);

  // Group rows that share the same flat_no + date + type into one merged row.
  // Categories are joined with " + " and amounts are summed.
  const mergedFiltered = useMemo(() => {
    const groups = new Map();
    filtered.forEach((row) => {
      const key = `${row.flat_no || "—"}|${row.date}|${row.type}`;
      if (!groups.has(key)) {
        groups.set(key, {
          id: row.id,
          flat_no: row.flat_no,
          date: row.date,
          type: row.type,
          categories: [row.category],
          amount: Number(row.amount || 0),
        });
      } else {
        const g = groups.get(key);
        if (row.category && !g.categories.includes(row.category)) {
          g.categories.push(row.category);
        }
        g.amount += Number(row.amount || 0);
      }
    });
    return Array.from(groups.values()).map((g) => ({
      ...g,
      category: g.categories.join(" + "),
    }));
  }, [filtered]);

  const baseRows = mergedByFlat ? mergedFiltered : filtered;
  const displayRows = txTypeFilter === "all" ? baseRows : baseRows.filter((r) => r.type === txTypeFilter);

  const income = transactions.filter((x) => x.type === "income");
  const expenses = transactions.filter((x) => x.type === "expense");

  // All-time totals (used in Overall View modal)
  const allTimeIncome  = income.reduce((a, b) => a + Number(b.amount || 0), 0);
  const allTimeExpense = expenses.reduce((a, b) => a + Number(b.amount || 0), 0);
  const allTimeBalance = allTimeIncome - allTimeExpense;

  // Month-filtered totals (used in main KPI cards) — defaults to current month
  const monthIncome  = income.filter((r)   => r.date?.startsWith(dashboardMonth)).reduce((a, b) => a + Number(b.amount || 0), 0);
  const monthExpense = expenses.filter((r) => r.date?.startsWith(dashboardMonth)).reduce((a, b) => a + Number(b.amount || 0), 0);
  const monthBalance = monthIncome - monthExpense;

  const totalIncome  = monthIncome;
  const totalExpense = monthExpense;
  const balance       = monthBalance;

  const dashboardMonthLabel = (() => {
    const [yr, mo] = dashboardMonth.split("-");
    const lbl = MONTHS.find(([m]) => m === mo);
    return lbl ? `${lbl[1]} ${yr}` : dashboardMonth;
  })();
  const dashboardMonthLabelShort = (() => {
    const [, mo] = dashboardMonth.split("-");
    const lbl = MONTHS.find(([m]) => m === mo);
    return lbl ? lbl[1].slice(0, 3) : dashboardMonth;
  })();

  // Transactions filtered to the selected dashboard month (used by all 3 charts below)
  const monthIncomeRows   = income.filter((r)   => r.date?.startsWith(dashboardMonth));
  const monthExpenseRows  = expenses.filter((r) => r.date?.startsWith(dashboardMonth));

  const currentYear = new Date().getFullYear();
  const activeMonths = MONTHS.filter(([m]) => {
    const hasIncome  = income.some((r)   => r.date?.startsWith(`${currentYear}-${m}-`) || r.date?.includes(`-${m}-`));
    const hasExpense = expenses.some((r) => r.date?.startsWith(`${currentYear}-${m}-`) || r.date?.includes(`-${m}-`));
    return hasIncome || hasExpense;
  });
  const chartMonths = activeMonths.length > 0 ? activeMonths : MONTHS.slice(0, 6);

  // Financial Trend — single bar pair for the SELECTED month only (matches Income/Expense KPI cards)
  const barData = {
    labels: [dashboardMonthLabelShort],
    datasets: [
      {
        label: "Income",
        data: [monthIncome],
        backgroundColor: "#3B82F6",
        borderRadius: 8,
        borderSkipped: false,
      },
      {
        label: "Expenditure",
        data: [monthExpense],
        backgroundColor: "#EF4444",
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  // Income/Expense Breakdown doughnuts — also filtered to the selected month
  const incomeMap = monthIncomeRows.reduce((acc, item) => {
    if (item.category) acc[item.category] = (acc[item.category] || 0) + Number(item.amount);
    return acc;
  }, {});

  const incomePieData = {
    labels: Object.keys(incomeMap),
    datasets: [{
      data: Object.values(incomeMap),
      backgroundColor: ["#14B8A6","#3B82F6","#F59E0B","#22C55E","#8B5CF6","#F97316","#EF4444"],
    }],
  };

  const expenseMap = monthExpenseRows.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + Number(item.amount);
    return acc;
  }, {});

  const pieData = {
    labels: Object.keys(expenseMap),
    datasets: [{
      data: Object.values(expenseMap),
      backgroundColor: ["#3B82F6","#8B5CF6","#22C55E","#F97316","#EF4444","#14B8A6"],
    }],
  };

  // ── Overall View modal: all-time month-wise bar chart ──
  // Build a sorted list of all unique year-months from transactions
  const allMonthKeys = [...new Set(
    [...income, ...expenses]
      .map((r) => r.date?.slice(0, 7))
      .filter(Boolean)
  )].sort();

  // Per-month income/expense/savings for chart
  const perMonth = allMonthKeys.map((ym) => {
    const inc = income.filter((r) => r.date?.startsWith(ym)).reduce((a, b) => a + Number(b.amount || 0), 0);
    const exp = expenses.filter((r) => r.date?.startsWith(ym)).reduce((a, b) => a + Number(b.amount || 0), 0);
    const [yr, mo] = ym.split("-");
    const lbl = MONTHS.find(([m]) => m === mo);
    return { ym, label: lbl ? `${lbl[1].slice(0, 3)} '${yr.slice(2)}` : ym, inc, exp, sav: inc - exp };
  });

  // Last month totals for % comparison
  const prevMonthYm = allMonthKeys[allMonthKeys.length - 2] || null;
  const prevIncome  = prevMonthYm ? income.filter((r) => r.date?.startsWith(prevMonthYm)).reduce((a, b) => a + Number(b.amount || 0), 0) : 0;
  const prevExpense = prevMonthYm ? expenses.filter((r) => r.date?.startsWith(prevMonthYm)).reduce((a, b) => a + Number(b.amount || 0), 0) : 0;
  const prevSavings = prevIncome - prevExpense;
  const lastMonthYm = allMonthKeys[allMonthKeys.length - 1] || null;
  const lastIncome  = lastMonthYm ? income.filter((r) => r.date?.startsWith(lastMonthYm)).reduce((a, b) => a + Number(b.amount || 0), 0) : 0;
  const lastExpense = lastMonthYm ? expenses.filter((r) => r.date?.startsWith(lastMonthYm)).reduce((a, b) => a + Number(b.amount || 0), 0) : 0;
  const lastSavings = lastIncome - lastExpense;

  const pctChange = (curr, prev) => prev === 0 ? null : (((curr - prev) / prev) * 100).toFixed(1);
  const incPct  = pctChange(lastIncome, prevIncome);
  const expPct  = pctChange(lastExpense, prevExpense);
  const savPct  = pctChange(lastSavings, prevSavings);
  const savRate = allTimeIncome > 0 ? ((allTimeBalance / allTimeIncome) * 100).toFixed(1) : "0.0";
  const lastSavRate = lastIncome > 0 ? ((lastSavings / lastIncome) * 100).toFixed(1) : "0.0";
  const prevSavRate = prevIncome > 0 ? ((prevSavings / prevIncome) * 100).toFixed(1) : "0.0";
  const savRatePct  = pctChange(Number(lastSavRate), Number(prevSavRate));

  // Highest income/expense month
  const highestIncMonth  = perMonth.reduce((a, b) => b.inc > a.inc ? b : a, { inc: 0, label: "—" });
  const highestExpMonth  = perMonth.reduce((a, b) => b.exp > a.exp ? b : a, { exp: 0, label: "—" });
  const avgIncome  = perMonth.length ? Math.round(allTimeIncome / perMonth.length) : 0;
  const avgExpense = perMonth.length ? Math.round(allTimeExpense / perMonth.length) : 0;
  const healthScore = Math.min(100, Math.max(0, Math.round(Number(savRate) * 1.5 + (allTimeBalance > 0 ? 25 : 0))));
  const healthLabel = healthScore >= 80 ? "Excellent" : healthScore >= 60 ? "Good" : healthScore >= 40 ? "Fair" : "Needs Attention";

  const rangeMap = { "6m": 6, "12m": 12, "24m": 24, "all": perMonth.length };
  const rangeMonths = perMonth.slice(-(rangeMap[chartRange] || perMonth.length));
  const rangeBarData = {
    labels: rangeMonths.map((m) => m.label),
    datasets: [
      { label: "Income", data: rangeMonths.map((m) => m.inc), backgroundColor: "#3B82F6", borderRadius: 6, borderSkipped: false, order: 2 },
      { label: "Expense", data: rangeMonths.map((m) => m.exp), backgroundColor: "#EF4444", borderRadius: 6, borderSkipped: false, order: 2 },
      { label: "Savings (Balance)", data: rangeMonths.map((m) => m.sav), type: "line", borderColor: "#22C55E", backgroundColor: "rgba(34,197,94,.1)", pointBackgroundColor: "#22C55E", pointRadius: 5, tension: 0.4, fill: false, order: 1 },
    ],
  };

  const overallBarData = {
    labels: perMonth.map((m) => m.label),
    datasets: [
      {
        label: "Income",
        data: perMonth.map((m) => m.inc),
        backgroundColor: "#3B82F6",
        borderRadius: 6,
        borderSkipped: false,
        order: 2,
      },
      {
        label: "Expense",
        data: perMonth.map((m) => m.exp),
        backgroundColor: "#EF4444",
        borderRadius: 6,
        borderSkipped: false,
        order: 2,
      },
      {
        label: "Savings (Balance)",
        data: perMonth.map((m) => m.sav),
        type: "line",
        borderColor: "#22C55E",
        backgroundColor: "rgba(34,197,94,.1)",
        pointBackgroundColor: "#22C55E",
        pointRadius: 5,
        tension: 0.4,
        fill: false,
        order: 1,
      },
    ],
  };

  if (loading) return <div className="loader">Loading dashboard...</div>;

  return (
    <>
      <style>{css}</style>
      <ThemeContext.Provider value={darkMode}>
      <div className={`layout${darkMode ? "" : " lightMode"}`}>

        {/* SIDEBAR */}
        <aside className="sidebar">
          <div>
            <div className="brand">GM</div>
            <div className="brandText">Green Meadows</div>
            <div className="menu">
              <SidebarItem icon={<LayoutDashboard size={18} />} label="Dashboard"      active={activePage === "dashboard"}   onClick={() => setActivePage("dashboard")} />
              <SidebarItem icon={<Wallet size={18} />}          label="Pay Now"         active={activePage === "paynow"}      onClick={() => setActivePage("paynow")} />
              {/* <SidebarItem icon={<History size={18} />}         label="Payment History" active={activePage === "history"}     onClick={() => setActivePage("history")} /> */}
              {/* <SidebarItem icon={<Zap size={18} />}             label="Electricity"     active={activePage === "electricity"} onClick={() => setActivePage("electricity")} /> */}
              <SidebarItem icon={<ClipboardList size={18} />}    label="Maintenance Dues" active={activePage === "dues"}        onClick={() => setActivePage("dues")} />
              <SidebarItem icon={<PiggyBank size={18} />}        label="Corpus Fund"     active={activePage === "corpus"}      onClick={() => setActivePage("corpus")} />
              <SidebarItem icon={<FileText size={18} />}        label="Society Rules"   active={activePage === "rules"}       onClick={() => setActivePage("rules")} />
              {/* <SidebarItem icon={<Phone size={18} />}           label="Contact"         active={activePage === "contact"}     onClick={() => setActivePage("contact")} /> */}
              {/* <SidebarItem icon={<Settings size={18} />}        label="Settings"        active={activePage === "settings"}    onClick={() => setActivePage("settings")} /> */}
            </div>
          </div>
          <div>
            <button className="themeToggle" onClick={() => setDarkMode((v) => !v)} title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}>
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
              {darkMode ? "Light Mode" : "Dark Mode"}
            </button>
            <div className="profile">
              <div className="avatar">GM</div>
              <div>
                <div className="profileName">Block A</div>
                <div className="profileSub">Finance Admin</div>
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <main className="main">

          {/* DASHBOARD */}
          {activePage === "dashboard" && (
            <>
            
              <div className="topbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14 }}>
                <div>
                  <div className="eyebrow">Green Meadows : Block A</div>
                  <div className="title">Balance Sheet</div>
                  <div className="showingBadge">Showing: {dashboardMonthLabel}</div>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <input
                    type="month"
                    className="dashMonthPicker"
                    value={dashboardMonth}
                    onChange={(e) => setDashboardMonth(e.target.value)}
                  />
                  <button className="overallViewBtn" onClick={() => setShowOverallModal(true)}>
                    Overall View
                  </button>
                </div>
              </div>
              
              <div className="kpiGrid">
                <Kpi icon={<TrendingUp size={18} />}  label="Income"  value={`₹${fmt(totalIncome)}`}  green />
                <Kpi icon={<TrendingDown size={18} />} label="Expense" value={`₹${fmt(totalExpense)}`} red />
                <Kpi icon={<Wallet size={18} />}       label="Balance" value={`₹${fmt(balance)}`}      blue />
              </div>

              {/* ── CHARTS: 3 side by side ── */}
              <div className="chartGrid">
                
                <div className="card">
                  <div className="cardTitle">Income Breakdown</div>
                  <div style={{ height: 220, marginTop: 12 }}>
                    <Doughnut data={incomePieData} options={{ plugins: { legend: { display: false } }, cutout: "65%" }} />
                  </div>
                  <div className="pieList">
                    {incomePieData.labels.map((label, i) => (
                      <div key={label} className="pieListRow">
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span className="pieDot" style={{ background: incomePieData.datasets[0].backgroundColor[i] }} />
                          <span style={{ color: dark ? "#CBD5E1" : "#334155", fontSize: 13 }}>{label}</span>
                        </div>
                        <span style={{ color: "#22C55E", fontWeight: 700, fontSize: 13 }}>
                          ₹{fmt(incomePieData.datasets[0].data[i])}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="card">
                  <div className="cardTitle">Expense Breakdown</div>
                  <div style={{ height: 220, marginTop: 12 }}>
                    <Doughnut data={pieData} options={{ plugins: { legend: { display: false } }, cutout: "65%" }} />
                  </div>
                  <div className="pieList">
                    {pieData.labels.map((label, i) => (
                      <div key={label} className="pieListRow">
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span className="pieDot" style={{ background: pieData.datasets[0].backgroundColor[i] }} />
                          <span style={{ color: dark ? "#CBD5E1" : "#334155", fontSize: 13 }}>{label}</span>
                        </div>
                        <span style={{ color: "#EF4444", fontWeight: 700, fontSize: 13 }}>
                          ₹{fmt(pieData.datasets[0].data[i])}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="card">
                  <div className="cardTitle">Financial Trend</div>
                  <div className="chartWrap">
                    <Bar data={barData} options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { position: "top", labels: { color: dark ? "#94A3B8" : "#475569", boxWidth: 12, padding: 16 } } },
                      scales: {
                        x: { ticks: { color: "#64748B" }, grid: { color: "rgba(255,255,255,.04)" } },
                        y: {
                          ticks: { color: "#64748B", callback: (v) => "₹" + (v >= 1000 ? Math.round(v / 1000) + "k" : v) },
                          grid: { color: "rgba(255,255,255,.04)" },
                        },
                      },
                    }} />
                  </div>
                </div>     

              </div>
              <div className="tableCard">
                <div className="tableHeaderNew">
                  <div className="tableHeaderTop">
                    <div>
                      <div className="tableTitle">Transactions</div>
                      <div className="tableSub">Monthly overview of all transactions</div>
                    </div>
                    <div className="txTypePills">
                      {[["all", "All"], ["income", "Income"], ["expense", "Expenditure"]].map(([val, label]) => (
                        <button
                          key={val}
                          className={`txPill ${txTypeFilter === val ? "txPillActive" : ""}`}
                          onClick={() => setTxTypeFilter(val)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="tableHeaderBottom">
                    <div className="search" style={{ flex: 1, maxWidth: 320 }}>
                      <Search size={15} />
                      <input placeholder="Search Flat No." value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                    <select value={month} onChange={(e) => setMonth(e.target.value)}>
                      <option value="">All Months</option>
                      {MONTHS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                    <button
                      className={`mergeBtn ${mergedByFlat ? "mergeBtnActive" : ""}`}
                      onClick={() => setMergedByFlat((v) => !v)}
                      title="Combine same flat + date entries into one row"
                    >
                      {mergedByFlat ? <CheckCircle size={14} /> : <ClipboardList size={14} />} Merged by Flat
                    </button>
                    <div className="viewToggle">
                      <button className={`toggleBtn ${viewMode === "table" ? "toggleActive" : ""}`} onClick={() => setViewMode("table")}>
                        <Table size={14} /> Table
                      </button>
                      <button className={`toggleBtn ${viewMode === "card" ? "toggleActive" : ""}`} onClick={() => setViewMode("card")}>
                        <LayoutGrid size={14} /> Cards
                      </button>
                    </div>
                  </div>
                </div>

                <div className={`tableWrap ${viewMode === "card" ? "hideMobile" : ""}`}>
                  <table className="modernTable">
                    <thead>
                      <tr><th>Date</th><th>Flat</th><th>Category</th><th>Status</th><th align="right">Amount</th></tr>
                    </thead>
                    <tbody>
                      {displayRows.map((r) => (
                        <tr key={r.id}>
                          <td>{new Date(r.date).toLocaleDateString("en-GB",{day:"2-digit",month:"short"}).replace(",","")}</td>
                          <td style={{ color: dark ? '#CBD5E1' : '#334155' }}>{r.flat_no || "-"}</td>
                          <td><span className="category">{r.category}</span></td>
                          <td><span className={`status ${r.type}`}>{r.type}</span></td>
                          <td align="right"><span className={`amount ${r.type === "income" ? "greenText" : "redText"}`}>₹{fmt(r.amount)}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className={`txCardList ${viewMode === "card" ? "showMobileCards" : ""}`}>
                  {displayRows.map((r) => (
                    <div key={r.id} className="txCard">
                      <div className="txCardTop">
                        <div>
                          <div className="txCardCategory">{r.category}</div>
                          <span className={`status ${r.type}`} style={{ marginTop: 6, display: "inline-block" }}>{r.type}</span>
                        </div>
                        <div className={`txCardAmount ${r.type === "income" ? "greenText" : "redText"}`}>₹{fmt(r.amount)}</div>
                      </div>
                      <div className="txCardMeta">
                        <div className="txMeta">
                          <span className="txMetaLabel">Date</span>
                          <span className="txMetaVal">{new Date(r.date).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}).replace(",","")}</span>
                        </div>
                        <div className="txMeta">
                          <span className="txMetaLabel">Flat</span>
                          <span className="txMetaVal">{r.flat_no || "—"}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── OVERALL VIEW MODAL ── */}
              {showOverallModal && (
                <div className="modalOverlay" onClick={() => setShowOverallModal(false)}>
                    <div className="modalBox ovBox" onClick={(e) => e.stopPropagation()}>

                      {/* Header */}
                      <div className="modalHeader">
                        <div>
                          <div className="modalTitle">Financial Overview</div>
                          <div className="modalSub">All financial data across every recorded month</div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div className="ovDateRange">
                            📅 {perMonth[0]?.label || "—"} – {perMonth[perMonth.length - 1]?.label || "—"}
                          </div>
                          <button className="modalCloseBtn" onClick={() => setShowOverallModal(false)}>✕</button>
                        </div>
                      </div>
                      <div className="ovLastUpdated">↻ Last updated: Today</div>

                      {/* 4 KPI cards */}
                      <div className="ovKpiGrid">
                        {/* Total Income */}
                        <div className="ovKpi">
                          <div className="ovKpiTop">
                            <div className="ovKpiIcon green"><TrendingUp size={16} /></div>
                            <span className="ovKpiLabel">Total Income</span>
                          </div>
                          <div className="ovKpiValue">₹{fmt(allTimeIncome)}</div>
                          {incPct && <div className={`ovKpiChange ${Number(incPct) >= 0 ? "up" : "down"}`}>{Number(incPct) >= 0 ? "↑" : "↓"} {Math.abs(incPct)}% vs last month</div>}
                        </div>
                        {/* Total Expense */}
                        <div className="ovKpi">
                          <div className="ovKpiTop">
                            <div className="ovKpiIcon red"><TrendingDown size={16} /></div>
                            <span className="ovKpiLabel">Total Expense</span>
                          </div>
                          <div className="ovKpiValue">₹{fmt(allTimeExpense)}</div>
                          {expPct && <div className={`ovKpiChange ${Number(expPct) <= 0 ? "up" : "down"}`}>{Number(expPct) >= 0 ? "↑" : "↓"} {Math.abs(expPct)}% vs last month</div>}
                        </div>
                        {/* Net Savings */}
                        <div className="ovKpi">
                          <div className="ovKpiTop">
                            <div className="ovKpiIcon blue"><Wallet size={16} /></div>
                            <span className="ovKpiLabel">Net Savings</span>
                          </div>
                          <div className="ovKpiValue">₹{fmt(allTimeBalance)}</div>
                          {savPct && <div className={`ovKpiChange ${Number(savPct) >= 0 ? "up" : "down"}`}>{Number(savPct) >= 0 ? "↑" : "↓"} {Math.abs(savPct)}% vs last month</div>}
                          {allTimeBalance > 0 && <div className="ovBadge purple">Highest till date</div>}
                        </div>
                        {/* Savings Rate */}
                        <div className="ovKpi">
                          <div className="ovKpiTop">
                            <div className="ovKpiIcon purple2"><PiggyBank size={16} /></div>
                            <span className="ovKpiLabel">Savings Rate</span>
                          </div>
                          <div className="ovKpiValue">{savRate}%</div>
                          {savRatePct && <div className={`ovKpiChange ${Number(savRatePct) >= 0 ? "up" : "down"}`}>{Number(savRatePct) >= 0 ? "↑" : "↓"} {Math.abs(savRatePct)}% vs last month</div>}
                          <div className="ovBadge green2">{healthLabel}</div>
                        </div>
                      </div>

                      {/* Chart */}
                      <div className="ovChartCard">
                        <div className="ovChartHeader">
                          <div>
                            <div className="ovChartTitle">Income vs Expenditure vs Savings Trend</div>
                            <div className="ovChartLegend">
                              <span><span className="ovDot" style={{ background: "#3B82F6" }} />Income</span>
                              <span><span className="ovDot" style={{ background: "#EF4444" }} />Expense</span>
                              <span><span className="ovDot" style={{ background: "#22C55E", borderRadius: "50%" }} />Savings (Balance)</span>
                            </div>
                          </div>
                          <div className="ovRangeBtns">
                            {[["6m","6M"],["12m","12M"],["24m","24M"],["all","All"]].map(([val, lbl]) => (
                              <button key={val} className={`ovRangeBtn ${chartRange === val ? "ovRangeActive" : ""}`} onClick={() => setChartRange(val)}>{lbl}</button>
                            ))}
                          </div>
                        </div>
                        <div style={{ height: 240 }}>
                          <Bar data={rangeBarData} options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => ` ₹${fmt(ctx.raw)}` } } },
                            scales: {
                              x: { ticks: { color: "#64748B", font: { size: 11 } }, grid: { color: "rgba(255,255,255,.04)" } },
                              y: { ticks: { color: "#64748B", font: { size: 11 }, callback: (v) => "₹" + (v >= 1000 ? Math.round(v / 1000) + "k" : v) }, grid: { color: "rgba(255,255,255,.04)" } },
                            },
                          }} />
                        </div>
                      </div>

                      {/* Financial Summary */}
                      <div className="ovSummary">
                        <div className="ovSummaryTitle">Financial Summary</div>
                        <div className="ovSummaryGrid">
                          <div className="ovSumItem">
                            <div className="ovSumIcon green"><TrendingUp size={14} /></div>
                            <div>
                              <div className="ovSumLabel">Highest Income</div>
                              <div className="ovSumVal">₹{fmt(highestIncMonth.inc)}</div>
                              <div className="ovSumSub">{highestIncMonth.label}</div>
                            </div>
                          </div>
                          <div className="ovSumItem">
                            <div className="ovSumIcon red"><TrendingDown size={14} /></div>
                            <div>
                              <div className="ovSumLabel">Highest Expense</div>
                              <div className="ovSumVal">₹{fmt(highestExpMonth.exp)}</div>
                              <div className="ovSumSub">{highestExpMonth.label}</div>
                            </div>
                          </div>
                          <div className="ovSumItem">
                            <div className="ovSumIcon blue"><ClipboardList size={14} /></div>
                            <div>
                              <div className="ovSumLabel">Avg Monthly Income</div>
                              <div className="ovSumVal">₹{fmt(avgIncome)}</div>
                            </div>
                          </div>
                          <div className="ovSumItem">
                            <div className="ovSumIcon orange"><ClipboardList size={14} /></div>
                            <div>
                              <div className="ovSumLabel">Avg Monthly Expense</div>
                              <div className="ovSumVal">₹{fmt(avgExpense)}</div>
                            </div>
                          </div>
                          <div className="ovSumItem">
                            <div className="ovSumIcon purple2"><CheckCircle size={14} /></div>
                            <div>
                              <div className="ovSumLabel">Financial Health</div>
                              <div className="ovSumVal" style={{ color: healthScore >= 80 ? "#22C55E" : healthScore >= 60 ? "#F59E0B" : "#EF4444" }}>{healthLabel}</div>
                              <div className="ovSumSub">Score: {healthScore} / 100</div>
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
              )}

            </>
          )}

          {/* PAY NOW */}
          {activePage === "paynow" && (
            <div className="payNowPage">
              <div className="pageHeading">
                <h1>Pay Maintenance</h1>
                <p>Securely pay your monthly society maintenance using QR payment or direct bank transfer.</p>
              </div>
              <div className="payGrid">
                <div className="payCard">
                  <div className="payCardTitle">Scan &amp; Pay</div>
                  <div className="qrWrapper"><img src="/images/QR_code.png" alt="QR" /></div>
                  {/*<div className="paySub">UPI ID: greenmeadows@upi</div>*/}
                </div>
                <div className="payCard">
                  <div className="payCardTitle">Bank Details</div>
                  <div className="bankList">
                    <div className="bankRow"><span>Account Name</span><strong>Green Meadows Society</strong></div>
                    <div className="bankRow"><span>Bank Name</span><strong>Coming Soon</strong></div>
                    <div className="bankRow"><span>Account Number</span><strong>-</strong></div>
                    <div className="bankRow"><span>IFSC Code</span><strong>-</strong></div>
                  </div>

                  
                </div>
              </div>
              <div className="noticeCard">⚠ Kindly complete the maintenance payment before the 10th of every month to avoid late charges.</div>
            </div>
          )}

          {/* PAYMENT HISTORY */}
          {activePage === "history" && (
            <div className="pageCard">
              <div className="historyTop">
                <div>
                  <h1>Payment History</h1>
                  <p className="historySub">Complete maintenance payment records of all residents.</p>
                </div>
                <div className="search" style={{ marginTop: "16px" }}>
                  <Search size={15} />
                  <input placeholder="Search by flat, category, date..." value={historySearch} onChange={(e) => setHistorySearch(e.target.value)} />
                </div>
              </div>
              <div className="tableWrap">
                <table className="modernTable">
                  <thead>
                    <tr><th>Date</th><th>Flat</th><th>Category</th><th>Status</th><th align="right">Amount</th></tr>
                  </thead>
                  <tbody>
                    {transactions
                      .filter((item) => {
                        if (item.type !== "income") return false;
                        if (!historySearch) return true;
                        return Object.values(item).join(" ").toLowerCase().includes(historySearch.toLowerCase());
                      })
                      .map((item) => (
                        <tr key={item.id}>
                          <td>{new Date(item.date).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}).replace(",","")}</td>
                          <td>{item.flat_no || "-"}</td>
                          <td><span className="category">{item.category || "Maintenance"}</span></td>
                          <td><span className="paidStatus">Paid</span></td>
                          <td align="right"><span className="greenText amount">₹{fmt(item.amount)}</span></td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ELECTRICITY TRACKER */}
          {activePage === "electricity" && <ElectricityTracker />}

          {/* MAINTENANCE DUES */}
          {activePage === "dues" && <MaintenanceDues />}

          {/* CORPUS FUND */}
          {activePage === "corpus" && <CorpusFund />}

          {/* SOCIETY RULES */}
          {activePage === "rules" && (
            <div className="pageCard">
              <h1>Society Rules</h1>
              <p className="rulesText">Please follow society guidelines to maintain a peaceful and clean environment.</p>
              <ul className="rulesList">
                <li>Maintenance payment before 10th of every month.</li>
                <li>No loud noise after 10 PM.</li>
                <li>Keep common areas clean.</li>
                <li>Visitor parking only in designated areas.</li>
              </ul>
              <div className="pdfCard">
                <div>
                  <div className="pdfTitle">Society Rule Book</div>
                  <div className="pdfSub">View or download official PDF.</div>
                </div>
                <a href="/society-rules.pdf" target="_blank" rel="noreferrer" className="pdfBtn">View PDF</a>
              </div>
            </div>
          )}

          {/* CONTACT */}
          {activePage === "contact" && (
            <div className="pageCard">
              <h1>Contact</h1>
              <div className="contactBox">
                <p>📞 +91 9876543210</p>
                <p>📧 support@greenmeadows.com</p>
                <p>🕒 9 AM - 6 PM</p>
              </div>
            </div>
          )}

          {/* SETTINGS */}
          {activePage === "settings" && (
            <div className="pageCard">
              <h1>Settings</h1>
              <p>Settings page content goes here.</p>
            </div>
          )}

          {/* MOBILE NAV */}
          <div className="mobileNav">
            <div className={`mobileItem ${activePage === "dashboard"   ? "mobileActive" : ""}`} onClick={() => setActivePage("dashboard")}><LayoutDashboard size={20} /><span>Dashboard</span></div>
            <div className={`mobileItem ${activePage === "paynow"      ? "mobileActive" : ""}`} onClick={() => setActivePage("paynow")}><Wallet size={20} /><span>Pay</span></div>
            {/* <div className={`mobileItem ${activePage === "electricity" ? "mobileActive" : ""}`} onClick={() => setActivePage("electricity")}><Zap size={20} /><span>Electricity</span></div> */}
            <div className={`mobileItem ${activePage === "dues"        ? "mobileActive" : ""}`} onClick={() => setActivePage("dues")}><ClipboardList size={20} /><span>Dues</span></div>
            <div className={`mobileItem ${activePage === "corpus"      ? "mobileActive" : ""}`} onClick={() => setActivePage("corpus")}><PiggyBank size={20} /><span>Corpus</span></div>
            <div className={`mobileItem ${activePage === "rules"       ? "mobileActive" : ""}`} onClick={() => setActivePage("rules")}><FileText size={20} /><span>Rules</span></div>
            {/*<div className={`mobileItem ${activePage === "history"     ? "mobileActive" : ""}`} onClick={() => setActivePage("history")}><History size={20} /><span>History</span></div>*/}
            {/*<div className={`mobileItem ${activePage === "contact"     ? "mobileActive" : ""}`} onClick={() => setActivePage("contact")}><Phone size={20} /><span>Contact</span></div>*/}
          </div>
        </main>
      </div>
      </ThemeContext.Provider>
    </>
  );
}

function Kpi({ icon, label, value, green, red, blue }) {
  const dark = useTheme();
  return (
    <div className="kpi">
      <div className="kpiTop">
        <div style={{ color: dark ? "#94A3B8" : "#64748B", fontSize: 13 }}>{label}</div>
        <div className={`kpiIcon ${green ? "green" : red ? "red" : "blue"}`}>{icon}</div>
      </div>
      <div className="kpiValue" style={{ color: dark ? "white" : "#0F172A" }}>{value}</div>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }) {
  return (
    <div onClick={onClick} className={`sideItem ${active ? "sideActive" : ""}`}>
      {icon}{label}
    </div>
  );
}

const css = `
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:Inter,sans-serif;background:#0F172A;color:#E2E8F0;}
.layout{display:grid;grid-template-columns:280px 1fr;min-height:100vh;height:100vh;overflow:hidden;}
.sidebar{background:#111827;border-right:1px solid rgba(255,255,255,.06);padding:28px;display:flex;flex-direction:column;justify-content:space-between;height:100vh;position:sticky;top:0;overflow-y:auto;}
.brand{width:52px;height:52px;border-radius:18px;background:linear-gradient(135deg,#3B82F6,#8B5CF6);display:flex;align-items:center;justify-content:center;font-weight:800;}
.brandText{margin-top:16px;font-size:24px;font-weight:800;}
.menu{margin-top:40px;display:flex;flex-direction:column;gap:10px;}
.sideItem{display:flex;align-items:center;gap:14px;padding:14px 18px;border-radius:16px;color:#94A3B8;cursor:pointer;transition:.2s;}
.sideItem:hover{background:rgba(255,255,255,.05);}
.sideActive{background:linear-gradient(135deg,rgba(59,130,246,.2),rgba(139,92,246,.2));color:white;}
.profile{display:flex;align-items:center;gap:14px;background:rgba(255,255,255,.04);padding:16px;border-radius:20px;}
.avatar{width:44px;height:44px;border-radius:14px;background:#3B82F6;display:flex;align-items:center;justify-content:center;font-weight:700;}
.profileName{font-weight:600;font-size:15px;}
.profileSub{color:#64748B;font-size:13px;margin-top:2px;}
.main{padding:32px;overflow-y:auto;height:100vh;}
.topbar{margin-bottom:28px;}
.eyebrow{color:#64748B;font-size:13px;text-transform:uppercase;}
.title{font-size:42px;font-weight:800;margin-top:8px;}
.kpiGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;}
.kpi,.card,.tableCard,.pageCard{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.06);border-radius:24px;padding:16px 24px;}
.kpiTop{display:flex;justify-content:space-between;align-items:center;}
.kpiValue{font-size:32px;font-weight:800;}
.kpiIcon{width:42px;height:42px;border-radius:14px;display:flex;align-items:center;justify-content:center;}
.green{background:rgba(34,197,94,.15);color:#22C55E;}
.red{background:rgba(239,68,68,.15);color:#EF4444;}
.blue{background:rgba(59,130,246,.15);color:#3B82F6;}
.tableCard{margin-top:28px;}
.tableHeader{display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;}
.tableHeaderNew{margin-bottom:24px;}
.tableHeaderTop{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px;flex-wrap:wrap;gap:12px;}
.txTypePills{display:flex;background:rgba(255,255,255,.04);border-radius:12px;padding:4px;gap:2px;height:fit-content;}
.txPill{padding:9px 18px;border-radius:9px;font-size:13px;font-weight:700;color:#64748B;background:transparent;border:none;cursor:pointer;transition:.15s;}
.txPill:hover{color:#CBD5E1;}
.txPillActive{background:#1D4ED8;color:white;}
.tableHeaderBottom{display:flex;align-items:center;gap:10px;flex-wrap:wrap;}
.mergeBtn{display:flex;align-items:center;gap:6px;padding:10px 16px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);color:#94A3B8;border-radius:12px;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap;transition:.15s;}
.mergeBtn:hover{background:rgba(255,255,255,.08);color:white;}
.mergeBtnActive{background:linear-gradient(135deg,#7C3AED,#A855F7);border-color:transparent;color:white;}
.tableHeaderRight{display:flex;flex-direction:column;align-items:flex-end;gap:12px;}
.tableTitle{font-size:24px;font-weight:800;}
.tableSub{color:#94A3B8;margin-top:6px;}
.filters{display:flex;gap:14px;}
.search{display:flex;align-items:center;gap:10px;background:#111827;padding:14px 18px;border-radius:18px;}
.search input{background:none;border:none;outline:none;color:white;width:100%;}
select{background:#111827;border:none;color:white;border-radius:18px;padding:14px;cursor:pointer;}
.tableWrap{overflow:auto;}
.modernTable{width:100%;border-collapse:separate;border-spacing:0 8px;min-width:500px;}
.modernTable thead th{color:#64748B;font-size:13px;text-transform:uppercase;padding:0 18px;text-align:left;}
.modernTable tbody tr{background:rgba(255,255,255,.04);transition:.2s;}
.modernTable tbody tr:hover{background:rgba(255,255,255,.07);}
.modernTable td{padding:16px 18px;font-size:13px;}
.modernTable tr td:first-child{border-radius:16px 0 0 16px;}
.modernTable tr td:last-child{border-radius:0 16px 16px 0;}
.chartGrid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:24px;margin-top:28px;}
.chartGrid2{display:grid;grid-template-columns:1fr 1fr;gap:24px;}
.pieList{margin-top:16px;display:flex;flex-direction:column;gap:5px;}
.pieListRow{display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:rgba(255,255,255,.03);border-radius:10px;}
.pieDot{width:10px;height:10px;border-radius:3px;flex-shrink:0;}
.cardTitle{font-size:18px;font-weight:700;}
.chartWrap{height:360px;margin-top:20px;}
.category{font-size:13px;}
.status{padding:8px 14px;border-radius:999px;font-size:13px;font-weight:600;text-transform:capitalize;}
.status.income{background:rgba(34,197,94,.15);color:#22C55E;}
.status.expense{background:rgba(239,68,68,.15);color:#EF4444;}
.amount{font-weight:700;}
.greenText{color:#22C55E;}
.redText{color:#EF4444;}

/* VIEW TOGGLE */
.viewToggle{display:none;}
.toggleBtn{display:flex;align-items:center;gap:6px;padding:8px 14px;border-radius:10px;font-size:13px;font-weight:500;cursor:pointer;border:none;background:transparent;color:#64748B;transition:.15s;}
.toggleActive{background:rgba(59,130,246,.2);color:#93C5FD;}
.txCardList{display:none;}
.txCard{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:16px 18px;margin-bottom:12px;}
.txCardTop{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;}
.txCardCategory{font-size:15px;font-weight:700;color:white;}
.txCardAmount{font-size:18px;font-weight:800;}
.txCardMeta{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
.txMeta{display:flex;flex-direction:column;gap:3px;}
.txMetaLabel{font-size:11px;color:#64748B;text-transform:uppercase;letter-spacing:.05em;}
.txMetaVal{font-size:13px;color:#CBD5E1;}

/* ELECTRICITY TRACKER */
.elecMonthBadge{font-size:14px;font-weight:600;background:rgba(59,130,246,.15);color:#93C5FD;padding:6px 14px;border-radius:999px;}
.elecLoader{display:flex;align-items:center;justify-content:center;gap:12px;height:300px;color:#94A3B8;font-size:15px;}
.spin{animation:spin 1s linear infinite;}
@keyframes spin{to{transform:rotate(360deg);}}
.elecProgressWrap{position:relative;height:6px;background:rgba(255,255,255,.07);border-radius:999px;margin-bottom:6px;overflow:hidden;}
.elecProgressFill{height:100%;background:#22C55E;border-radius:999px;transition:width .4s ease;}
.elecProgressLabel{display:block;text-align:right;font-size:11px;color:#22C55E;font-weight:600;margin-bottom:20px;}
.elecControls{margin-bottom:20px;}
.elecControlsRow{display:flex;gap:12px;align-items:center;flex-wrap:wrap;}
.elecMonthSelect{background:#111827;border:none;color:white;border-radius:14px;padding:12px 14px;font-size:13px;cursor:pointer;white-space:nowrap;}
.elecFilterGroup{display:flex;background:#111827;border-radius:14px;padding:4px;gap:2px;}
.elecFBtn{padding:8px 16px;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;border:none;background:transparent;color:#64748B;transition:.15s;}
.elecFActive{background:rgba(59,130,246,.25);color:#93C5FD;}
.elecReset{display:flex;align-items:center;gap:6px;padding:10px 16px;background:rgba(59,130,246,.1);border:1px solid rgba(59,130,246,.2);color:#93C5FD;border-radius:14px;font-size:13px;font-weight:600;cursor:pointer;}
.elecReset:hover{background:rgba(59,130,246,.2);}
.elecEmpty{text-align:center;padding:48px;color:#475569;font-size:14px;}
.elecSavedBadge{background:rgba(34,197,94,.15);color:#22C55E;padding:4px 10px;border-radius:999px;font-size:11px;font-weight:700;}
.elecMarkPaidBtn{display:inline-flex;align-items:center;gap:6px;padding:7px 16px;background:rgba(34,197,94,.12);border:1px solid rgba(34,197,94,.25);color:#22C55E;border-radius:10px;font-size:12px;font-weight:700;cursor:pointer;transition:.15s;}
.elecMarkPaidBtn:hover{background:rgba(34,197,94,.2);}
.elecEditBtn{display:inline-flex;align-items:center;gap:6px;padding:7px 14px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:#94A3B8;border-radius:10px;font-size:12px;font-weight:600;cursor:pointer;transition:.15s;}
.elecEditBtn:hover{background:rgba(255,255,255,.1);color:white;}

/* Form row */
.elecFormRow td{padding:0 18px 14px !important;background:transparent !important;border-radius:0 !important;}
.elecFormBox{background:rgba(59,130,246,.07);border:1px solid rgba(59,130,246,.2);border-radius:18px;padding:20px 22px;}
.elecFormTitle{font-size:14px;font-weight:700;color:#93C5FD;margin-bottom:16px;}
.elecFormFields{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;}
.elecField{display:flex;flex-direction:column;gap:7px;}
.elecLabel{font-size:12px;color:#94A3B8;text-transform:uppercase;letter-spacing:.05em;}
.elecInput{background:#111827;border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:12px 14px;color:white;font-size:14px;outline:none;width:100%;}
.elecInput:focus{border-color:#3B82F6;}
.elecInput::placeholder{color:#475569;}
.elecError{color:#F87171;font-size:13px;margin-bottom:12px;background:rgba(239,68,68,.1);padding:10px 14px;border-radius:10px;}
.elecFormActions{display:flex;justify-content:flex-end;gap:10px;}
.elecCancelBtn{padding:10px 20px;border-radius:12px;font-size:13px;font-weight:600;cursor:pointer;border:1px solid rgba(255,255,255,.1);background:transparent;color:#94A3B8;transition:.15s;}
.elecCancelBtn:hover{background:rgba(255,255,255,.05);}
.elecSaveBtn{display:flex;align-items:center;gap:6px;padding:10px 22px;border-radius:12px;font-size:13px;font-weight:700;cursor:pointer;border:none;transition:.15s;}
.elecSaveActive{background:#1D4ED8;color:white;}
.elecSaveActive:hover{background:#2563EB;}
.elecSaveDisabled{background:rgba(255,255,255,.06);color:#475569;cursor:not-allowed;}

/* PAY NOW */
.payNowPage{margin-top:20px;}
.pageHeading h1{font-size:40px;font-weight:800;}
.pageHeading p{color:#94A3B8;margin-top:10px;line-height:1.7;}
.payGrid{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:28px;}
.payCard{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.06);border-radius:30px;padding:30px;}
.payCardTitle{font-size:22px;font-weight:700;margin-bottom:24px;}
.qrWrapper{background:white;border-radius:24px;padding:20px;display:flex;justify-content:center;}
.qrWrapper img{width:220px;}
.paySub{margin-top:20px;text-align:center;color:#94A3B8;}
.bankList{display:flex;flex-direction:column;gap:18px;}
.bankRow{display:flex;justify-content:space-between;gap:20px;padding-bottom:14px;border-bottom:1px solid rgba(255,255,255,.06);}
.bankRow span{color:#94A3B8;}
.noticeCard{margin-top:28px;background:rgba(245,158,11,.12);border:1px solid rgba(245,158,11,.25);color:#FCD34D;padding:22px 24px;border-radius:22px;line-height:1.8;}
.historyTop{margin-bottom:24px;display:flex;flex-direction:column;}
.historyTop h1{font-size:36px;font-weight:800;}
.historySub{color:#94A3B8;margin-top:8px;line-height:1.7;}
.paidStatus{background:rgba(34,197,94,.15);color:#22C55E;padding:8px 14px;border-radius:999px;font-size:13px;font-weight:700;}
.pageCard h1{font-size:36px;font-weight:800;}
.rulesText{margin-top:14px;color:#94A3B8;line-height:1.8;}
.rulesList{margin-top:20px;padding-left:20px;line-height:2.2;color:#CBD5E1;}
.pdfCard{margin-top:32px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);border-radius:24px;padding:24px;display:flex;justify-content:space-between;align-items:center;}
.pdfTitle{font-weight:700;font-size:16px;}
.pdfSub{color:#94A3B8;margin-top:4px;font-size:14px;}
.pdfBtn{background:linear-gradient(135deg,#3B82F6,#8B5CF6);color:white;text-decoration:none;padding:14px 22px;border-radius:16px;font-weight:700;}
.contactBox{margin-top:20px;display:flex;flex-direction:column;gap:16px;color:#CBD5E1;line-height:1.8;}
.loader{height:100vh;display:flex;align-items:center;justify-content:center;font-size:18px;}
.mobileNav{display:none;}
.corpusFooter{display:flex;justify-content:space-between;align-items:center;margin-top:20px;padding-top:16px;border-top:1px solid rgba(255,255,255,.06);color:#64748B;font-size:13px;}
.themeToggle{display:flex;align-items:center;gap:8px;width:100%;padding:10px 14px;margin-bottom:10px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:12px;color:#94A3B8;font-size:13px;font-weight:600;cursor:pointer;transition:.2s;}
.themeToggle:hover{background:rgba(255,255,255,.1);color:white;}

/* Balance Sheet header controls */
.showingBadge{display:inline-block;margin-top:8px;font-size:12px;font-weight:600;color:#93C5FD;background:rgba(59,130,246,.12);padding:5px 12px;border-radius:999px;}
.dashMonthPicker{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);color:white;border-radius:12px;padding:10px 14px;font-size:13px;cursor:pointer;outline:none;color-scheme:dark;}
.overallViewBtn{display:flex;align-items:center;gap:6px;padding:10px 20px;background:linear-gradient(135deg,#3B82F6,#8B5CF6);color:white;border:none;border-radius:12px;font-size:13px;font-weight:700;cursor:pointer;transition:.15s;}
.overallViewBtn:hover{opacity:.9;}

/* Overall View modal */
.modalOverlay{position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;z-index:1000;padding:20px;backdrop-filter:blur(2px);}
.modalBox{background:#111827;border:1px solid rgba(255,255,255,.08);border-radius:24px;padding:28px;max-width:920px;width:100%;max-height:95vh;overflow:visible;}
.modalHeader{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;}
.modalTitle{font-size:24px;font-weight:800;color:white;}
.modalSub{color:#94A3B8;font-size:13px;margin-top:6px;}
.modalCloseBtn{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:#94A3B8;width:36px;height:36px;border-radius:10px;cursor:pointer;font-size:16px;flex-shrink:0;}
.modalCloseBtn:hover{background:rgba(255,255,255,.1);color:white;}

/* ── Light Mode overrides ── */
.lightMode{background:#F1F5F9 !important;color:#0F172A !important;}
.lightMode .sidebar{background:#FFFFFF !important;border-right:1px solid #E2E8F0 !important;}
.lightMode .main{background:#F1F5F9 !important;}
.lightMode .sideItem{color:#475569 !important;}
.lightMode .sideItem:hover{background:rgba(59,130,246,.08) !important;color:#2563EB !important;}
.lightMode .sideActive{background:rgba(59,130,246,.12) !important;color:#2563EB !important;}
.lightMode .brandText{color:#0F172A !important;}
.lightMode .eyebrow{color:#94A3B8 !important;}
.lightMode .title{color:#0F172A !important;}
.lightMode .topbar{background:#fff; padding:16px 24px; margin-bottom:16px; border-radius:24px; box-shadow:0 1px 4px rgba(0,0,0,.06);}
.lightMode .kpi,.lightMode .card,.lightMode .tableCard,.lightMode .pageCard{background:#FFFFFF !important;border:1px solid #E2E8F0 !important;box-shadow:0 1px 4px rgba(0,0,0,.06) !important;}
.lightMode .kpiTop div:first-child{color:#64748B !important;}
.lightMode .chartGrid {margin-top: 16px;}
.lightMode .kpiValue{color:#0F172A !important;}
.lightMode .cardTitle,.lightMode .tableTitle{color:#0F172A !important;}
.lightMode .tableSub{color:#64748B !important;}
.lightMode .modernTable tbody tr{background:#F8FAFC !important;}
.lightMode .modernTable tbody tr:hover{background:#EFF6FF !important;}
.lightMode .modernTable td{color:#334155 !important;}
.lightMode .modernTable th{color:#64748B !important;}
.lightMode .category{background:#F1F5F9 !important;color:#475569 !important;}
.lightMode .search{background:#F8FAFC !important;border:1px solid #E2E8F0 !important;}
.lightMode .search input{color:#0F172A !important;}
.lightMode .search input::placeholder{color:#94A3B8 !important;}
.lightMode .search svg{color:#94A3B8 !important;}
.lightMode select{background:#F8FAFC !important;border:1px solid #E2E8F0 !important;color:#334155 !important;}
.lightMode .filters select{background:#F8FAFC !important;border:1px solid #E2E8F0 !important;color:#334155 !important;}
.lightMode .profileName{color:#0F172A !important;}
.lightMode .profileSub{color:#64748B !important;}
.lightMode .profile{background:#F1F5F9 !important;}
.lightMode .payCard{background:#FFFFFF !important;border:1px solid #E2E8F0 !important;box-shadow:0 1px 4px rgba(0,0,0,.06) !important;}
.lightMode .themeToggle{background:#F1F5F9 !important;border:1px solid #E2E8F0 !important;color:#475569 !important;}
.lightMode .themeToggle:hover{background:#E2E8F0 !important;color:#0F172A !important;}
.lightMode .pieListRow{background:#F8FAFC !important;border:1px solid #F1F5F9 !important;}
.lightMode .pieListRow span{color:#334155 !important;}
.lightMode .corpusFooter{border-top:1px solid #E2E8F0 !important;color:#64748B !important;}
.lightMode .elecEmpty{color:#64748B !important;}
.lightMode .elecProgressWrap{background:#E2E8F0 !important;}
.lightMode .elecMonthSelect{background:#F8FAFC !important;border:1px solid #E2E8F0 !important;color:#334155 !important;}
.lightMode .elecReset{background:#EFF6FF !important;border:1px solid #BFDBFE !important;color:#2563EB !important;}
.lightMode .elecFBtn{color:#475569 !important;background:#F8FAFC !important;border:1px solid #E2E8F0 !important;}
.lightMode .elecFActive{background:#EFF6FF !important;color:#2563EB !important;border-color:#93C5FD !important;}
.lightMode .elecFilterGroup{background:#F1F5F9 !important;border:1px solid #E2E8F0 !important;}
.lightMode .elecMonthBadge{background:#EFF6FF !important;color:#2563EB !important;}
.lightMode .toggleBtn{color:#475569 !important;border-color:#E2E8F0 !important;background:#F8FAFC !important;}
.lightMode .toggleBtn:hover{background:#F1F5F9 !important;color:#0F172A !important;}
.lightMode .txTypePills{background:#F1F5F9 !important;}
.lightMode .txPill{color:#64748B !important;}
.lightMode .txPill:hover{color:#0F172A !important;}
.lightMode .txPillActive{background:#2563EB !important;color:white !important;}
.lightMode .mergeBtn{background:#F8FAFC !important;border:1px solid #E2E8F0 !important;color:#64748B !important;}
.lightMode .mergeBtn:hover{background:#F1F5F9 !important;color:#0F172A !important;}
.lightMode .mergeBtnActive{background:linear-gradient(135deg,#7C3AED,#A855F7) !important;color:white !important;border-color:transparent !important;}

/* ── Overall View Modal Styles ── */
.ovBox{max-width:960px;overflow-y:auto;max-height:92vh;}
.ovLastUpdated{color:#64748B;font-size:12px;margin-bottom:20px;}
.ovDateRange{display:flex;align-items:center;gap:6px;padding:8px 14px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:10px;font-size:13px;color:#94A3B8;}
.ovKpiGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px;}
.ovKpi{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);border-radius:16px;padding:14px 16px;}
.ovKpiTop{display:flex;align-items:center;gap:8px;margin-bottom:8px;}
.ovKpiIcon{width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.ovKpiIcon.purple2{background:rgba(139,92,246,.15);color:#8B5CF6;}
.ovKpiIcon.orange{background:rgba(249,115,22,.15);color:#F97316;}
.ovKpiLabel{color:#64748B;font-size:12px;font-weight:500;}
.ovKpiValue{font-size:20px;font-weight:800;color:white;margin-bottom:6px;}
.ovKpiChange{font-size:12px;font-weight:600;margin-bottom:4px;}
.ovKpiChange.up{color:#22C55E;}
.ovKpiChange.down{color:#EF4444;}
.ovBadge{display:inline-block;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:600;margin-top:4px;}
.ovBadge.purple{background:rgba(139,92,246,.15);color:#A78BFA;}
.ovBadge.green2{background:rgba(34,197,94,.12);color:#22C55E;}
.ovChartCard{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);border-radius:16px;padding:16px 18px;margin-bottom:16px;}
.ovChartHeader{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;flex-wrap:wrap;gap:10px;}
.ovChartTitle{font-size:15px;font-weight:700;color:white;margin-bottom:6px;}
.ovChartLegend{display:flex;gap:14px;font-size:12px;color:#94A3B8;}
.ovChartLegend span{display:flex;align-items:center;gap:5px;}
.ovDot{width:10px;height:10px;border-radius:2px;display:inline-block;}
.ovRangeBtns{display:flex;background:rgba(255,255,255,.05);border-radius:10px;padding:3px;gap:2px;}
.ovRangeBtn{padding:6px 12px;border-radius:8px;font-size:12px;font-weight:600;color:#64748B;background:transparent;border:none;cursor:pointer;transition:.15s;}
.ovRangeBtn:hover{color:white;}
.ovRangeActive{background:#22C55E;color:white !important;}
.ovSummary{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);border-radius:16px;padding:16px 18px;}
.ovSummaryTitle{font-size:15px;font-weight:700;color:white;margin-bottom:14px;}
.ovSummaryGrid{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;}
.ovSumItem{display:flex;align-items:flex-start;gap:10px;}
.ovSumIcon{width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.ovSumIcon.orange{background:rgba(249,115,22,.15);color:#F97316;}
.ovSumLabel{color:#64748B;font-size:11px;margin-bottom:3px;}
.ovSumVal{font-size:14px;font-weight:800;color:white;}
.ovSumSub{font-size:11px;color:#64748B;margin-top:2px;}

/* Light mode for Overall View */
.lightMode .ovKpi,.lightMode .ovChartCard,.lightMode .ovSummary{background:#F8FAFC !important;border:1px solid #E2E8F0 !important;}
.lightMode .ovKpiValue,.lightMode .ovSumVal,.lightMode .ovChartTitle,.lightMode .ovSummaryTitle{color:#0F172A !important;}
.lightMode .ovDateRange{background:#F1F5F9 !important;border:1px solid #E2E8F0 !important;color:#475569 !important;}
.lightMode .ovRangeBtns{background:#F1F5F9 !important;}
.lightMode .ovRangeBtn{color:#64748B !important;}
.lightMode .ovRangeActive{background:#22C55E !important;color:white !important;}
.lightMode .toggleActive{background:#EFF6FF !important;color:#2563EB !important;border-color:#93C5FD !important;}
.lightMode .viewToggle{background:#F1F5F9 !important;border:1px solid #E2E8F0 !important;}
.lightMode .refreshBtn,.lightMode .elecReset{background:#EFF6FF !important;border:1px solid #BFDBFE !important;color:#2563EB !important;}
.lightMode .markPaidBtn{background:rgba(34,197,94,.15) !important;color:#15803D !important;}
.lightMode .status.income{background:rgba(34,197,94,.15) !important;color:#15803D !important;}
.lightMode .status.expense{background:rgba(239,68,68,.12) !important;color:#B91C1C !important;}
.lightMode .elecPaidBadge{background:rgba(34,197,94,.15) !important;color:#15803D !important;}
.lightMode .elecPendingBadge{background:rgba(239,68,68,.12) !important;color:#B91C1C !important;}
.lightMode .showingBadge{background:rgba(59,130,246,.1) !important;color:#2563EB !important;}
.lightMode .dashMonthPicker{background:#F8FAFC !important;border:1px solid #E2E8F0 !important;color:#334155 !important;color-scheme:light;}
.lightMode .modalBox{background:#FFFFFF !important;border:1px solid #E2E8F0 !important;}
.lightMode .modalTitle{color:#0F172A !important;}
.lightMode .modalSub{color:#64748B !important;}
.lightMode .modalCloseBtn{background:#F1F5F9 !important;border:1px solid #E2E8F0 !important;color:#64748B !important;}
.lightMode .modalCloseBtn:hover{background:#E2E8F0 !important;color:#0F172A !important;}

@media(max-width:1200px){.layout{grid-template-columns:1fr;}.sidebar{display:none;}}
@media(max-width:768px){
  body{padding-bottom:90px;}
  .main{padding:18px;}
  .title{font-size:28px;}
  .tableHeader{flex-direction:column;align-items:flex-start;gap:18px;}
  .tableHeaderRight{width:100%;align-items:flex-start;gap:12px;}
  .filters{width:100%;flex-direction:column;gap:12px;}
  .search{width:100%;}
  select{width:100%;}
  .kpiGrid,.chartGrid,.payGrid{grid-template-columns:1fr;}
  .pdfCard{flex-direction:column;align-items:flex-start;gap:18px;}
  .viewToggle{display:flex;background:#111827;border-radius:12px;padding:4px;gap:4px;}
  .hideMobile{display:none;}
  .showMobileCards{display:block;}
  .elecControlsRow{flex-direction:column;gap:10px;}
  .elecControlsRow .search{width:100%;}
  .elecMonthSelect{width:100%;}
  .elecFilterGroup{width:100%;justify-content:space-between;}
  .elecReset{width:100%;justify-content:center;}
  .elecFormFields{grid-template-columns:1fr;}
  .mobileNav{position:fixed;bottom:0;left:0;width:100%;height:74px;background:#111827;border-top:1px solid rgba(255,255,255,.08);display:flex;justify-content:space-around;align-items:center;z-index:999;}
  .mobileItem{display:flex;flex-direction:column;align-items:center;gap:6px;color:#94A3B8;font-size:11px;cursor:pointer;}
  .mobileActive{color:white;}
}
`;
