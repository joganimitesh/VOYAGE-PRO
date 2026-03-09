import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import apiClient from "../../api/apiClient";
import { motion } from "framer-motion";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  Users,
  Briefcase,
  IndianRupee,
  TrendingUp,
  Calendar,
  BarChartHorizontal,
  RefreshCw,
  Download,
} from "lucide-react";
import { formatRupee } from "../../utils/format";
import { cn } from "../../utils/helpers";
import EmptyChartPlaceholder from "./EmptyChartPlaceholder";

const COLORS = [
  "#9b4d3f", // Brand Color
  "#2563eb", // Royal Blue
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#d946ef", // Fuchsia
  "#6366f1", // Indigo
  "#14b8a6", // Teal
  "#f43f5e", // Rose
];

// --- Date Helper Functions (Unchanged) ---
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
      return { startDate: null, endDate: null };
  }
  return {
    startDate: toInputDateString(startDate),
    endDate: toInputDateString(endDate),
  };
};

// --- CHART HELPERS (Unchanged) ---
const CustomBarAreaTooltip = ({ active, payload, label, formatter }) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    return (
      <div className="bg-slate-800 dark:bg-slate-900 p-3 rounded-md shadow-lg border border-slate-700">
        <p className="text-slate-400 text-sm">{label}</p>
        <p className="text-white font-semibold">
          {formatter ? formatter(value) : value}
        </p>
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

const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 dark:bg-slate-900 p-3 rounded-md shadow-lg border border-slate-700">
        <p className="text-white font-semibold">{`${payload[0].name}`}</p>
        <p className="text-brand-light">{`Bookings: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontWeight="bold"
      fontSize={14}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const renderLegend = (props) => {
  const { payload } = props;
  return (
    <ul className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 pt-4">
      {payload.map((entry, index) => (
        <li key={`item-${index}`} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm text-slate-600 dark:text-slate-300">
            {entry.value}
          </span>
        </li>
      ))}
    </ul>
  );
};

// --- Main Component ---
const AdminDashboard = () => {
  const dashboardRef = useRef(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBookings: 0,
    totalRevenue: 0,
    totalPackages: 0,
  });
  const [bookingsByMonth, setBookingsByMonth] = useState([]);
  const [revenueByMonth, setRevenueByMonth] = useState([]);
  const [topPackages, setTopPackages] = useState([]);
  const [topCategories, setTopCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // ✅ --- START: ADD THIS STATE ---
  // This new state will trigger the recharts animations
  const [isReady, setIsReady] = useState(false);
  // ✅ --- END: ADD THIS STATE ---

  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    activePreset: "All",
  });

  // --- FETCH DATA (Unchanged) ---
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    // ✅ --- START: RESET READY STATE ---
    // Ensure charts re-animate on every filter change
    setIsReady(false);
    // ✅ --- END: RESET READY STATE ---
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      const queryString = params.toString();

      const endpoints = [
        apiClient.get(`/admin/dashboard/stats?${queryString}`),
        apiClient.get(`/admin/dashboard/bookings-by-month?${queryString}`),
        apiClient.get(`/admin/dashboard/revenue-by-month?${queryString}`),
        apiClient.get(`/admin/dashboard/top-packages?${queryString}`),
        apiClient.get(`/admin/dashboard/top-categories?${queryString}`),
      ];

      const results = await Promise.allSettled(endpoints);

      const setData = (result, setter, defaultVal = []) => {
        if (result.status === "fulfilled") {
          setter(result.value.data || defaultVal);
        } else {
          console.error(
            "Dashboard widget failed to load:",
            result.reason?.response?.data?.message ||
            result.reason?.message
          );
          setter(defaultVal);
        }
      };

      setData(results[0], setStats, {
        totalUsers: 0,
        totalBookings: 0,
        totalRevenue: 0,
        totalPackages: 0,
      });
      setData(results[1], setBookingsByMonth);
      setData(results[2], setRevenueByMonth);
      setData(results[3], setTopPackages);
      setData(results[4], setTopCategories);
    } catch (error) {
      console.error("❌ Error in dashboard data fetch logic:", error);
    } finally {
      setLoading(false);
      // ✅ --- START: ADD DELAYED READY STATE ---
      // This delay allows the `motion.div` cards to animate in first.
      // Then, it mounts the charts, which triggers their animations.
      setTimeout(() => {
        setIsReady(true);
      }, 300); // 300ms delay
      // ✅ --- END: ADD DELAYED READY STATE ---
    }
  }, [filters.startDate, filters.endDate]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // --- Handlers (Unchanged) ---
  const handlePresetClick = (preset) => {
    const { startDate, endDate } = getPresetDates(preset);
    setFilters({ startDate, endDate, activePreset: preset });
  };

  const handleDateChange = (e) => {
    setFilters((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
      activePreset: "Custom",
    }));
  };

  const presetButtons = [
    { label: "1 Day", value: "1D" },
    { label: "7 Days", value: "7D" },
    { label: "30 Days", value: "30D" },
    { label: "1 Year", value: "1Y" },
    { label: "All Time", value: "All" },
  ];

  // --- PDF Export Handler ---
  const handleExportPDF = async () => {
    if (!dashboardRef.current || isExporting) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2,
        useCORS: true,
        ignoreElements: (element) => element.hasAttribute("data-html2canvas-ignore"),
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`dashboard-report-${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (error) {
      console.error("Error exporting PDF:", error);
    } finally {
      setIsExporting(false);
    }
  };

  // ✅ --- START: CHART PLACEHOLDER ---
  // Placeholder to maintain height while charts wait to load
  const ChartPlaceholder = ({ height = 300 }) => (
    <div style={{ height: `${height}px` }} />
  );
  // ✅ --- END: CHART PLACEHOLDER ---


  return (
    <div className="p-4 md:p-8" ref={dashboardRef}>
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-4xl font-extrabold text-slate-800 dark:text-slate-100 mb-10 text-center"
      >
        Admin Dashboard
      </motion.h1>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-slate-600 text-lg">
          Loading Dashboard Data...
        </div>
      ) : (
        <>
          {/* --- SUMMARY STATS (Unchanged) --- */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {/* Stat Boxes */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md flex flex-col items-center text-center border border-slate-100 dark:border-slate-700"
            >
              <Users className="text-brand mb-3" size={32} />
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                {stats.totalUsers}
              </h3>
              <p className="text-slate-500 dark:text-slate-400">Total Users</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md flex flex-col items-center text-center border border-slate-100 dark:border-slate-700"
            >
              <Briefcase className="text-brand mb-3" size={32} />
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                {stats.totalBookings}
              </h3>
              <p className="text-slate-500 dark:text-slate-400">
                Active Bookings
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md flex flex-col items-center text-center border border-slate-100 dark:border-slate-700"
            >
              <IndianRupee className="text-brand mb-3" size={32} />
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                {formatRupee(stats.totalRevenue)}
              </h3>
              <p className="text-slate-500 dark:text-slate-400">
                Total Revenue
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md flex flex-col items-center text-center border border-slate-100 dark:border-slate-700"
            >
              <TrendingUp className="text-brand mb-3" size={32} />
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                {stats.totalPackages}
              </h3>
              <p className="text-slate-500 dark:text-slate-400">
                Active Packages
              </p>
            </motion.div>
          </div>

          {/* --- FILTER BAR --- */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm mb-8 border border-slate-100 dark:border-slate-700">
            <div className="overflow-x-auto scrollbar-hide pb-2">
              <div className="inline-flex min-w-full items-center justify-start gap-4 p-1 pr-4">
                {/* Preset Segmented Control */}
                <div className="bg-slate-100 dark:bg-slate-700/50 p-1 rounded-lg flex items-center shrink-0">
                  {presetButtons.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handlePresetClick(opt.value)}
                      className={cn(
                        "px-4 py-1.5 text-sm rounded-md font-medium transition-all duration-200 whitespace-nowrap",
                        filters.activePreset === opt.value
                          ? "bg-white dark:bg-slate-800 text-brand shadow-sm"
                          : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-600/50"
                      )}
                      data-html2canvas-ignore // Ignore filter controls in PDF if desired, but user likely wants context. Keeping for now.
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
                      name="startDate"
                      value={filters.startDate || ""}
                      onChange={handleDateChange}
                      className="!bg-transparent !border-none text-slate-700 dark:text-slate-200 text-sm font-medium focus:ring-0 cursor-pointer outline-none w-32"
                    />
                    <span className="text-slate-400 font-medium text-xs">TO</span>
                    <input
                      type="date"
                      name="endDate"
                      value={filters.endDate || ""}
                      onChange={handleDateChange}
                      className="!bg-transparent !border-none text-slate-700 dark:text-slate-200 text-sm font-medium focus:ring-0 cursor-pointer outline-none w-32"
                    />
                  </div>
                </div>

                {/* ACTION BUTTONS (New) */}
                <div className="ml-auto flex items-center gap-2" data-html2canvas-ignore>
                  <button
                    onClick={fetchDashboardData}
                    className="p-2 text-slate-500 hover:text-brand hover:bg-brand/10 dark:text-slate-400 dark:hover:text-brand-light dark:hover:bg-slate-700/50 rounded-lg transition-colors"
                    title="Refresh Data"
                  >
                    <RefreshCw size={18} />
                  </button>
                  <button
                    onClick={handleExportPDF}
                    disabled={isExporting}
                    className="flex items-center gap-2 px-3 py-2 bg-brand hover:bg-brand-hover text-white text-sm font-medium rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isExporting ? (
                      <RefreshCw size={16} className="animate-spin" />
                    ) : (
                      <Download size={16} />
                    )}
                    <span>{isExporting ? "Saving..." : "Export"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* --- CHARTS --- */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* BOOKINGS */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border border-slate-100 dark:border-slate-700"
            >
              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4">
                📅 Bookings (Active)
              </h3>
              {/* ✅ --- START: USE isReady STATE --- */}
              {isReady ? (
                bookingsByMonth.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={bookingsByMonth} isAnimationActive={true}>
                      <defs>
                        <linearGradient
                          id="colorBookings"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#9b4d3f"
                            stopOpacity={0.9}
                          />
                          <stop
                            offset="95%"
                            stopColor="#7a3a2f"
                            stopOpacity={0.8}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                      <XAxis dataKey="label" stroke="#94a3b8" minTickGap={10} />
                      <YAxis stroke="#94a3b8" tickFormatter={formatYAxis} />
                      <Tooltip content={<CustomBarAreaTooltip />} />
                      <Bar
                        dataKey="count"
                        fill="url(#colorBookings)"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={60}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChartPlaceholder message="No booking data for this period." />
                )
              ) : (
                <ChartPlaceholder height={300} />
              )}
              {/* ✅ --- END: USE isReady STATE --- */}
            </motion.div>

            {/* REVENUE */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border border-slate-100 dark:border-slate-700"
            >
              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4">
                💰 Revenue (Approved)
              </h3>
              {/* ✅ --- START: USE isReady STATE --- */}
              {isReady ? (
                revenueByMonth.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    {revenueByMonth.length > 1 ? (
                      <AreaChart data={revenueByMonth} isAnimationActive={true}>
                        <defs>
                          <linearGradient
                            id="colorTeal"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#9b4d3f"
                              stopOpacity={0.8}
                            />
                            <stop
                              offset="95%"
                              stopColor="#7a3a2f"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                        <XAxis
                          dataKey="label"
                          stroke="#94a3b8"
                          minTickGap={10}
                        />
                        <YAxis stroke="#94a3b8" tickFormatter={formatYAxis} />
                        <Tooltip
                          content={
                            <CustomBarAreaTooltip formatter={formatRupee} />
                          }
                        />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          stroke="#9b4d3f"
                          fillOpacity={1}
                          fill="url(#colorTeal)"
                          strokeWidth={2}
                          activeDot={{ r: 6, stroke: "white", strokeWidth: 2 }}
                        />
                      </AreaChart>
                    ) : (
                      <BarChart data={revenueByMonth} isAnimationActive={true}>
                        <defs>
                          <linearGradient
                            id="colorTealBar"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#9b4d3f"
                              stopOpacity={0.9}
                            />
                            <stop
                              offset="95%"
                              stopColor="#7a3a2f"
                              stopOpacity={0.8}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                        <XAxis dataKey="label" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" tickFormatter={formatYAxis} />
                        <Tooltip
                          content={
                            <CustomBarAreaTooltip formatter={formatRupee} />
                          }
                        />
                        <Bar
                          dataKey="revenue"
                          fill="url(#colorTealBar)"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={60}
                        />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                ) : (
                  <EmptyChartPlaceholder message="No revenue data for this period." />
                )
              ) : (
                <ChartPlaceholder height={300} />
              )}
              {/* ✅ --- END: USE isReady STATE --- */}
            </motion.div>

            {/* TOP PACKAGES & CATEGORIES */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md lg:col-span-2 border border-slate-100 dark:border-slate-700"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                {/* LEFT PIE */}
                <div>
                  <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2 text-center">
                    🌍 Top Packages by Bookings
                  </h3>
                  {/* ✅ --- START: USE isReady STATE --- */}
                  {isReady ? (
                    topPackages.length > 0 ? (
                      <ResponsiveContainer width="100%" height={400}>
                        <PieChart>
                          <Pie
                            data={topPackages}
                            dataKey="count"
                            nameKey="packageName"
                            cx="50%"
                            cy="55%"
                            outerRadius={120}
                            labelLine={false}
                            label={renderCustomizedLabel}
                            fill="#8884d8"
                            isAnimationActive={true}
                          >
                            {topPackages.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomPieTooltip />} />
                          <Legend
                            layout="horizontal"
                            align="center"
                            verticalAlign="bottom"
                            content={renderLegend}
                            wrapperStyle={{ paddingTop: "20px" }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <EmptyChartPlaceholder message="No package data." />
                    )
                  ) : (
                    <ChartPlaceholder height={400} />
                  )}
                  {/* ✅ --- END: USE isReady STATE --- */}
                </div>

                {/* RIGHT BAR */}
                <div>
                  <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4 text-center">
                    <BarChartHorizontal className="inline-block mr-2 text-brand" />
                    Top Categories by Revenue
                  </h3>
                  {/* ✅ --- START: USE isReady STATE --- */}
                  {isReady ? (
                    topCategories.length > 0 ? (
                      <ResponsiveContainer width="100%" height={400}>
                        {topCategories.length > 1 ? (
                          <BarChart
                            data={topCategories}
                            layout="vertical"
                            margin={{ left: 20, right: 30 }}
                            isAnimationActive={true}
                          >
                            <defs>
                              {COLORS.map((color, index) => (
                                <linearGradient
                                  key={`colorCatH-${index}`}
                                  id={`colorCatH-${index}`}
                                  x1="0"
                                  y1="0"
                                  x2="1"
                                  y2="0"
                                >
                                  <stop
                                    offset="5%"
                                    stopColor={color}
                                    stopOpacity={0.8}
                                  />
                                  <stop
                                    offset="95%"
                                    stopColor={color}
                                    stopOpacity={1}
                                  />
                                </linearGradient>
                              ))}
                            </defs>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#475569"
                            />
                            <XAxis
                              type="number"
                              stroke="#94a3b8"
                              tickFormatter={formatYAxis}
                            />
                            <YAxis
                              dataKey="category"
                              type="category"
                              stroke="#94a3b8"
                              width={80}
                              tick={{ fontSize: 12 }}
                              interval={0}
                            />
                            <Tooltip
                              content={
                                <CustomBarAreaTooltip formatter={formatRupee} />
                              }
                            />
                            <Bar
                              dataKey="revenue"
                              radius={[0, 6, 6, 0]}
                              maxBarSize={60}
                            >
                              {topCategories.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={`url(#colorCatH-${index % COLORS.length
                                    })`}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        ) : (
                          <BarChart
                            data={topCategories}
                            layout="horizontal"
                            isAnimationActive={true}
                          >
                            <defs>
                              {COLORS.map((color, index) => (
                                <linearGradient
                                  key={`colorCatV-${index}`}
                                  id={`colorCatV-${index}`}
                                  x1="0"
                                  y1="0"
                                  x2="0"
                                  y2="1"
                                >
                                  <stop
                                    offset="5%"
                                    stopColor={color}
                                    stopOpacity={1}
                                  />
                                  <stop
                                    offset="95%"
                                    stopColor={color}
                                    stopOpacity={0.8}
                                  />
                                </linearGradient>
                              ))}
                            </defs>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#475569"
                            />
                            <XAxis dataKey="category" stroke="#94a3b8" />
                            <YAxis
                              stroke="#94a3b8"
                              tickFormatter={formatYAxis}
                            />
                            <Tooltip
                              content={
                                <CustomBarAreaTooltip formatter={formatRupee} />
                              }
                            />
                            <Bar
                              dataKey="revenue"
                              radius={[6, 6, 0, 0]}
                              maxBarSize={80}
                            >
                              {topCategories.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={`url(#colorCatV-${index % COLORS.length
                                    })`}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        )}
                      </ResponsiveContainer>
                    ) : (
                      <EmptyChartPlaceholder message="No category data." />
                    )
                  ) : (
                    <ChartPlaceholder height={350} />
                  )}
                  {/* ✅ --- END: USE isReady STATE --- */}
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;