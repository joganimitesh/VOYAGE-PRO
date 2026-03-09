import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import apiClient from "../../api/apiClient";
import { cn } from "../../utils/helpers";
import { formatRupee } from "../../utils/format";
import {
  Package,
  Calendar,
  Users,
  Info,
  Hash,
  FileText,
  XCircle,
  Search,
  Repeat2,
  Filter,
  List,
  MapPin,
  Link, // ✅ Added for Add-on indicator
  CarTaxiFront, // ✅ Added for Cab indicator
} from "lucide-react";
import Button from "../ui/Button";

/* ===============================
🎫 Booking Card Component
=============================== */
const BookingCard = ({ booking, onCancel, onResendInvoice, isResending, onRebook, onExtend, onViewDetails }) => {
  const getStatusClasses = (status) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-700";
      case "Rejected":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-300 dark:border-red-700";
      case "Cancelled":
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600";
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-700";
    }
  };

  const canCancel = booking.status === "Pending" || booking.status === "Approved";
  const canRequestInvoice = booking.status === "Approved" || booking.status === "Completed";

  // ✅ --- START: Updated Rebook Logic ---
  const canRebook =
    booking.packageId && booking.packageName !== "Deleted Package" && booking.isPackageActive;

  // ✅ --- EXTEND TRIP LOGIC ---
  // Allow extension if status is Approved (Active/Upcoming)
  const canExtend = booking.status === "Approved";
  // ✅ --- END EXTEND TRIP LOGIC ---
  // ✅ --- END: Updated Rebook Logic ---

  // ✅ --- DATE LOGIC ---
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = new Date(booking.date);
  const endDate = new Date(booking.date);
  endDate.setDate(endDate.getDate() + (booking.duration || 1));

  const isCompletedTrip = (booking.status === "Approved" || booking.status === "Completed") && endDate < today;
  const isActiveTrip = booking.status === "Approved" && startDate <= today && endDate >= today;
  // ✅ --- END DATE LOGIC ---

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={cn(
        "rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow relative",
        isCompletedTrip
          ? "bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 grayscale-[0.8] opacity-90"
          : isActiveTrip
            ? "bg-white dark:bg-slate-800 border-2 border-brand shadow-brand/10 ring-4 ring-brand/5 dark:ring-brand/20"
            : booking.isAddOn
              ? "bg-indigo-50 dark:bg-indigo-950/30 border-2 border-indigo-300 dark:border-indigo-700"
              : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
      )}
    >
      <button
        onClick={() => onViewDetails(booking._id)}
        className="absolute top-6 left-5 text-slate-400 hover:text-brand dark:hover:text-brand-light transition-colors z-20"
        title="View Details"
      >
        <Info size={22} />
      </button>

      <div className="p-6 pl-16">
        {/* ✅ Add-on Banner */}
        {booking.isAddOn && (
          <div className="flex items-center gap-2 mb-3 text-indigo-700 dark:text-indigo-300">
            <Link size={14} />
            <span className="text-xs font-semibold uppercase tracking-wide">
              {booking.packageName === booking.parentTripName ? (
                // Same Package Name -> Member Extension
                <>Additional Guests • Added to existing trip</>
              ) : (
                // Different Package -> Trip Extension (New Leg)
                <>Trip Extension {booking.parentTripName && `• From: ${booking.parentTripName}`}</>
              )}
            </span>
          </div>
        )}

        {/* ✅ Trip Status Badges */}
        {isCompletedTrip && (
          <div className="absolute top-0 right-0 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs px-3 py-1 rounded-bl-lg font-bold uppercase tracking-wide z-10">
            Trip Completed
          </div>
        )}
        {isActiveTrip && (
          <div className="flex items-center gap-2 mb-3 p-2 bg-brand/10 dark:bg-brand/20 text-brand-hover dark:text-brand-light rounded-md border border-brand/20 animate-pulse">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-light opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand"></span>
            </span>
            <span className="text-xs font-bold uppercase tracking-wide">Happening Now • En Route</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {booking.packageName}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Booked on: {new Date(booking.createdAt).toLocaleDateString("en-IN")}
            </p>
          </div>

          <span
            className={cn(
              "px-4 py-1.5 text-sm font-semibold rounded-full border mt-2 sm:mt-0",
              getStatusClasses(booking.status)
            )}
          >
            {booking.status}
          </span>
        </div>

        <hr className="my-4 dark:border-slate-700" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-slate-700 dark:text-slate-300">
          <div className="flex items-center gap-3">
            <Calendar size={18} className="text-brand dark:text-brand-light" />
            <strong>Travel Date:</strong>{" "}
            {new Date(booking.date).toLocaleDateString("en-IN")}
          </div>

          <div className="flex items-center gap-3">
            <Users size={18} className="text-brand dark:text-brand-light" />
            <strong>Guests:</strong> {booking.guests}
          </div>

          <div className="flex items-center gap-3 overflow-hidden">
            <Hash size={18} className="text-brand dark:text-brand-light flex-shrink-0" />
            <strong className="flex-shrink-0">Transaction ID:</strong>{" "}
            <span className="truncate">{booking.transactionId}</span>
          </div>

          <div className="flex items-center gap-3">
            <Info size={18} className="text-brand dark:text-brand-light" />
            <strong>Payment:</strong>{" "}
            <div>
              <span className="font-bold">{formatRupee(booking.totalAmount)}</span>
              {booking.cabBooking && (
                <div className="text-xs text-brand dark:text-brand-light font-semibold flex items-center gap-1 mt-0.5">
                  <CarTaxiFront size={12} /> + Cab Included
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 flex flex-col sm:flex-row justify-end items-center gap-4">
        {canRequestInvoice && (
          <Button
            onClick={() => onResendInvoice(booking._id)}
            disabled={isResending}
            variant="ghost"
            className={cn(
              "flex items-center gap-2 text-blue-600 dark:text-blue-400 disabled:opacity-50",
              "hover:!bg-blue-100",
              "dark:hover:!bg-blue-900/40"
            )}
          >
            <FileText size={16} />{" "}
            {isResending ? "Sending..." : "Request Invoice"}
          </Button>
        )}



        {canCancel && (
          <Button
            onClick={() => onCancel(booking._id)}
            variant="ghost"
            className={cn(
              "flex items-center gap-2 text-red-600 dark:text-red-400",
              "hover:!bg-red-100",
              "dark:hover:!bg-red-900/40"
            )}
          >
            <XCircle size={16} /> Cancel Booking
          </Button>
        )}

        {/* ✅ --- START: Updated Rebook Button --- */}
        <Button
          onClick={() => onRebook(booking.packageId)}
          disabled={!canRebook} // Disable if package is not active
          variant="ghost"
          className={cn(
            "flex items-center gap-2 text-brand dark:text-brand-light",
            "hover:!bg-brand/10",
            "dark:hover:!bg-brand/20",
            "disabled:opacity-50 disabled:text-slate-400 disabled:hover:!bg-transparent"
          )}
          title={!canRebook ? "This package is no longer available" : "Book this trip again"}
        >
          <Repeat2 size={16} />
          {!canRebook ? "Unavailable" : "Rebook"}
        </Button>

        {/* ✅ --- START: Extend Trip Button --- */}
        {canExtend && (
          <Button
            onClick={() => onExtend(booking)}
            variant="ghost"
            className={cn(
              "flex items-center gap-2 text-indigo-600 dark:text-indigo-400",
              "hover:!bg-indigo-100",
              "dark:hover:!bg-indigo-900/40"
            )}
          >
            <MapPin size={16} /> Extend Trip
          </Button>
        )}
        {/* ✅ --- END: Extend Trip Button --- */}
        {/* ✅ --- END: Updated Rebook Button --- */}
      </div>

    </motion.div>
  );
};

/* ===============================
✈️ My Bookings Page
=============================== */
const MyBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resendingId, setResendingId] = useState(null);

  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [entriesToShow, setEntriesToShow] = useState(10);
  const [dateFilters, setDateFilters] = useState({ startDate: "", endDate: "" });

  const [isStartFocused, setIsStartFocused] = useState(false);
  const [isEndFocused, setIsEndFocused] = useState(false);

  const navigate = useNavigate();

  // --- Data & Filter Logic ---
  const fetchBookings = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get("/requests/mybookings");
      setBookings(data.data);
      setFiltered(data.data);
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    let filteredData = [...bookings];
    if (statusFilter !== "All") {
      filteredData = filteredData.filter((b) => b.status === statusFilter);
    }
    if (search.trim()) {
      filteredData = filteredData.filter((b) =>
        b.packageName.toLowerCase().includes(search.toLowerCase())
      );
    }
    const { startDate, endDate } = dateFilters;
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      filteredData = filteredData.filter((b) => new Date(b.createdAt) >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filteredData = filteredData.filter((b) => new Date(b.createdAt) <= end);
    }
    setFiltered(filteredData);
  }, [statusFilter, search, bookings, dateFilters]);

  // --- Handlers ---
  const handleDateChange = (e) => {
    setDateFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
    try {
      await apiClient.post(`/requests/update/${bookingId}`, { status: "Cancelled" });
      fetchBookings();
    } catch {
      alert("Failed to cancel booking. Try again.");
    }
  };

  const handleResendInvoice = async (bookingId) => {
    setResendingId(bookingId);
    try {
      const { data } = await apiClient.post(`/requests/resend-invoice/${bookingId}`);
      alert(data.message);
    } catch (error) {
      alert(error.response?.data?.message || "Could not resend invoice.");
    } finally {
      setResendingId(null);
    }
  };

  const handleRebook = (packageId) => {
    // This function is now intelligent. It won't navigate if packageId is null
    if (packageId) {
      navigate(`/packages/${packageId}`);
    }
  };

  const handleViewDetails = (bookingId) => {
    navigate(`/my-bookings/${bookingId}`);
  };

  // ✅ --- START: Handle Extend Trip ---
  const handleExtend = (booking) => {
    // Calculate new start date = booking date + duration
    const startDate = new Date(booking.date);
    startDate.setDate(startDate.getDate() + (booking.duration || 1));
    const nextDate = startDate.toISOString().split('T')[0];

    navigate("/packages", {
      state: {
        addOnFor: booking._id,
        newStartDate: nextDate,
        previousLocation: booking.packageName || "your trip",
        phone: booking.clientPhone, // ✅ Pass Phone
        previousDocument: booking.documentPath, // ✅ Pass Document Path
      },
    });
  };
  // ✅ --- END: Handle Extend Trip ---

  // --- Metrics & Layout helpers ---
  const totalSpent = filtered.reduce((sum, b) => {
    if (b.status === "Approved" || b.status === "Completed") {
      return sum + (b.totalAmount || 0);
    }
    return sum;
  }, 0);

  const activeTrips = filtered.filter((b) => b.status === "Approved").length;
  const totalFiltered = filtered.length;
  const displayCount =
    entriesToShow === -1 ? totalFiltered : Math.min(entriesToShow, totalFiltered);

  const inputBaseClass =
    "border border-slate-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-brand outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 w-full";

  /* --- Render --- */
  return (
    <div className="pt-32 pb-24 bg-slate-50 dark:bg-slate-900 min-h-screen">
      <div className="container mx-auto px-6 max-w-5xl">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-5xl font-extrabold text-center mb-6 text-slate-800 dark:text-slate-100"
        >
          My Bookings
        </motion.h1>

        <p className="text-xl text-slate-600 dark:text-slate-300 text-center mb-10 max-w-3xl mx-auto">
          Here’s a summary of your adventures with Voyage Pro.
        </p>

        {/* --- Summary Stats --- */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          {[
            { label: "Total Bookings", value: totalFiltered },
            { label: "Active Trips", value: activeTrips },
            { label: "Total Spent", value: formatRupee(totalSpent) },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-800 p-5 rounded-lg shadow-md text-center border border-slate-100 dark:border-slate-700"
            >
              <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                {stat.value}
              </h3>
              <p className="text-slate-500 dark:text-slate-400">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* --- Filter Bar --- */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-lg shadow-md mb-10 flex flex-col gap-4 border border-slate-100 dark:border-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div className="space-y-4">
              <div className="relative w-full">
                <Search
                  size={18}
                  className="text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
                />
                <input
                  type="text"
                  placeholder="Search package..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={cn(inputBaseClass, "pl-10")}
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400 flex-shrink-0">
                  Booked:
                </label>
                <input
                  type={isStartFocused || dateFilters.startDate ? "date" : "text"}
                  onFocus={() => setIsStartFocused(true)}
                  onBlur={() => setIsStartFocused(false)}
                  placeholder="Booked from"
                  name="startDate"
                  value={dateFilters.startDate}
                  onChange={handleDateChange}
                  className={cn(inputBaseClass)}
                />
                <span className="text-brand dark:text-brand-light">to</span>
                <input
                  type={isEndFocused || dateFilters.endDate ? "date" : "text"}
                  onFocus={() => setIsEndFocused(true)}
                  onBlur={() => setIsEndFocused(false)}
                  placeholder="Booked to"
                  name="endDate"
                  value={dateFilters.endDate}
                  onChange={handleDateChange}
                  className={cn(inputBaseClass)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="relative w-full">
                <Filter
                  size={18}
                  className="text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={cn(inputBaseClass, "pl-10")}
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div className="relative w-full">
                <List
                  size={18}
                  className="text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
                />
                <select
                  value={entriesToShow}
                  onChange={(e) => setEntriesToShow(Number(e.target.value))}
                  className={cn(inputBaseClass, "pl-10")}
                >
                  <option value={10}>Show 10</option>
                  <option value={25}>Show 25</option>
                  <option value={50}>Show 50</option>
                  <option value={-1}>Show All</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* --- Bookings List --- */}
        {loading ? (
          <p className="text-center dark:text-slate-400">Loading your bookings...</p>
        ) : (
          <>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Showing {displayCount} of {totalFiltered} bookings.
            </p>

            {filtered.length > 0 ? (
              <div className="space-y-8">
                {filtered
                  .slice(0, entriesToShow === -1 ? undefined : entriesToShow)
                  .map((booking) => (
                    <BookingCard
                      key={booking._id}
                      booking={booking}
                      onCancel={handleCancelBooking}
                      onResendInvoice={handleResendInvoice}
                      onRebook={handleRebook}
                      onExtend={handleExtend}
                      onViewDetails={handleViewDetails}
                      isResending={resendingId === booking._id}
                    />
                  ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="text-center bg-white dark:bg-slate-800 p-12 rounded-xl shadow-md border border-slate-100 dark:border-slate-700"
              >
                <Package size={50} className="mx-auto text-slate-400 mb-4" />
                <h3 className="text-2xl font-semibold text-slate-700 dark:text-slate-200">
                  No Bookings Found
                </h3>
                <p className="text-slate-500 dark:text-slate-400 mt-2">
                  Try adjusting your filters or book a new adventure!
                </p>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MyBookingsPage;