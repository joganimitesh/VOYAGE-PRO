import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle,
  XCircle,
  Search,
  Trash2,
  FileText,
  Filter,
  Link, // ✅ Added for Add-on indicator
  Clock,
  TrendingUp,
  IndianRupee,
  Calendar,
  CreditCard,
  CarTaxiFront, // ✅ Added for Cab Feature
} from "lucide-react";
import { cn } from "../../utils/helpers";
import apiClient, { BASE_URL } from "../../api/apiClient";
import { formatRupee } from "../../utils/format";

// --- InvoiceModal ---
const InvoiceModal = ({ request, onClose }) => {
  if (!request) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-lg p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
        >
          <XCircle size={22} />
        </button>

        <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-100 mb-4">
          Booking Invoice
        </h2>

        <div className="border-t dark:border-slate-700 pt-4 space-y-2 text-gray-700 dark:text-slate-300">
          <p>
            <strong>Transaction ID:</strong> {request.transactionId || "N/A"}
          </p>
          <p>
            <strong>Client:</strong> {request.clientName || "Unknown"} (
            {request.clientEmail || "No Email"})
          </p>
          <p>
            <strong>Package:</strong> {request.packageName || "N/A"}
          </p>
          <p>
            <strong>Guests:</strong> {request.guests || 0}
          </p>
          <p>
            <strong>Date:</strong>{" "}
            {request.date
              ? new Date(request.date).toLocaleDateString("en-IN")
              : "N/A"}
          </p>

          {request.documentPath ? (
            <p>
              <strong>Document:</strong>{" "}
              <a
                href={`${BASE_URL}/${request.documentPath}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
              >
                View Uploaded Document
              </a>
            </p>
          ) : (
            <p>
              <strong>Document:</strong>{" "}
              <span className="text-red-500">Not Uploaded</span>
            </p>
          )}

          {request.requests && (
            <p>
              <strong>Special Requests:</strong>{" "}
              <span className="italic text-slate-600 dark:text-slate-400">
                "{request.requests}"
              </span>
            </p>
          )}

          {/* ✅ Add-on Trip Info */}
          {request.isAddOn && (
            <div className="mt-3 p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-md border border-indigo-200 dark:border-indigo-700">
              <p className="text-indigo-700 dark:text-indigo-300 font-semibold flex items-center gap-2">
                <Link size={14} /> Trip Extension
              </p>
              {request.parentTripName && (
                <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-1">
                  Linked to: <strong>{request.parentTripName}</strong>
                </p>
              )}
            </div>
          )}

          {/* ✅ Payment Info */}
          {request.paymentInfo && (request.paymentInfo.cardName || request.paymentInfo.last4Digits) && (
            <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-md border border-slate-200 dark:border-slate-600">
              <p className="text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-2 text-sm mb-1">
                <CreditCard size={14} /> Payment Details
              </p>
              <div className="text-sm text-slate-600 dark:text-slate-400 pl-6 space-y-0.5">
                <p><span className="font-medium">Cardholder:</span> {request.paymentInfo.cardName || "N/A"}</p>
                <p><span className="font-medium">Card:</span> •••• •••• •••• {request.paymentInfo.last4Digits || "••••"}</p>
              </div>
            </div>
          )}

          {/* ✅ Cab Booking Info */}
          {request.cabBooking && (
            <div className="mt-3 p-3 bg-brand/10 dark:bg-brand/20 rounded-md border border-brand/20 dark:border-brand/40">
              <p className="text-brand dark:text-brand-light font-semibold flex items-center gap-2 text-sm mb-1">
                <CarTaxiFront size={14} /> Station/Airport Transfer
              </p>
              <p className="text-sm text-brand-light dark:text-brand-light/80 pl-6">
                Includes private cab pick-up & drop-off. <br />
                <span className="font-bold">Cost: {formatRupee(request.cabBookingPrice)}</span>
              </p>
            </div>
          )}

          <hr className="my-4 dark:border-slate-700" />
          <p className="text-xl font-bold text-right">
            Total Amount: {formatRupee(request.totalAmount)}
          </p>
          <p className="text-right text-sm text-green-600 dark:text-green-400">
            Status: {request.status || "Pending"}
          </p>
        </div>
      </div>
    </div>
  );
};

// --- Main Component ---
const AdminRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [invoiceRequest, setInvoiceRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [entriesToShow, setEntriesToShow] = useState(10);
  const [statusFilter, setStatusFilter] = useState("All");

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get("/requests/all");
      setRequests(Array.isArray(data.data) ? data.data : []);
    } catch (error) {
      console.error("❌ Failed to fetch requests:", error);
      alert("Failed to fetch requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleRequestStatusChange = async (id, newStatus) => {
    try {
      const { data: updated } = await apiClient.post(
        `/requests/admin/update/${id}`,
        { status: newStatus }
      );
      if (updated?.data?._id) {
        setRequests((prev) =>
          prev.map((req) =>
            req._id === updated.data._id
              ? { ...req, status: updated.data.status }
              : req
          )
        );
      }
    } catch (error) {
      console.error("❌ Failed to update status:", error);
    }
  };

  const handleDeleteRequest = async (id) => {
    if (!window.confirm("Are you sure you want to delete this request?"))
      return;
    try {
      await apiClient.delete(`/requests/${id}`);
      setRequests((prev) => prev.filter((req) => req._id !== id));
    } catch (error) {
      console.error("❌ Failed to delete request:", error);
      alert("Failed to delete request.");
    }
  };

  // --- Filters ---
  const filteredRequests = requests.filter((req) => {
    if (statusFilter !== "All" && req.status !== statusFilter) return false;

    const search = searchTerm.toLowerCase();
    if (!search) return true;

    return (
      (req.clientName || "").toLowerCase().includes(search) ||
      (req.clientEmail || "").toLowerCase().includes(search) ||
      (req.packageName || "").toLowerCase().includes(search)
    );
  });

  const totalFiltered = filteredRequests.length;
  const displayCount =
    entriesToShow === -1
      ? totalFiltered
      : Math.min(entriesToShow, totalFiltered);

  return (
    <div className="p-4 md:p-8 bg-slate-50 dark:bg-slate-900 min-h-screen">
      {/* Page Title */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-4xl font-extrabold text-slate-800 dark:text-slate-100 mb-8 text-center"
      >
        Booking Requests
      </motion.h1>

      {/* Invoice Modal */}
      {invoiceRequest && (
        <InvoiceModal
          request={invoiceRequest}
          onClose={() => setInvoiceRequest(null)}
        />
      )}

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
            <p className="text-sm text-slate-500 dark:text-slate-400">Total Requests</p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {requests.length}
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
                requests
                  .filter((r) => r.status === "Approved" || r.status === "Completed")
                  .reduce((sum, r) => sum + (r.totalAmount || 0), 0)
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
              {requests.filter((r) => r.status === "Approved" || r.status === "Completed").length}
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
              {requests.filter((r) => r.status === "Pending").length}
            </h3>
          </div>
        </motion.div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">

        {/* --- Filter Bar --- */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4">
          {/* Search */}
          <div className="relative w-full sm:w-1/3">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search by name, email, or package..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand bg-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="relative w-full sm:w-auto">
            <Filter
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={20}
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand bg-transparent"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* Entries Selector */}
          <div className="flex items-center gap-2">
            <label
              htmlFor="entries"
              className="text-sm text-slate-500 dark:text-slate-400 flex-shrink-0"
            >
              Show:
            </label>
            <select
              id="entries"
              value={entriesToShow}
              onChange={(e) => setEntriesToShow(Number(e.target.value))}
              className="border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand bg-transparent py-2 pl-3 pr-8"
            >
              <option value={10}>10 Entries</option>
              <option value={25}>25 Entries</option>
              <option value={50}>50 Entries</option>
              <option value={-1}>All Entries</option>
            </select>
          </div>
        </div>

        {/* Count */}
        <div className="p-4 text-sm text-slate-500 dark:text-slate-400">
          Showing {displayCount} of {totalFiltered} entries.
        </div>

        {/* --- Requests Table --- */}
        <div className="overflow-hidden">
          {loading ? (
            <p className="text-center py-6 text-slate-500 dark:text-slate-400">
              Loading requests...
            </p>
          ) : filteredRequests.length === 0 ? (
            <p className="text-center py-6 text-slate-500 dark:text-slate-400">
              No requests found.
            </p>
          ) : (
            <table className="w-full table-fixed">
              <thead className="bg-slate-50 dark:bg-slate-900">
                <tr>
                  <th className="p-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider" style={{ width: '20%' }}>
                    Client Info
                  </th>
                  <th className="p-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider" style={{ width: '35%' }}>
                    Package & Guests
                  </th>
                  <th className="p-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider" style={{ width: '15%' }}>
                    Status
                  </th>
                  <th className="p-4 text-center text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider" style={{ width: '30%' }}>
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredRequests
                  .slice(0, entriesToShow === -1 ? undefined : entriesToShow)
                  .map((req, index) => (
                    <tr
                      key={req._id || index}
                      className={cn(
                        index % 2 === 0
                          ? "bg-white dark:bg-slate-800"
                          : "bg-slate-50 dark:bg-slate-800/50",
                        "hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                      )}
                    >
                      <td className="p-4">
                        <div className="font-medium text-slate-900 dark:text-slate-100 truncate">
                          {req.clientName || "N/A"}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400 truncate">
                          {req.clientEmail || "N/A"}
                        </div>
                      </td>

                      <td className="p-4 text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-2">
                          <span className="truncate">{req.packageName || "N/A"}</span>
                          {/* ✅ Add-on Badge */}
                          {req.isAddOn && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700 flex-shrink-0">
                              <Link size={10} /> Add-on
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          {req.guests || 0} Guest(s)
                        </div>
                        {/* ✅ Parent Trip Info */}
                        {req.isAddOn && (
                          <div className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                            {req.packageName === req.parentTripName ? (
                              // Same Package -> Member Extension
                              <>Additional Guests • Added to existing trip</>
                            ) : (
                              // Different Package -> Trip Extension
                              <>Trip Extension {req.parentTripName && `• From: ${req.parentTripName}`}</>
                            )}
                          </div>
                        )}
                        {/* ✅ Cab Booking Badge */}
                        {req.cabBooking && (
                          <div className="text-xs text-brand dark:text-brand-light mt-1 flex items-center gap-1">
                            <CarTaxiFront size={12} /> Cab Transfer Included
                          </div>
                        )}
                      </td>

                      <td className="p-4 whitespace-nowrap">
                        <span
                          className={cn(
                            "px-3 py-1 text-xs font-semibold rounded-full border",
                            req.status === "Approved"
                              ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-700"
                              : req.status === "Rejected"
                                ? "bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-300 dark:border-red-700"
                                : req.status === "Cancelled"
                                  ? "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
                                  : "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-700"
                          )}
                        >
                          {req.status || "Pending"}
                        </span>
                      </td>

                      <td className="p-4">
                        <div className="flex items-center justify-center gap-1">
                          {req.status === "Pending" && (
                            <>
                              <button
                                onClick={() =>
                                  handleRequestStatusChange(req._id, "Approved")
                                }
                                className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                                title="Approve"
                              >
                                <CheckCircle size={18} />
                              </button>

                              <button
                                onClick={() =>
                                  handleRequestStatusChange(req._id, "Rejected")
                                }
                                className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                                title="Reject"
                              >
                                <XCircle size={18} />
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => setInvoiceRequest(req)}
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                            title="View Invoice"
                          >
                            <FileText size={18} />
                          </button>

                          <button
                            onClick={() => handleDeleteRequest(req._id)}
                            className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminRequestsPage;
