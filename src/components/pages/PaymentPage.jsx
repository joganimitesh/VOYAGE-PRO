import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, Navigate } from "react-router-dom";
import {
  Lock,
  CreditCard,
  Calendar,
  User,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

import Button from "../ui/Button";
import InputField from "../ui/InputField"; // Using the updated InputField
import { formatRupee } from "../../utils/format";
import { cn } from "../../utils/helpers";

// ✅ --- FIX: Removed absolute positioning from logos ---
const VisaLogo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="30" viewBox="0 0 38 24">
    <path
      d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3z"
      fill="#444"
    />
    <path
      d="M35.1 0H34L22.4 24h3.6c.6-1.2 1.1-2.6 1.4-3.9 1.1 1.7 2.4 3 3.9 3.9H35c.4 0 .8-.3 1-.7l-1.9-4.8c-.5-1.4-.8-2.5-1-3.3.6 0 1.1-.1 1.7-.5.7-.4 1.1-.9 1.3-1.7.3-1 .2-1.9-.1-2.6-.3-.7-.7-1.3-1.3-1.7-.5-.4-1.1-.6-1.7-.7h-.1c-.5 0-1 .1-1.5.3l-.4-.7c-.1-.1 0-.3-.1-.4l3.1-8.1zM26.2 16.5c-.1.3-.3.6-.5.8-.2.2-.5.4-.8.5-.3.1-.7.2-1 .2h-2.1L26 3.2l2.9 13.3h-2.7zm6.5-1.1c-.1.1-.1.2-.2.3-.5 1.1-1.2 1.6-2.1 1.6-.5 0-.9-.1-1.3-.3-.4-.2-.7-.5-.9-.8-.2-.3-.4-.7-.5-1.1-.1-.4-.1-.8-.1-1.2 0-.4.0-.8.1-1.2.1-.4.2-.7.4-1 .2-.3.5-.6.8-.8.3-.2.7-.3 1.1-.3.8 0 1.5.4 2 1.1.5.7.7 1.5.6 2.3zm-3.8.2c0 .3.0.5.1.7.1.2.2.4.3.5.1.1.3.2.4.3.1 0 .2.1.3.1.2 0 .4-.1.5-.2.1-.1.2-.3.3-.4.1-.2.1-.4.1-.6 0-.3 0-.5-.1-.7-.1-.2-.2-.4-.3-.5-.1-.1-.3-.2-.4-.3-.1 0-.2-.1-.3-.1-.2 0-.4.1-.5.2-.1.1-.2.3-.3.4-.1.2-.1.4-.1.6zM32.5 5.3c0-.2.0-.4.1-.6.1-.2.2-.3.3-.4.1-.1.3-.2.4-.2.1 0 .3.0.4.1.1.0.2.1.3.2.1.1.2.2.2.4.1.2.1.4.1.6 0 .2 0 .4-.1.6-.1.2-.2.3-.3.4-.1.1-.3.2-.4.2-.1 0-.3.0-.4-.1-.1.0-.2-.1-.3-.2-.1-.1-.2-.2-.2-.4-.1-.2-.1-.4-.1-.6z"
      fill="#FFF"
    />
  </svg>
);

const MasterCardLogo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="30" viewBox="0 0 135 84">
    <rect width="135" height="84" rx="8.1" fill="#444" />
    <circle cx="42.3" cy="42" r="23.4" fill="#F9A000" />
    <circle cx="79.2" cy="42" r="23.4" fill="#E8001F" />
    <path
      d="M60.8 42c0 9.8-5.3 18.3-13 22A23.3 23.3 0 0142.3 66C30.6 66 21 55.4 21 42s9.6-24 21.3-24c1.9 0 3.8.2 5.5 1.5a23.4 23.4 0 0013 20.5z"
      fill="#F26622"
    />
  </svg>
);

// --- End of Card Logos ---

const PaymentPage = ({ bookingData, handleAddRequest }) => {
  const [cardDetails, setCardDetails] = useState({
    cardName: bookingData?.clientName || "",
    cardNumber: "",
    expiry: "",
    cvc: "",
  });

  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");
  const [cardType, setCardType] = useState("default");
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const navigate = useNavigate();

  if (!bookingData) {
    return <Navigate to="/packages" replace />;
  }

  const validateField = (name, value) => {
    let error = "";
    switch (name) {
      case "cardName":
        if (!value.trim()) error = "Name on card is required.";
        else if (/\d/.test(value)) error = "Name cannot contain numbers.";
        break;

      case "cardNumber":
        const numericValue = value.replace(/\s/g, "");
        if (!numericValue) error = "Card number is required.";
        else if (numericValue.length !== 16) error = "Must be 16 digits.";
        else if (!/^\d{16}$/.test(numericValue)) error = "Invalid characters.";
        break;

      case "expiry":
        if (!value) error = "Expiry date is required.";
        else if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(value)) {
          error = "Use MM/YY format.";
        } else {
          const [month, year] = value.split("/");
          const expiryDate = new Date(`20${year}`, month - 1, 1);
          const lastDayOfMonth = new Date(
            expiryDate.getFullYear(),
            expiryDate.getMonth() + 1,
            0
          );
          const today = new Date();
          if (lastDayOfMonth < today) error = "Card has expired.";
        }
        break;

      case "cvc":
        if (!value) error = "CVV is required.";
        else if (!/^\d{3,4}$/.test(value)) error = "Must be 3 or 4 digits.";
        break;

      default:
        break;
    }
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === "cardName") {
      formattedValue = value.replace(/[^a-zA-Z\s]/g, "");
    }

    if (name === "cardNumber") {
      const numericValue = value.replace(/\D/g, "");
      formattedValue = numericValue.replace(/(.{4})/g, "$1 ").trim().slice(0, 19);

      if (/^4/.test(numericValue)) setCardType("visa");
      else if (/^5[1-5]/.test(numericValue)) setCardType("mastercard");
      else setCardType("default");
    }

    if (name === "expiry") {
      formattedValue = value
        .replace(/\D/g, "")
        .replace(/(\d{2})(\d{0,2})/, "$1/$2")
        .slice(0, 5);
    }

    if (name === "cvc") {
      formattedValue = value.replace(/\D/g, "").slice(0, 4);
    }

    setCardDetails({ ...cardDetails, [name]: formattedValue });
    validateField(name, formattedValue);
  };

  const validateOnSubmit = () => {
    let isValid = true;
    const newErrors = {};
    Object.keys(cardDetails).forEach((name) => {
      validateField(name, cardDetails[name]);
      if (errors[name] || !cardDetails[name]) {
        isValid = false;
        if (!cardDetails[name] && !errors[name]) {
          newErrors[name] = "This field is required.";
        }
      }
    });
    setErrors((prev) => ({ ...prev, ...newErrors }));
    const hasErrors = Object.values(errors).some((e) => e);
    return !hasErrors && isValid;
  };

  // ✅ FIX: Use the totalAmount passed from PackageDetailsPage (which includes cab price)
  const totalAmount = bookingData.totalAmount || ((bookingData.price || 0) * (bookingData.guests || 1));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateOnSubmit()) return;

    setStatus("loading");

    const finalBookingData = new FormData();
    finalBookingData.append("packageId", bookingData.packageId);
    finalBookingData.append("clientName", bookingData.clientName);
    finalBookingData.append("clientEmail", bookingData.clientEmail);
    finalBookingData.append("clientPhone", bookingData.phone);
    finalBookingData.append("packageName", bookingData.title);
    finalBookingData.append("date", bookingData.date);
    finalBookingData.append("guests", Number(bookingData.guests));
    finalBookingData.append("requests", bookingData.requests);
    finalBookingData.append("location", bookingData.location);
    finalBookingData.append("duration", bookingData.duration);
    finalBookingData.append("totalAmount", totalAmount);
    finalBookingData.append("paymentStatus", "Completed");
    finalBookingData.append("transactionId", `VOYAGE-${Date.now()}`);
    finalBookingData.append("document", bookingData.documentFile);

    // ✅ Pass Cab Booking Data
    finalBookingData.append("cabBooking", bookingData.cabBooking || false);
    finalBookingData.append("cabBookingPrice", bookingData.cabBookingPrice || 0);

    if (bookingData.parentRequestId) {
      finalBookingData.append("parentRequestId", bookingData.parentRequestId);
    }
    finalBookingData.append("isAddOn", bookingData.isAddOn || false);

    // ✅ --- Payment Info ---
    finalBookingData.append("cardName", cardDetails.cardName);
    const cleanCardNumber = cardDetails.cardNumber.replace(/\D/g, "");
    finalBookingData.append("last4Digits", cleanCardNumber.slice(-4));
    // ✅ --- End Payment Info ---

    // ✅ Handle Document Reuse
    if (bookingData.previousDocument) {
      finalBookingData.append("previousDocumentPath", bookingData.previousDocument);
    }
    // ✅ --- End Add-on Fields ---

    setTimeout(async () => {
      try {
        await handleAddRequest(finalBookingData);
        setStatus("success");
      } catch (error) {
        console.error("Booking failed:", error);
        setStatus("error");
      }
    }, 2000);
  };

  // --- JSX ---
  return (
    <div className="pt-32 pb-24 bg-slate-50 dark:bg-slate-900 min-h-screen">
      <div className="container mx-auto px-6">
        <AnimatePresence mode="wait">
          {status === "success" ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center max-w-2xl mx-auto bg-white dark:bg-slate-800 p-12 rounded-lg shadow-xl"
            >
              <CheckCircle className="mx-auto text-green-500 mb-4" size={64} />
              <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-100">
                Booking Successful!
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-300 mt-4">
                Thank you for choosing Voyage! An email confirmation and your invoice have been sent to{" "}
                <strong>{bookingData.clientEmail}</strong>.
              </p>
              <p className="mt-2 text-slate-500 dark:text-slate-400">
                Your adventure to <strong>{bookingData.title}</strong> awaits!
              </p>
              <div className="mt-8 flex justify-center gap-4">
                <Button variant="secondary" onClick={() => navigate("/")}>
                  Go to Homepage
                </Button>
                <Button onClick={() => navigate("/my-bookings")}>View My Bookings</Button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h1 className="text-4xl md:text-5xl font-extrabold text-center mb-12 text-slate-800 dark:text-slate-100">
                Secure Checkout
              </h1>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
                {/* --- LEFT COLUMN --- */}
                <div className="space-y-8">
                  {/* Interactive Card */}
                  <div className="w-full max-w-md mx-auto [perspective:1000px]">
                    <div
                      className={cn(
                        "relative w-full h-56 rounded-xl shadow-2xl [transform-style:preserve-3d] transition-transform duration-700",
                        isCardFlipped && "[transform:rotateY(180deg)]"
                      )}
                    >
                      {/* Card Front */}
                      <div
                        className={cn(
                          "absolute w-full h-full [backface-visibility:hidden] rounded-xl p-6 flex flex-col justify-between",
                          "bg-gradient-to-br from-gray-200 to-gray-300 text-slate-800",
                          "dark:from-slate-700 dark:to-slate-900 dark:text-white"
                        )}
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold">Voyage Pro Secure</span>
                          {cardType === "visa" && <VisaLogo />}
                          {cardType === "mastercard" && <MasterCardLogo />}
                        </div>

                        <div className="font-mono text-2xl tracking-widest">
                          {cardDetails.cardNumber || "#### #### #### ####"}
                        </div>

                        <div className="flex justify-between font-mono text-sm uppercase">
                          <span>{cardDetails.cardName || "Your Name"}</span>
                          <span>{cardDetails.expiry || "MM/YY"}</span>
                        </div>
                      </div>

                      {/* Card Back */}
                      <div
                        className={cn(
                          "absolute w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-xl p-6",
                          "bg-gradient-to-br from-gray-100 to-gray-200 text-slate-800",
                          "dark:from-slate-600 dark:to-slate-800 dark:text-white"
                        )}
                      >
                        <div className="h-10 bg-black mt-6"></div>
                        <div className="text-right mt-4">
                          <span className="text-xs">CVV</span>
                          <div
                            className={cn(
                              "h-8 w-20 ml-auto rounded pr-2 pt-1.5 font-mono text-right",
                              "bg-white text-black",
                              "dark:bg-slate-900 dark:text-white"
                            )}
                          >
                            {cardDetails.cvc}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Booking Summary */}
                  <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg border dark:border-slate-700">
                    <h2 className="text-2xl font-bold mb-4 dark:text-slate-100">
                      Booking Summary
                    </h2>
                    <div className="space-y-3 text-slate-700 dark:text-slate-300">
                      <p>
                        <strong>Package:</strong> {bookingData.title}
                      </p>
                      <p>
                        <strong>Date:</strong>{" "}
                        {new Date(bookingData.date).toLocaleDateString("en-IN")}
                      </p>
                      <p>
                        <strong>Guests:</strong> {bookingData.guests}
                      </p>
                      <p>
                        <strong>Contact:</strong> {bookingData.phone}
                      </p>
                      <hr className="my-3 dark:border-slate-700" />
                      <p className="text-2xl font-bold">
                        Total:{" "}
                        <span className="text-brand dark:text-brand-light">
                          {formatRupee(totalAmount)}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* --- RIGHT COLUMN --- */}
                <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg border dark:border-slate-700">
                  <h2 className="text-2xl font-bold mb-6 dark:text-slate-100">
                    Payment Information
                  </h2>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Card Number */}
                    <InputField
                      label="Card Number"
                      name="cardNumber"
                      value={cardDetails.cardNumber}
                      onChange={handleChange}
                      onFocus={() => setIsCardFlipped(false)}
                      required
                      placeholder="0000 0000 0000 0000"
                      error={errors.cardNumber}
                      iconRight={
                        cardType === "default" ? (
                          <CreditCard className="w-6 h-6 text-slate-400" />
                        ) : cardType === "visa" ? (
                          <VisaLogo />
                        ) : (
                          <MasterCardLogo />
                        )
                      }
                    />

                    {/* Name on Card */}
                    <InputField
                      label="Name on Card"
                      name="cardName"
                      value={cardDetails.cardName}
                      onChange={handleChange}
                      onFocus={() => setIsCardFlipped(false)}
                      required
                      placeholder="e.g., Ravi Golaviya"
                      error={errors.cardName}
                      iconRight={<User className="w-5 h-5 text-slate-400" />}
                    />

                    {/* Expiry & CVV */}
                    <div className="grid grid-cols-2 gap-4">
                      <InputField
                        label="Expiry (MM/YY)"
                        name="expiry"
                        value={cardDetails.expiry}
                        onChange={handleChange}
                        onFocus={() => setIsCardFlipped(false)}
                        required
                        placeholder="MM/YY"
                        error={errors.expiry}
                        iconRight={<Calendar className="w-5 h-5 text-slate-400" />}
                      />

                      <InputField
                        label="CVV"
                        name="cvc"
                        value={cardDetails.cvc}
                        onChange={handleChange}
                        onFocus={() => setIsCardFlipped(true)}
                        onBlur={() => setIsCardFlipped(false)}
                        required
                        placeholder="123"
                        error={errors.cvc}
                        iconRight={<Lock className="w-5 h-5 text-slate-400" />}
                      />
                    </div>

                    {status === "error" && (
                      <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-900/40 dark:text-red-300 p-3 rounded-lg">
                        <AlertTriangle size={20} />
                        <span>Payment failed. Please try again.</span>
                      </div>
                    )}

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      className="w-full text-lg mt-4"
                      disabled={status === "loading"}
                    >
                      {status === "loading"
                        ? "Processing..."
                        : `Pay ${formatRupee(totalAmount)}`}
                    </Button>

                    {/* Trust Badge */}
                    <div className="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
                      <Lock size={14} />
                      <span>Secure payment powered by Voyage Pro</span>
                    </div>
                  </form>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PaymentPage;
