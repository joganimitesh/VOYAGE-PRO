import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, IndianRupee, Package, CheckCircle, Clock, FileText, TrendingUp, Info, ShieldX, ShieldCheck } from "lucide-react";
import apiClient, { BASE_URL } from "../../api/apiClient";
import { formatRupee } from "../../utils/format";
import { getImageUrl, cn, getAvatarUrl, DEFAULT_AVATAR } from "../../utils/helpers"; // ✅ Added getAvatarUrl

const UserInsightsModal = ({ user, onClose, onToggleBlockStatus }) => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalSpend: 0,
        totalBookings: 0,
        completedBookings: 0,
        pendingBookings: 0,
        cancelledBookings: 0,
        lastBookingDate: null,
    });

    useEffect(() => {
        if (user?._id) {
            fetchUserBookings();
        }
    }, [user]);

    const fetchUserBookings = async () => {
        try {
            const { data } = await apiClient.get(`/requests/admin/user/${user._id}`);
            if (data.success) {
                setBookings(data.data);
                calculateStats(data.data);
            }
        } catch (error) {
            console.error("Failed to fetch user insights:", error);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (data) => {
        const totalSpend = data
            .filter((b) => b.status !== "Cancelled" && b.status !== "Rejected")
            .reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);

        const completed = data.filter((b) => b.status === "Completed").length;
        const pending = data.filter((b) => b.status === "Pending").length;
        const cancelled = data.filter((b) => b.status === "Cancelled" || b.status === "Rejected").length;

        setStats({
            totalSpend,
            totalBookings: data.length,
            completedBookings: completed,
            pendingBookings: pending,
            cancelledBookings: cancelled,
            lastBookingDate: data.length > 0 ? data[0].createdAt : null,
        });
    };

    if (!user) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-700"
                >
                    {/* --- Header --- */}
                    <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-start bg-slate-50 dark:bg-slate-800/50">
                        <div className="flex items-center gap-4">
                            <img
                                src={getAvatarUrl(user.profileImage, user.name)}
                                alt={user.name}
                                className="w-16 h-16 rounded-full object-cover border-2 border-white dark:border-slate-600 shadow-md"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = DEFAULT_AVATAR;
                                }}
                            />
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                    {user.name}
                                    <span className={cn(
                                        "text-xs px-2 py-0.5 rounded-full border",
                                        user.isBlocked
                                            ? "bg-red-50 text-red-600 border-red-100"
                                            : "bg-green-50 text-green-600 border-green-100"
                                    )}>
                                        {user.isBlocked ? "Blocked" : "Active"}
                                    </span>
                                </h2>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">{user.email}</p>
                                <div className="flex items-center gap-4 mt-2">
                                    <p className="text-xs text-slate-400">
                                        Joined: {new Date(user.createdAt).toLocaleDateString()}
                                    </p>
                                    {/* ✅ Block/Unblock Button */}
                                    <button
                                        onClick={() => onToggleBlockStatus(user._id, user.isBlocked)}
                                        className={cn(
                                            "flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full transition-colors border",
                                            user.isBlocked
                                                ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800"
                                                : "bg-red-100 text-red-700 border-red-200 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800"
                                        )}
                                    >
                                        {user.isBlocked ? (
                                            <>
                                                <ShieldCheck size={12} />
                                                Unblock User
                                            </>
                                        ) : (
                                            <>
                                                <ShieldX size={12} />
                                                Block User
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
                        >
                            <X size={24} className="text-slate-500" />
                        </button>
                    </div>

                    {/* --- Content --- */}
                    <div className="p-6 overflow-y-auto flex-grow custom-scrollbar">

                        {/* --- Stats Grid --- */}
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                            <TrendingUp size={20} className="text-brand" /> User Overview
                        </h3>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            <StatCard
                                label="Total Spend"
                                value={formatRupee(stats.totalSpend)}
                                icon={<IndianRupee size={20} className="text-amber-500" />}
                                bg="bg-amber-50 dark:bg-amber-900/20"
                            />
                            <StatCard
                                label="Total Bookings"
                                value={stats.totalBookings}
                                icon={<Package size={20} className="text-blue-500" />}
                                bg="bg-blue-50 dark:bg-blue-900/20"
                            />
                            <StatCard
                                label="Pending"
                                value={stats.pendingBookings}
                                icon={<Clock size={20} className="text-amber-500" />}
                                bg="bg-amber-50 dark:bg-amber-900/20"
                            />
                            <StatCard
                                label="Completed"
                                value={stats.completedBookings}
                                icon={<CheckCircle size={20} className="text-green-500" />}
                                bg="bg-green-50 dark:bg-green-900/20"
                            />
                        </div>

                        {/* --- Recent Activity --- */}
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                            <FileText size={20} className="text-indigo-500" /> Recent Activity
                        </h3>

                        {loading ? (
                            <div className="flex justify-center py-10">
                                <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : bookings.length === 0 ? (
                            <div className="text-center py-10 text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                                <p>No bookings found for this user.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {bookings.map((booking) => (
                                    <div
                                        key={booking._id}
                                        className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex items-center gap-4 mb-2 md:mb-0">
                                            <div className="w-10 h-10 rounded-lg bg-brand/10 dark:bg-brand/20 flex items-center justify-center flex-shrink-0 text-brand dark:text-brand-light font-bold">
                                                {booking.packageName ? booking.packageName[0] : "?"}
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-slate-800 dark:text-slate-100">
                                                    {booking.packageName}
                                                    {booking.isAddOn && (
                                                        <span className="ml-2 text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full border border-indigo-200 uppercase tracking-wide">
                                                            Add-on
                                                        </span>
                                                    )}
                                                </h4>
                                                <p className="text-xs text-slate-500 flex items-center gap-3 mt-0.5">
                                                    <span>{new Date(booking.date).toLocaleDateString()}</span>
                                                    <span>•</span>
                                                    <span>{booking.guests} Guests</span>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                                            <div className="text-right">
                                                <p className="font-bold text-slate-700 dark:text-slate-200">{formatRupee(booking.totalAmount)}</p>
                                                <p className="text-xs text-slate-400">Total</p>
                                            </div>

                                            <StatusBadge status={booking.status} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>
            </div >
        </AnimatePresence >
    );
};

// Start Helper Components
const StatCard = ({ label, value, icon, bg }) => (
    <div className={`p-4 rounded-xl border border-slate-100 dark:border-slate-700/50 ${bg} flex flex-col items-center justify-center text-center`}>
        <div className="mb-2 p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm">{icon}</div>
        <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
    </div>
);

const StatusBadge = ({ status }) => {
    const styles = {
        Pending: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400",
        Approved: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400",
        Completed: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400",
        Rejected: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400",
        Cancelled: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/30 dark:text-slate-400",
    };

    return (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${styles[status] || styles.Pending}`}>
            {status}
        </span>
    );
};
// End Helper Components

export default UserInsightsModal;
