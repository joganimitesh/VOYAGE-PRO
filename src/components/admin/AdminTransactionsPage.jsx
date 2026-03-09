import React, { useEffect, useState, useMemo, useRef } from "react";
import apiClient from "../../api/apiClient";
import { motion } from "framer-motion";
import { formatRupee } from "../../utils/format";
import { Save, Search, IndianRupee, Calendar, TrendingUp, CheckCircle, Clock, XCircle, RefreshCw, Download, CarTaxiFront } from "lucide-react";
import { saveAs } from "file-saver";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  ComposedChart,
  Line,
  Area,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";
import Button from "../ui/Button";
import { cn } from "../../utils/helpers";
import EmptyChartPlaceholder from "./EmptyChartPlaceholder";

// --- Date Helpers (Unchanged) ---
const toInputDateString = (date) => {
  if (!date) return "";
  return date.toISOString().split("T")[0];
};

const getPresetDates = (preset) => {
  const endDate = new Date();
  let startDate = new Date();

  switch (preset) {
    case "1D":
      startDate.setDate(endDate.getDate() - 1);
      break;
    case "7D":
      startDate.setDate(endDate.getDate() - 7);
      break;
    case "30D":
      startDate.setMonth(endDate.getMonth() - 1);
      break;
    case "1Y":
      startDate.setFullYear(endDate.getFullYear() - 1);
      break;
    case "All":
    default:
      return { startDate: "", endDate: "" };
  }

  return {
    startDate: toInputDateString(startDate),
    endDate: toInputDateString(endDate),
  };
};

const presetButtons = [
  { label: "1 Day", value: "1D" },
  { label: "7 Days", value: "7D" },
  { label: "30 Days", value: "30D" },
  { label: "1 Year", value: "1Y" },
  { label: "All Time", value: "All" },
];

// --- Chart Helpers (Unchanged) ---
const CustomComposedTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const revenuePayload = payload.find((p) => p.dataKey === "revenue");
    const countPayload = payload.find((p) => p.dataKey === "count");
    const revenue = revenuePayload?.value ?? revenuePayload?.payload?.revenue;
    const count = countPayload?.value ?? countPayload?.payload?.count;

    return (
      <div className="bg-slate-800 dark:bg-slate-900 p-3 rounded-md shadow-lg border border-slate-700">
        <p className="text-slate-400 text-sm">{label}</p>
        {revenue != null && (
          <p className="text-brand-light font-semibold">
            {`Revenue: ${formatRupee(revenue)}`}
          </p>
        )}
        {count != null && (
          <p className="text-sky-400 font-semibold">
            {`Transactions: ${count}`}
          </p>
        )}
      </div>
    );
  }
  return null;
};

const formatYAxis = (tick) => {
  if (tick >= 100000) return `${tick / 100000}L`;
  if (tick >= 1000) return `${tick / 1000}K`;
  return tick;
};

// ✅ --- START: ADD THIS HELPER COMPONENT ---
// Placeholder to maintain height while chart waits to load
const ChartPlaceholder = ({ height = 300 }) => (
  <div style={{ height: `${height}px` }} />
);
// ✅ --- END: ADD THIS HELPER COMPONENT ---

// --- Main Component ---
const AdminTransactionsPage = () => {
  const chartRef = useRef(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // ✅ --- START: ADD THIS STATE ---
  const [isReady, setIsReady] = useState(false);
  // ✅ --- END: ADD THIS STATE ---

  const [chartFilters, setChartFilters] = useState({
    dateStart: "",
    dateEnd: "",
    activePreset: "All",
  });

  const [tableFilters, setTableFilters] = useState({
    search: "",
    status: "All",
    dateStart: "",
    dateEnd: "",
    activePreset: "All",
  });

  const [entriesToShow, setEntriesToShow] = useState(10);

  // --- Fetch Transactions ---
  const fetchTransactions = async () => {
    setLoading(true);
    // ✅ --- START: RESET READY STATE ---
    setIsReady(false);
    // ✅ --- END: RESET READY STATE ---
    try {
      const { data } = await apiClient.get("/requests/all");
      const formattedData = (data.data || []).map((req) => ({
        _id: req._id,
        userName: req.clientName,
        packageName: req.packageName,
        amount: req.totalAmount,
        transactionId: req.transactionId,
        status: req.status,
        date: req.createdAt,
        cabBooking: req.cabBooking, // ✅ Include Cab Booking Status
      }));
      setTransactions(formattedData);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      alert("Failed to fetch transactions.");
    } finally {
      setLoading(false);
      // ✅ --- START: ADD DELAYED READY STATE ---
      setTimeout(() => {
        setIsReady(true);
      }, 300); // 300ms delay
      // ✅ --- END: ADD DELAYED READY STATE ---
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // --- Chart Filter Handlers (Unchanged) ---
  const handleChartDateChange = (e) => {
    const { name, value } = e.target;
    setChartFilters((prev) => ({
      ...prev,
      [name]: value,
      activePreset: "Custom",
    }));
  };

  const handleChartPresetClick = (preset) => {
    const { startDate, endDate } = getPresetDates(preset);
    setChartFilters({
      dateStart: startDate,
      dateEnd: endDate,
      activePreset: preset,
    });
  };

  const handleTableFilterChange = (e) => {
    const { name, value } = e.target;
    setTableFilters((prev) => ({
      ...prev,
      [name]: value,
      activePreset:
        name === "dateStart" || name === "dateEnd"
          ? "Custom"
          : prev.activePreset,
    }));
  };

  const handleTablePresetClick = (preset) => {
    const { startDate, endDate } = getPresetDates(preset);
    setTableFilters((prev) => ({
      ...prev,
      dateStart: startDate,
      dateEnd: endDate,
      activePreset: preset,
    }));
  };

  // --- Chart Data (Unchanged) ---
  const chartData = useMemo(() => {
    const { dateStart, dateEnd } = chartFilters;
    let chartFilteredTxs = [...transactions];

    if (dateStart) {
      const start = new Date(dateStart);
      chartFilteredTxs = chartFilteredTxs.filter(
        (t) => new Date(t.date) >= start
      );
    }

    if (dateEnd) {
      const end = new Date(dateEnd);
      end.setHours(23, 59, 59, 999);
      chartFilteredTxs = chartFilteredTxs.filter(
        (t) => new Date(t.date) <= end
      );
    }

    let durationInDays = 999;
    if (dateStart && dateEnd) {
      durationInDays =
        (new Date(dateEnd) - new Date(dateStart)) / (1000 * 60 * 60 * 24);
    } else if (dateStart && !dateEnd) {
      durationInDays =
        (new Date() - new Date(dateStart)) / (1000 * 60 * 60 * 24);
    }

    const isShortRange = durationInDays <= 31;

    const aggregated = chartFilteredTxs.reduce((acc, curr) => {
      if (curr.status !== "Approved" && curr.status !== "Completed") return acc;

      const date = new Date(curr.date);
      const key = isShortRange
        ? date.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
        })
        : date.toLocaleString("en-IN", { month: "short", year: "2-digit" });

      if (!acc[key]) {
        acc[key] = { revenue: 0, count: 0, originalDate: date, label: key };
      }

      acc[key].revenue += curr.amount;
      acc[key].count += 1;
      return acc;
    }, {});

    return Object.values(aggregated).sort(
      (a, b) => a.originalDate - b.originalDate
    );
  }, [chartFilters, transactions]);

  // --- Table Filters (Unchanged) ---
  const filteredTransactions = useMemo(() => {
    let f = [...transactions];
    const { search, status, dateStart, dateEnd } = tableFilters;

    if (search.trim()) {
      f = f.filter(
        (t) =>
          (t.userName || "")
            .toLowerCase()
            .includes(search.toLowerCase()) ||
          (t.packageName || "")
            .toLowerCase()
            .includes(search.toLowerCase())
      );
    }

    if (status !== "All") {
      f = f.filter((t) => t.status === status);
    }

    if (dateStart) {
      const start = new Date(dateStart);
      f = f.filter((t) => new Date(t.date) >= start);
    }

    if (dateEnd) {
      const end = new Date(dateEnd);
      end.setHours(23, 59, 59, 999);
      f = f.filter((t) => new Date(t.date) <= end);
    }

    return f;
  }, [tableFilters, transactions]);

  const totalFiltered = filteredTransactions.length;
  const displayCount =
    entriesToShow === -1
      ? totalFiltered
      : Math.min(entriesToShow, totalFiltered);

  // --- CSV Export (Unchanged) ---
  const handleExportCSV = () => {
    if (!filteredTransactions.length) {
      alert("No transactions to export.");
      return;
    }

    const csvRows = [
      ["User", "Package", "Amount", "Transaction ID", "Status", "Cab Booking", "Date"], // ✅ Added Column
      ...filteredTransactions.map((t) => [
        `"${t.userName || ""}"`,
        `"${t.packageName || ""}"`,
        t.amount,
        t.transactionId || "",
        t.status || "",
        t.cabBooking ? "Yes" : "No", // ✅ Export Data
        new Date(t.date).toLocaleDateString(),
      ]),
    ];

    const csvContent = csvRows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    saveAs(blob, `transactions-${Date.now()}.csv`);
  };

  // --- PDF Export for Chart & Insights ---
  const handleExportChartPDF = async () => {
    if (!chartRef.current || isExporting) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(chartRef.current, {
        scale: 2,
        useCORS: true,
        ignoreElements: (element) => element.hasAttribute("data-html2canvas-ignore"),
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      // Add title
      pdf.setFontSize(18);
      pdf.setTextColor(31, 41, 55);
      pdf.text("Transactions Report", pdfWidth / 2, 15, { align: "center" });
      pdf.setFontSize(10);
      pdf.setTextColor(100);
      pdf.text(`Generated on ${new Date().toLocaleDateString("en-IN")}`, pdfWidth / 2, 22, { align: "center" });

      // Add chart image
      pdf.addImage(imgData, "PNG", 0, 28, pdfWidth, pdfHeight);
      pdf.save(`transactions-report-${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (error) {
      console.error("Error exporting PDF:", error);
      alert("Failed to export PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-8 bg-slate-100 dark:bg-slate-900 min-h-screen">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-4xl font-extrabold text-slate-800 dark:text-slate-100 mb-8 text-center"
      >
        Transactions
      </motion.h1>

      {/* --- Chart Filter Section --- */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm mb-8 border border-slate-100 dark:border-slate-700">
        <div className="overflow-x-auto scrollbar-hide pb-2">
          <div className="inline-flex min-w-full items-center justify-between gap-4 p-1 pr-4">
            <div className="flex items-center gap-4">
              {/* Preset Segmented Control */}
              <div className="bg-slate-100 dark:bg-slate-700/50 p-1 rounded-lg flex items-center shrink-0">
                {presetButtons.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleChartPresetClick(opt.value)}
                    className={cn(
                      "px-4 py-1.5 text-sm rounded-md font-medium transition-all duration-200 whitespace-nowrap",
                      chartFilters.activePreset === opt.value
                        ? "bg-white dark:bg-slate-800 text-brand shadow-sm"
                        : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-600/50"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Styled Date Picker Group */}
              <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 p-1.5 rounded-lg shrink-0">
                <div className="pl-2 text-slate-400">
                  <Calendar size={18} />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    name="dateStart"
                    value={chartFilters.dateStart}
                    onChange={handleChartDateChange}
                    className="!bg-transparent !border-none text-slate-700 dark:text-slate-200 text-sm font-medium focus:ring-0 cursor-pointer outline-none w-32"
                  />
                  <span className="text-slate-400 font-medium text-xs">TO</span>
                  <input
                    type="date"
                    name="dateEnd"
                    value={chartFilters.dateEnd}
                    onChange={handleChartDateChange}
                    className="!bg-transparent !border-none text-slate-700 dark:text-slate-200 text-sm font-medium focus:ring-0 cursor-pointer outline-none w-32"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={fetchTransactions}
                className="p-2 text-slate-500 hover:text-brand hover:bg-brand/10 dark:text-slate-400 dark:hover:text-brand-light dark:hover:bg-slate-700/50 rounded-lg transition-colors"
                title="Refresh Data"
              >
                <RefreshCw size={18} />
              </button>
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-3 py-2 bg-brand hover:bg-brand-hover text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
              >
                <Download size={16} />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- Summary Stats Cards --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-md flex items-center gap-4 border border-slate-100 dark:border-slate-700"
        >
          <div className="p-3 bg-brand/10 dark:bg-brand/20 rounded-lg">
            <TrendingUp className="text-brand dark:text-brand-light" size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Total Transactions</p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {transactions.length}
            </h3>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-md flex items-center gap-4 border border-slate-100 dark:border-slate-700"
        >
          <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
            <IndianRupee className="text-amber-600 dark:text-amber-400" size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Total Revenue</p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {formatRupee(
                transactions
                  .filter((t) => t.status === "Approved" || t.status === "Completed")
                  .reduce((sum, t) => sum + (t.amount || 0), 0)
              )}
            </h3>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-md flex items-center gap-4 border border-slate-100 dark:border-slate-700"
        >
          <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-lg">
            <CheckCircle className="text-green-600 dark:text-green-400" size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Approved</p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {transactions.filter((t) => t.status === "Approved" || t.status === "Completed").length}
            </h3>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-md flex items-center gap-4 border border-slate-100 dark:border-slate-700"
        >
          <div className="p-3 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
            <Clock className="text-amber-600 dark:text-amber-400" size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Pending</p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {transactions.filter((t) => t.status === "Pending").length}
            </h3>
          </div>
        </motion.div>
      </div>

      {/* --- Chart Section --- */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md mb-10"
      >
        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
          <IndianRupee className="text-brand" /> Revenue & Transaction Volume
        </h3>

        {/* ✅ --- START: USE isReady STATE --- */}
        {isReady ? (
          chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={chartData} isAnimationActive={true}>
                <defs>
                  <linearGradient id="colorBrand" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9b4d3f" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#9b4d3f" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis dataKey="label" stroke="#94a3b8" minTickGap={10} />
                <YAxis
                  yAxisId="left"
                  stroke="#9b4d3f"
                  tickFormatter={formatYAxis}
                  label={{
                    value: "Revenue",
                    angle: -90,
                    position: "insideLeft",
                    fill: "#9b4d3f",
                  }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#0ea5e9"
                  label={{
                    value: "Transactions",
                    angle: 90,
                    position: "insideRight",
                    fill: "#0ea5e9",
                  }}
                />

                <Tooltip content={<CustomComposedTooltip />} />
                <Legend />

                {chartData.length > 1 ? (
                  <>
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="revenue"
                      stroke="#9b4d3f"
                      fillOpacity={1}
                      fill="url(#colorBrand)"
                      name="Revenue"
                      activeDot={{ r: 6, stroke: "white", strokeWidth: 2 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="count"
                      stroke="#0ea5e9"
                      strokeWidth={2}
                      name="Transactions"
                      activeDot={{ r: 6, stroke: "white", strokeWidth: 2 }}
                    />
                  </>
                ) : (
                  <>
                    <Bar
                      yAxisId="left"
                      dataKey="revenue"
                      fill="#9b4d3f"
                      name="Revenue"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={60}
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="count"
                      fill="#0ea5e9"
                      name="Transactions"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={60}
                    />
                  </>
                )}
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChartPlaceholder message="No revenue data for the selected date range." />
          )
        ) : (
          <ChartPlaceholder height={300} />
        )}
        {/* ✅ --- END: USE isReady STATE --- */}
      </motion.div>

      {/* --- Table Filter Section (Unchanged) --- */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-md mb-10 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left Filters */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Search size={18} className="text-slate-400" />
              <input
                type="text"
                name="search"
                placeholder="Search by user or package..."
                value={tableFilters.search}
                onChange={handleTableFilterChange}
                className="border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-brand w-full bg-transparent"
              />
            </div>

            <select
              name="status"
              value={tableFilters.status}
              onChange={handleTableFilterChange}
              className="border border-slate-300 dark:border-slate-700 dark:bg-slate-800 rounded-md px-3 py-2 focus:ring-2 focus:ring-brand w-full sm:w-auto"
            >
              <option value="All">All Statuses</option>
              <option value="Approved">Approved</option>
              <option value="Completed">Completed</option>
              <option value="Failed">Failed</option>
              <option value="Pending">Pending</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* Right Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label
                htmlFor="entries-trans"
                className="text-sm text-slate-500 dark:text-slate-400 flex-shrink-0"
              >
                Show:
              </label>
              <select
                id="entries-trans"
                value={entriesToShow}
                onChange={(e) =>
                  setEntriesToShow(Number(e.target.value))
                }
                className="border border-slate-300 dark:border-slate-700 dark:bg-slate-800 rounded-md px-3 py-2 focus:ring-2 focus:ring-brand w-full"
              >
                <option value={10}>10 Entries</option>
                <option value={25}>25 Entries</option>
                <option value={50}>50 Entries</option>
                <option value={-1}>All Entries</option>
              </select>
            </div>

            <Button
              onClick={handleExportCSV}
              className="bg-brand hover:bg-brand-hover text-white flex items-center gap-2 px-4 py-2 rounded-md w-full sm:w-auto"
            >
              <Save size={16} /> Export CSV
            </Button>
          </div>
        </div>

        <hr className="dark:border-slate-700" />

        {/* Date Filters */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex-shrink-0 flex flex-wrap justify-center gap-2">
            {presetButtons.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleTablePresetClick(opt.value)}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-md font-semibold transition-colors",
                  tableFilters.activePreset === opt.value
                    ? "bg-brand text-white shadow-md"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 w-full lg:w-auto">
            <input
              type="date"
              name="dateStart"
              value={tableFilters.dateStart}
              onChange={handleTableFilterChange}
              className="border border-slate-300 dark:border-slate-700 dark:bg-slate-800 rounded-md px-2 py-2 focus:ring-2 focus:ring-brand w-full sm:w-auto"
            />
            <span className="dark:text-slate-300">to</span>
            <input
              type="date"
              name="dateEnd"
              value={tableFilters.dateEnd}
              onChange={handleTableFilterChange}
              className="border border-slate-300 dark:border-slate-700 dark:bg-slate-800 rounded-md px-2 py-2 focus:ring-2 focus:ring-brand w-full sm:w-auto"
            />
          </div>
        </div>
      </div>

      {/* --- Transactions Table (Unchanged) --- */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md overflow-x-auto">
        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2">
          Filtered Transactions
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Showing {displayCount} of {totalFiltered} entries.
        </p>

        <table className="min-w-full text-sm text-slate-700 dark:text-slate-300">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-semibold text-left">
              <th className="py-3 px-4">User</th>
              <th className="py-3 px-4">Package</th>
              <th className="py-3 px-4">Amount</th>
              <th className="py-3 px-4">Transaction ID</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Date</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan="6"
                  className="text-center py-6 text-slate-500 dark:text-slate-400"
                >
                  Loading transactions...
                </td>
              </tr>
            ) : filteredTransactions.length === 0 ? (
              <tr>
                <td
                  colSpan="6"
                  className="text-center py-6 text-slate-500 dark:text-slate-400"
                >
                  No transactions found matching your filters.
                </td>
              </tr>
            ) : (
              filteredTransactions
                .slice(0, entriesToShow === -1 ? undefined : entriesToShow)
                .map((t) => (
                  <tr
                    key={t._id}
                    className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-200"
                  >
                    <td className="py-3 px-4">{t.userName || "N/A"}</td>
                    <td className="py-3 px-4">{t.packageName || "N/A"}</td>
                    <td className="py-3 px-4 text-brand dark:text-brand-light font-semibold">
                      {formatRupee(t.amount)}
                      {t.cabBooking && (
                        <div className="text-[10px] text-brand dark:text-brand-light mt-0.5 flex items-center gap-0.5 font-medium">
                          <CarTaxiFront size={10} /> + Cab
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">{t.transactionId || "-"}</td>
                    <td className="py-3 px-4">
                      <span
                        className={cn(
                          "px-3 py-1 text-xs rounded-full font-semibold",
                          t.status === "Approved" ||
                            t.status === "Completed"
                            ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                            : t.status === "Failed"
                              ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                              : t.status === "Cancelled"
                                ? "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                                : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                        )}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {t.date
                        ? new Date(t.date).toLocaleDateString()
                        : "Unknown"}
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminTransactionsPage;