import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import apiClient, { BASE_URL } from "../../api/apiClient";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  Users,
  Hash,
  Info,
  Package,
  MapPin,
  Clock,
  Repeat2,
  FileText,
  Phone,
  MessageSquare,
  User,
  Mail,
  Download,
  LifeBuoy, // ✅ Import new icon
  CarTaxiFront, // ✅ Import Cab Icon
  CreditCard, // ✅ Import Payment Icon
  CheckCircle, // ✅ Import Check Icon
} from "lucide-react";
import { formatRupee } from "../../utils/format";
import { cn, getImageUrl } from "../../utils/helpers";
import Button from "../ui/Button";

// Helper component for stat boxes
const InfoCard = ({ icon: Icon, label, value }) => (
  <div className="bg-white dark:bg-slate-800 p-5 rounded-lg shadow-md border border-slate-100 dark:border-slate-700">
    <Icon className="w-8 h-8 text-brand dark:text-brand-light mb-3" />
    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
      {label}
    </p>
    <p className="text-xl font-bold text-slate-800 dark:text-slate-100 truncate">
      {value}
    </p>
  </div>
);

// Helper for detail rows
const DetailRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-4 py-4 border-b border-slate-100 dark:border-slate-700">
    <Icon className="w-5 h-5 text-slate-400 flex-shrink-0 mt-1" />
    <div className="flex-grow">
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className="text-base font-semibold text-slate-700 dark:text-slate-200">
        {value}
      </p>
    </div>
  </div>
);

// Main Component
const BookingDetailsPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // ✅ --- START: New state for resend button ---
  const [isResending, setIsResending] = useState(false);
  // ✅ --- END: New state ---

  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        setLoading(true);
        const { data } = await apiClient.get(`/requests/details/${bookingId}`);
        setBooking(data.data);
      } catch (err) {
        console.error("Failed to fetch booking details:", err);
        setError("Could not load booking details. It may not exist or you may not have permission to view it.");
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, [bookingId]);

  const handleRebook = () => {
    if (booking.isPackageActive) {
      navigate(`/packages/${booking.packageId}`);
    } else {
      alert("This package is no longer available for rebooking.");
    }
  };

  // ✅ --- START: New handler for resending invoice ---
  const handleResendInvoice = async () => {
    if (isResending) return;
    setIsResending(true);
    try {
      const { data } = await apiClient.post(`/requests/resend-invoice/${booking._id}`);
      alert(data.message || "Invoice has been sent to your email.");
    } catch (error) {
      alert(error.response?.data?.message || "Could not resend invoice.");
    } finally {
      setIsResending(false);
    }
  };
  // ✅ --- END: New handler ---

  const getStatusClasses = (status) => {
    // ... (status class logic remains the same)
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "Rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "Cancelled":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
      default:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:text-slate-300">
        Loading booking insights...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-6">
        <p className="text-lg text-red-500">{error}</p>
        <Button onClick={() => navigate("/my-profile")} className="mt-4">
          <ArrowLeft className="mr-2" /> Back to Profile
        </Button>
      </div>
    );
  }

  if (!booking) {
    return null;
  }

  return (
    <div className="pt-32 pb-24 bg-slate-50 dark:bg-slate-900 min-h-screen">
      <div className="container mx-auto px-6 max-w-5xl">
        {/* --- Header --- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Button
            onClick={() => navigate(-1)}
            variant="secondary"
            className="mb-6 bg-white dark:bg-slate-800 shadow-sm dark:text-slate-200"
          >
            <ArrowLeft className="mr-2" /> Back
          </Button>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
            <h1 className="text-4xl font-extrabold text-slate-800 dark:text-slate-100">
              {booking.packageName}
            </h1>
            <span
              className={cn(
                "px-4 py-1.5 text-sm font-semibold rounded-full border self-start",
                getStatusClasses(booking.status)
              )}
            >
              {booking.status}
            </span>
          </div>
        </motion.div>

        {/* --- Stats Grid --- */}
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {/* ... (InfoCard components) ... */}
          <InfoCard
            icon={Calendar}
            label="Travel Date"
            value={new Date(booking.date).toLocaleDateString("en-IN")}
          />
          <InfoCard
            icon={Users}
            label="Guests"
            value={booking.guests}
          />
          <InfoCard
            icon={Info}
            label="Total Paid"
            value={
              <div>
                {formatRupee(booking.totalAmount)}
                {booking.cabBooking && (
                  <div className="text-xs text-brand dark:text-brand-light font-semibold flex items-center gap-1 mt-1">
                    <CarTaxiFront size={12} /> + Cab Included
                  </div>
                )}
              </div>
            }
          />
          <InfoCard
            icon={Hash}
            label="Booking ID"
            value={booking._id.slice(-6)}
          />
        </motion.div>

        {/* --- Details Layout --- */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {/* --- Left Column: Booking & Package Details --- */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-8 rounded-lg shadow-lg border border-slate-100 dark:border-slate-700">
            {/* ... (All DetailRow components) ... */}
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">
              Booking Insights
            </h2>

            <h3 className="text-lg font-semibold text-brand dark:text-brand-light mb-4 pb-2 border-b border-gray-100 dark:border-gray-700">Package Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
              <DetailRow icon={Package} label="Package Name" value={booking.packageName} />
              <DetailRow icon={MapPin} label="Location" value={booking.packageLocation} />
              <DetailRow icon={Clock} label="Duration" value={`${booking.packageDuration} Days`} />
            </div>

            <h3 className="text-lg font-semibold text-brand dark:text-brand-light mt-8 mb-4 pb-2 border-b border-gray-100 dark:border-gray-700">Your Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
              <DetailRow icon={User} label="Booked By" value={booking.clientName} />
              <DetailRow icon={Mail} label="Email" value={booking.clientEmail} />
              <DetailRow icon={Phone} label="Contact Phone" value={booking.clientPhone} />
            </div>

            <h3 className="text-lg font-semibold text-brand dark:text-brand-light mt-8 mb-4 pb-2 border-b border-gray-100 dark:border-gray-700">Payment & Notes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
              <DetailRow icon={Hash} label="Transaction ID" value={booking.transactionId} />
              <DetailRow
                icon={CreditCard}
                label="Payment Method"
                value={booking.paymentInfo?.last4Digits ? `Card ending in ${booking.paymentInfo.last4Digits}` : "Online Payment"}
              />
              <DetailRow
                icon={Calendar}
                label="Booked On"
                value={new Date(booking.createdAt).toLocaleDateString("en-IN", {
                  year: 'numeric', month: 'long', day: 'numeric'
                })}
              />
              <DetailRow
                icon={CarTaxiFront}
                label="Cab Service"
                value={booking.cabBooking ? "Included (+₹500)" : "Not Selected"}
              />
              <DetailRow
                icon={CheckCircle}
                label="Payment Status"
                value={<span className="text-green-600 dark:text-green-400 font-semibold">Paid</span>}
              />
              <DetailRow
                icon={MessageSquare}
                label="Special Requests"
                value={booking.requests || "None"}
              />
              <DetailRow
                icon={Calendar}
                label="Trip Date"
                value={new Date(booking.date).toLocaleDateString("en-IN", {
                  year: 'numeric', month: 'long', day: 'numeric'
                })}
              />
              <DetailRow
                icon={Info}
                label="Booking Status"
                value={
                  <span className={cn(
                    "font-semibold",
                    booking.status === "Approved" ? "text-green-600 dark:text-green-400" :
                      booking.status === "Rejected" ? "text-red-600 dark:text-red-400" :
                        "text-yellow-600 dark:text-yellow-400"
                  )}>
                    {booking.status}
                  </span>
                }
              />
            </div>
          </div>

          {/* --- Right Column: Image & Actions --- */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-100 dark:border-slate-700">
              <img
                src={getImageUrl(booking.packageImage)}
                alt={booking.packageName}
                className="w-full h-48 object-cover rounded-md mb-6"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <Button
                onClick={handleRebook}
                disabled={!booking.isPackageActive}
                className="w-full"
                title={!booking.isPackageActive ? "This package is no longer available" : "Book this package again"}
              >
                <Repeat2 className="mr-2" />
                {booking.isPackageActive ? "Rebook This Trip" : "Package Unavailable"}
              </Button>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-100 dark:border-slate-700">
              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4">
                Your Document
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                This is the ID proof you uploaded during booking.
              </p>
              <a
                href={getImageUrl(booking.documentPath)}
                download
                className={cn(
                  "px-8 py-3 font-semibold rounded-lg flex items-center justify-center gap-2 shadow-lg group transform transition-all duration-200 hover:-translate-y-0.5",
                  "bg-white text-brand hover:bg-slate-100 hover:shadow-glow-white",
                  "w-full bg-slate-100 dark:bg-slate-700 dark:text-slate-200"
                )}
              >
                <Download className="w-5 h-5" />
                View/Download Document
              </a>
            </div>

            {/* ✅ --- START: NEW "INVOICE" CARD --- */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-100 dark:border-slate-700">
              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                <FileText size={20} /> Your Invoice
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Get a copy of your booking confirmation sent to your email.
              </p>
              <Button
                onClick={handleResendInvoice}
                disabled={isResending}
                variant="secondary"
                className="w-full bg-slate-100 dark:bg-slate-700 dark:text-slate-200"
              >
                {isResending ? "Sending..." : "Resend Invoice"}
              </Button>
            </div>
            {/* ✅ --- END: "INVOICE" CARD --- */}

            {/* ✅ --- START: NEW "HELP" CARD --- */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-100 dark:border-slate-700">
              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                <LifeBuoy size={20} /> Need Help?
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Have questions about this booking or need to make a change?
              </p>
              <Button
                onClick={() => navigate('/contact')}
                className="w-full"
              >
                Contact Support
              </Button>
            </div>
            {/* ✅ --- END: "HELP" CARD --- */}

          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default BookingDetailsPage;