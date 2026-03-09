import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle,
  MapPin,
  Clock,
  Star,
  Heart,
  Link,
  FileText,
  Bookmark,
  Users,
  Plus,
  AlertTriangle
} from "lucide-react";
import Button from "../ui/Button";
import InputField from "../ui/InputField";
// import Modal from "../ui/Modal"; // Removed as we use inline validation
import StarRating from "../ui/StarRating"; // ✅ Import animated star component
import { formatRupee } from "../../utils/format";
import apiClient from "../../api/apiClient";
import { cn, getImageUrl } from "../../utils/helpers";

const PackageDetailsPage = ({
  pkg: initialPkg,
  handleProceedToPayment,
  isUserAuthenticated,
  currentUser,
  handleSavePackage,
  handleUnsavePackage,
  handleLikePackage,
  handleUnlikePackage,
}) => {
  const [pkg, setPkg] = useState(initialPkg);
  const navigate = useNavigate();
  const locationState = useLocation().state || {};
  const { addOnFor, newStartDate, previousLocation, phone, previousDocument } = locationState;

  // Keep sync with prop updates
  useEffect(() => {
    setPkg(initialPkg);
  }, [initialPkg]);

  const [bookingDetails, setBookingDetails] = useState({
    phone: "",
    date: "",
    guests: 1,
    requests: "",
  });

  const [documentFile, setDocumentFile] = useState(null);
  const [error, setError] = useState("");
  const today = new Date().toISOString().split("T")[0];
  const [usePreviousDoc, setUsePreviousDoc] = useState(!!previousDocument);

  // ✅ --- CAB BOOKING STATE ---
  const [cabBooking, setCabBooking] = useState(false);
  const CAB_PRICE = 500;
  // ✅ --- END CAB BOOKING STATE ---

  // --- Pre-fill Date & Phone for Add-on ---
  useEffect(() => {
    if (newStartDate) {
      setBookingDetails((prev) => ({
        ...prev,
        date: newStartDate,
        phone: phone || prev.phone
      }));
    }
  }, [newStartDate, phone]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "phone") {
      const numericValue = value.replace(/\D/g, "");
      if (numericValue.length <= 10) {
        setBookingDetails({ ...bookingDetails, [name]: numericValue });
      }
    } else {
      setBookingDetails({ ...bookingDetails, [name]: value });
    }
  };

  const [isValidating, setIsValidating] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError("");
    setDocumentFile(null);
    setIsValidating(true);

    try {
      if (!file.type.startsWith("image/")) {
        setError("Please upload an image file (JPG, PNG) for verification.");
        setIsValidating(false);
        e.target.value = "";
        return;
      }

      if (window.Tesseract) {
        const { data: { text } } = await window.Tesseract.recognize(
          file,
          'eng',
          { logger: (m) => console.log(m) }
        );

        const lowerText = text.toLowerCase();
        const keywords = ["aadhar", "uidai", "government of india", "unique identification", "mera aadhaar", "father", "dob", "yob"];
        const aadharPattern = /\b\d{4}\s\d{4}\s\d{4}\b/;
        const hasKeyword = keywords.some((k) => lowerText.includes(k));
        const hasPattern = aadharPattern.test(text);

        if (hasKeyword || hasPattern) {
          setDocumentFile(file);
          setError("");
        } else {
          setDocumentFile(null);
          setError("Uploaded document is not a valid Aadhar Card. Please upload a clear image of your ID.");
          e.target.value = "";
        }
      } else {
        console.warn("Tesseract not loaded, skipping validation");
        setDocumentFile(file);
      }
    } catch (err) {
      console.error("OCR Error:", err);
      setError("Failed to verify document. Please ensure it is a clear image.");
      e.target.value = "";
    } finally {
      setIsValidating(false);
    }
  };

  // --- Rating Logic ---
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState("");
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [ratingError, setRatingError] = useState("");
  const [ratingSuccess, setRatingSuccess] = useState("");

  const handleRatingSubmit = async (e) => {
    e.preventDefault();
    if (!isUserAuthenticated) {
      alert("Please log in to rate this package.");
      return;
    }
    if (userRating === 0) {
      setRatingError("Please select a star rating.");
      return;
    }

    setIsSubmittingRating(true);
    setRatingError("");
    setRatingSuccess("");

    try {
      const res = await apiClient.post(`/packages/${pkg._id}/rate`, {
        rating: userRating,
        comment: userComment,
      });
      setRatingSuccess("Thank you for your rating!");

      setTimeout(() => {
        if (res.data.data) {
          setPkg(res.data.data);
        }
        setRatingSuccess("");
        setUserRating(0);
        setUserComment("");
      }, 2000);
    } catch (err) {
      console.error("Rating Submission Error:", err);
      const errMsg = err.response?.data?.message || err.message || "Failed to submit rating.";
      setRatingError(errMsg);
      alert(`Error: ${errMsg}`);
    } finally {
      setIsSubmittingRating(false);
    }
  };

  // ✅ --- Duplicate Booking Logic (Inline) ---
  const [duplicateBookingId, setDuplicateBookingId] = useState(null);
  const [duplicateInfo, setDuplicateInfo] = useState(null);

  // Check for conflicts immediately when date changes
  useEffect(() => {
    const checkConflict = async () => {
      // If no date or no user, clear
      if (!bookingDetails.date || !pkg?._id || !isUserAuthenticated) {
        setDuplicateInfo(null);
        setDuplicateBookingId(null);
        return;
      }

      // If already add-on, skip
      if (addOnFor) return;

      try {
        const res = await apiClient.post("/requests/check-duplicate", {
          packageId: pkg._id,
          date: bookingDetails.date
        });

        if (res.data.exists) {
          console.log("Duplicate Check Response:", res.data);
          setDuplicateBookingId(res.data.bookingId);
          setDuplicateInfo({
            startDate: res.data.existingStartDate,
            endDate: res.data.existingEndDate,
            guests: res.data.currentGuests,
            packageName: res.data.packageName,
            documentPath: res.data.documentPath, // ✅ Store document path
            clientPhone: res.data.clientPhone,
            cabBooking: !!res.data.cabBooking // ✅ Force boolean
          });

          // ✅ AUTO-FILL Phone
          handleChange({ target: { name: 'phone', value: res.data.clientPhone || '' } });
          // ✅ AUTO-SELECT "Use Previous Doc"
          setUsePreviousDoc(true);
          if (res.data.documentPath) setPreviousDocument(res.data.documentPath);

          // ✅ AUTO-HANDLE CAB
          // If existing trip has cab, we note it
          if (res.data.cabBooking) {
            setCabBooking(true);
          }

        } else {
          setDuplicateInfo(null);
          setDuplicateBookingId(null);
          // Don't clear phone/doc automatically, user might have typed it
        }
      } catch (err) {
        console.error("Quick duplicate check failed", err);
      }
    };

    const timeoutId = setTimeout(checkConflict, 500); // 500ms debounce to avoid spam
    return () => clearTimeout(timeoutId);
  }, [bookingDetails.date, pkg, isUserAuthenticated, addOnFor]);

  const confirmExtendMembers = () => {
    // Proceed with booking as an "Add-on"
    const fullBookingData = {
      ...bookingDetails,
      documentFile: documentFile,
      packageId: pkg._id,
      title: pkg.name,
      price: pkg.price,
      location: pkg.location,
      duration: pkg.duration,
      clientName: currentUser.name,
      clientEmail: currentUser.email,
      totalAmount: (pkg.price || 0) * (bookingDetails.guests || 1) + (cabBooking ? CAB_PRICE : 0),
      parentRequestId: duplicateBookingId,
      isAddOn: true,
      previousDocument: usePreviousDoc ? previousDocument : null,
      cabBooking: cabBooking,
      cabBookingPrice: cabBooking ? CAB_PRICE : 0,
    };
    handleProceedToPayment(fullBookingData);
  };

  const handleSubmitToPayment = async (e) => {
    e.preventDefault();
    setError("");

    if (!isUserAuthenticated) {
      alert("Please log in to book a package.");
      navigate("/login");
      return;
    }

    if (!bookingDetails.date) {
      setError("Please select a travel date.");
      return;
    }

    if (!bookingDetails.phone || bookingDetails.phone.length !== 10) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }

    // IF DUPLICATE IS PRESENT, WE DEFAULT TO "ADD TO EXISTING"
    // We use the document from the existing booking so the user doesn't need to upload one.
    const isAddOnFlow = !!duplicateInfo;

    // If it's NOT an add-on flow, check for document
    if (!isAddOnFlow && !documentFile && !usePreviousDoc) {
      setError("Please upload the required document.");
      return;
    }

    setIsValidating(true);

    // Construct Booking Data
    const fullBookingData = {
      ...bookingDetails,
      documentFile: documentFile, // Might be null if add-on
      packageId: pkg._id,
      title: pkg.name,
      price: pkg.price,
      location: pkg.location,
      duration: pkg.duration,
      clientName: currentUser.name,
      clientEmail: currentUser.email,
      // IF existing trip has cab (duplicateInfo.cabBooking), we DO NOT charge for it again even if cabBooking is true.
      totalAmount: (pkg.price || 0) * (bookingDetails.guests || 1) +
        (cabBooking && (!duplicateInfo?.cabBooking) ? CAB_PRICE : 0),

      // ✅ Add-on Specifics
      parentRequestId: isAddOnFlow ? duplicateBookingId : (addOnFor || null),
      isAddOn: isAddOnFlow || !!addOnFor,
      // If add-on, reuse the document from the duplicate info
      previousDocument: isAddOnFlow ? duplicateInfo.documentPath : (usePreviousDoc ? previousDocument : null),

      cabBooking: cabBooking,
      cabBookingPrice: (cabBooking && (!duplicateInfo?.cabBooking)) ? CAB_PRICE : 0,
    };



    handleProceedToPayment(fullBookingData);
    setIsValidating(false);
  };

  const proceedWithSubmission = () => {
    const fullBookingData = {
      ...bookingDetails,
      documentFile: documentFile,
      packageId: pkg._id,
      title: pkg.name,
      price: pkg.price,
      location: pkg.location,
      duration: pkg.duration,
      clientName: currentUser.name,
      clientEmail: currentUser.email,
      totalAmount: (pkg.price || 0) * (bookingDetails.guests || 1) + (cabBooking ? CAB_PRICE : 0),
      parentRequestId: addOnFor || null,
      isAddOn: !!addOnFor,
      previousDocument: usePreviousDoc ? previousDocument : null,
      cabBooking: cabBooking,
      cabBookingPrice: cabBooking ? CAB_PRICE : 0,
    };

    handleProceedToPayment(fullBookingData);
    setIsValidating(false);
  };

  // ✅ Valid null check AFTER all hooks
  if (!pkg) return null;

  // --- Save/Unsave Logic ---
  const isSaved = currentUser?.savedPackages?.includes(pkg._id);
  const onSaveClick = () => {
    if (!isUserAuthenticated) {
      alert("Please log in to save packages.");
      navigate("/login");
      return;
    }
    if (isSaved) {
      handleUnsavePackage(pkg._id);
    } else {
      handleSavePackage(pkg._id);
    }
  };

  // --- Like/Unlike Logic ---
  const isLiked = currentUser?.likedPackages?.includes(pkg._id);
  const onLikeClick = () => {
    if (!isUserAuthenticated) {
      alert("Please log in to like packages.");
      navigate("/login");
      return;
    }
    if (isLiked) {
      handleUnlikePackage(pkg._id);
    } else {
      handleLikePackage(pkg._id);
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-900 pt-20 md:pt-32 pb-20">
      <div className="container mx-auto px-4 md:px-6">
        {/* --- Back to Packages --- */}
        <button
          onClick={() => navigate("/packages")}
          className="flex items-center text-brand dark:text-brand-light font-semibold mb-6 md:mb-8 hover:underline text-sm md:text-base"
        >
          <ArrowLeft className="mr-2" size={18} /> Back to Packages
        </button>

        {/* --- Layout: Info + Booking Form --- */}
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-12">
          {/* --- Package Info --- */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border dark:border-slate-700"
            >
              <motion.img
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                src={getImageUrl(pkg.image)}
                alt={pkg.name}
                className="w-full aspect-video object-cover"
              />

              <div className="p-4 md:p-8">
                {/* --- Title & Action Buttons --- */}
                <div className="flex flex-col md:flex-row justify-between items-start mb-4 gap-4 md:gap-0">
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-800 dark:text-slate-100 leading-tight">
                    {pkg.name}
                  </h1>

                  <div className="flex gap-2 flex-shrink-0 self-end md:self-auto">
                    <Button
                      onClick={onSaveClick}
                      variant="secondary"
                      className={cn(
                        "flex-shrink-0 !px-3 !py-2 shadow-md",
                        "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                      )}
                      title={isSaved ? "Unsave" : "Save"}
                    >
                      <Bookmark
                        size={20}
                        className={cn(isSaved && "fill-brand text-brand")}
                      />
                    </Button>

                    <Button
                      onClick={onLikeClick}
                      variant="secondary"
                      className={cn(
                        "flex-shrink-0 !px-3 !py-2 shadow-md",
                        "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                      )}
                      title={isLiked ? "Unlike" : "Like"}
                    >
                      <Heart
                        size={20}
                        className={cn(isLiked && "fill-red-500 text-red-500")}
                      />
                    </Button>
                  </div>
                </div>

                {/* --- Highlights Bar --- */}
                <div className="flex flex-wrap gap-3 md:gap-4 text-sm text-slate-600 dark:text-slate-300 mb-6">
                  <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700/50 px-2 py-1 rounded-md">
                    <MapPin size={16} className="text-brand" />
                    <span>{pkg.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700/50 px-2 py-1 rounded-md">
                    <Clock size={16} className="text-brand" />
                    <span>{pkg.duration} Days</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700/50 px-2 py-1 rounded-md">
                    <Star size={16} className="text-yellow-500" />
                    <span>{pkg.rating} Rating</span>
                  </div>
                </div>

                <p className="text-base md:text-lg text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                  {pkg.description}
                </p>

                <h3 className="text-xl md:text-2xl font-bold mb-4 text-slate-800 dark:text-slate-100">
                  Highlights
                </h3>

                <ul className="space-y-3 text-slate-700 dark:text-slate-300">
                  {(pkg.highlights || []).map((h, i) => (
                    <li key={i} className="flex items-start md:items-center gap-3">
                      <CheckCircle
                        size={18}
                        className="text-green-500 flex-shrink-0 mt-0.5 md:mt-0"
                      />
                      <span className="text-sm md:text-base">{h}</span>
                    </li>
                  ))}
                </ul>

                {/* --- User Ratings & Reviews Section --- */}
                <div className="mt-10 border-t border-slate-200 dark:border-slate-700 pt-8">
                  <h3 className="text-xl md:text-2xl font-bold mb-6 text-slate-800 dark:text-slate-100">
                    Ratings & Reviews
                  </h3>

                  <div className="flex items-center gap-4 mb-8">
                    <div className="text-5xl font-bold text-slate-800 dark:text-slate-100">
                      {pkg.rating ? Number(pkg.rating).toFixed(1) : "0.0"}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex text-yellow-500">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={20}
                            fill={star <= Math.round(pkg.rating || 0) ? "currentColor" : "none"}
                            className={star <= Math.round(pkg.rating || 0) ? "" : "text-slate-300 dark:text-slate-600"}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        {pkg.reviews?.length || 0} reviews
                      </span>
                    </div>
                  </div>

                  {isUserAuthenticated ? (
                    <div className="bg-slate-50 dark:bg-slate-700/30 p-6 rounded-xl border border-slate-200 dark:border-slate-600">
                      <h4 className="font-semibold text-lg mb-4 text-slate-800 dark:text-slate-100">
                        Rate this Package
                      </h4>

                      {ratingSuccess ? (
                        <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 p-4 rounded-lg flex items-center gap-2">
                          <CheckCircle size={20} />
                          {ratingSuccess}
                        </div>
                      ) : (
                        <form onSubmit={handleRatingSubmit} className="space-y-4">
                          <div className="flex justify-start mb-4">
                            <StarRating
                              rating={userRating}
                              onRatingChange={setUserRating}
                            />
                          </div>

                          <textarea
                            placeholder="Share your experience (optional)..."
                            value={userComment}
                            onChange={(e) => setUserComment(e.target.value)}
                            rows="3"
                            className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-brand"
                          />

                          {ratingError && (
                            <p className="text-red-500 text-sm">{ratingError}</p>
                          )}

                          <Button
                            type="submit"
                            disabled={isSubmittingRating}
                            className="bg-brand hover:bg-brand-hover text-white px-6 py-2 rounded-lg"
                          >
                            {isSubmittingRating ? "Submitting..." : "Submit Review"}
                          </Button>
                        </form>
                      )}
                    </div>
                  ) : (
                    <div className="text-slate-500 dark:text-slate-400 italic">
                      Please <span onClick={() => navigate("/login")} className="text-brand cursor-pointer hover:underline">log in</span> to write a review.
                    </div>
                  )}

                  <div className="mt-8 space-y-6">
                    {pkg.reviews?.length > 0 ? (
                      pkg.reviews.map((review, i) => (
                        <div key={i} className="border-b border-slate-100 dark:border-slate-700 pb-6 last:border-0">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-semibold text-slate-800 dark:text-slate-200">
                              {review.userName}
                            </h5>
                            <span className="text-xs text-slate-500">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex text-yellow-500 mb-2">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={14}
                                fill={i < review.rating ? "currentColor" : "none"}
                                className={i < review.rating ? "" : "text-slate-300 dark:text-slate-600"}
                              />
                            ))}
                          </div>
                          {review.comment && (
                            <p className="text-slate-600 dark:text-slate-300 text-sm">
                              {review.comment}
                            </p>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-500 dark:text-slate-400 text-center py-4">
                        No reviews yet. Be the first to rate!
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-800 p-5 md:p-8 rounded-2xl shadow-xl sticky top-28 border dark:border-slate-700">
              <h2 className="text-2xl md:text-3xl font-bold mb-2 text-slate-800 dark:text-slate-100">
                Book Your Trip
              </h2>

              {addOnFor && (
                <div className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 rounded-lg p-3 mb-4 flex items-start gap-3">
                  <Link className="text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" size={18} />
                  <div>
                    <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                      Extending your trip
                    </p>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400">
                      Continuing from {previousLocation}
                    </p>
                  </div>
                </div>
              )}

              <div className="text-2xl md:text-3xl font-bold text-brand dark:text-brand-light mb-6">
                {formatRupee(pkg.price)}
                <span className="text-base md:text-lg font-normal text-slate-500 dark:text-slate-400">
                  /person
                </span>
              </div>

              <form onSubmit={handleSubmitToPayment} className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <InputField
                      label="Travel Date"
                      name="date"
                      type="date"
                      value={bookingDetails.date}
                      onChange={handleChange}
                      required
                      min={today}
                      className="!py-2.5 !text-sm"
                    />
                  </div>
                  <div className="col-span-1">
                    <InputField
                      label="Guests"
                      name="guests"
                      type="number"
                      min="1"
                      value={bookingDetails.guests}
                      onChange={handleChange}
                      required
                      className="!py-2.5 !text-sm"
                    />
                  </div>
                </div>

                {/* ✅ Duplicate Booking Inline Warning */}
                {duplicateInfo && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg shadow-sm"
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-1">
                        <Users size={16} className="text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <p className="text-xs font-bold text-amber-800 dark:text-amber-200 uppercase tracking-wide mb-1">
                            Trip Overlap
                          </p>
                        </div>
                        <p className="text-xs text-amber-700 dark:text-amber-300 mb-3 leading-relaxed">
                          Trip to <strong>{duplicateInfo.packageName}</strong> is already booked from <span className="font-semibold">{new Date(duplicateInfo.startDate).toLocaleDateString('en-GB', { timeZone: 'UTC' })}</span> to <span className="font-semibold">{new Date(duplicateInfo.endDate).toLocaleDateString('en-GB', { timeZone: 'UTC' })}</span>.
                        </p>

                        {/* ✅ Guest Counter Inside Warning */}
                        <div className="flex items-center gap-3 mb-3 bg-white/60 dark:bg-black/20 p-2 rounded-md border border-amber-200/50">
                          <span className="text-xs font-bold text-amber-800 dark:text-amber-200 uppercase tracking-wide">
                            Guests to Add:
                          </span>
                          <div className="flex items-center gap-2 ml-auto">
                            <button
                              type="button"
                              onClick={() => {
                                const newVal = Math.max(1, parseInt(bookingDetails.guests || 1) - 1);
                                handleChange({ target: { name: 'guests', value: newVal } });
                              }}
                              className="w-6 h-6 flex items-center justify-center bg-amber-200 hover:bg-amber-300 text-amber-800 rounded text-sm font-bold transition-colors"
                            >
                              -
                            </button>
                            <span className="w-8 text-center text-sm font-bold text-amber-900 dark:text-amber-100">
                              {bookingDetails.guests}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const newVal = parseInt(bookingDetails.guests || 1) + 1;
                                handleChange({ target: { name: 'guests', value: newVal } });
                              }}
                              className="w-6 h-6 flex items-center justify-center bg-amber-200 hover:bg-amber-300 text-amber-800 rounded text-sm font-bold transition-colors"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        {/* Button removed as per request */}
                      </div>
                    </div>
                  </motion.div>
                )}

                <InputField
                  label="Contact Phone"
                  name="phone"
                  type="tel"
                  placeholder="10-digit number"
                  value={bookingDetails.phone}
                  onChange={handleChange}
                  required
                  className="!py-2.5 !text-sm"
                />

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Upload Document (ID Proof)
                  </label>

                  {/* ✅ DUPLICATE / OVERLAP CASE: Show Choice */}
                  {duplicateInfo ? (
                    <div className="space-y-3 mb-3">
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="docChoice"
                            checked={usePreviousDoc}
                            onChange={() => setUsePreviousDoc(true)}
                            className="w-4 h-4 text-brand focus:ring-brand"
                          />
                          <span className="text-sm text-slate-700 dark:text-slate-300">Use existing document</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="docChoice"
                            checked={!usePreviousDoc}
                            onChange={() => setUsePreviousDoc(false)}
                            className="w-4 h-4 text-brand focus:ring-brand"
                          />
                          <span className="text-sm text-slate-700 dark:text-slate-300">Upload new</span>
                        </label>
                      </div>

                      {usePreviousDoc ? (
                        <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-md border border-amber-200 dark:border-amber-800">
                          <FileText size={16} className="text-amber-600" />
                          <span className="text-xs text-slate-600 dark:text-slate-300 truncate max-w-[200px]">
                            {duplicateInfo.documentPath ? duplicateInfo.documentPath.split(/[/\\]/).pop() : "Linked Document"}
                          </span>
                          <span className="text-xs text-green-600 ml-auto font-bold flex items-center gap-1">
                            <CheckCircle size={10} /> Auto-Linked
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <input
                            type="file"
                            name="document"
                            accept="image/*"
                            onChange={handleFileChange}
                            required
                            className={cn(
                              "w-full border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-500 dark:text-slate-400",
                              "file:mr-4 file:py-2 file:px-4 file:border-0 file:rounded-lg",
                              "file:bg-brand file:hover:bg-brand-hover",
                              "file:text-white file:font-semibold file:cursor-pointer",
                              "dark:bg-slate-700",
                              "!p-1"
                            )}
                          />
                          {isValidating && (
                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 animate-pulse font-semibold">
                              Verifying document content... Please wait.
                            </p>
                          )}
                          {documentFile && !isValidating && (
                            <p className="text-xs text-green-600 dark:text-green-400 mt-1 truncate flex items-center gap-1">
                              <CheckCircle size={12} /> Verified: Aadhar Card Detected ({documentFile.name})
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    // NORMAL CASE (No Overlap)
                    <div className="space-y-2">
                      <input
                        type="file"
                        name="document"
                        accept="image/*"
                        onChange={handleFileChange}
                        required={!usePreviousDoc}
                        disabled={usePreviousDoc || isValidating}
                        className={cn(
                          "w-full border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-500 dark:text-slate-400",
                          "file:mr-4 file:py-2 file:px-4 file:border-0 file:rounded-lg",
                          "file:bg-brand file:hover:bg-brand-hover",
                          "file:text-white file:font-semibold file:cursor-pointer",
                          "dark:bg-slate-700",
                          "!p-1",
                          (usePreviousDoc || isValidating) && "opacity-50 cursor-not-allowed"
                        )}
                      />
                      {isValidating && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 animate-pulse font-semibold">
                          Verifying document content... Please wait.
                        </p>
                      )}
                      {documentFile && !isValidating && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1 truncate flex items-center gap-1">
                          <CheckCircle size={12} /> Verified: Aadhar Card Detected ({documentFile.name})
                        </p>
                      )}
                      {error && (
                        <p className="text-red-500 text-sm mt-1">{error}</p>
                      )}

                      {/* Only show "Reuse" checkbox if explicitly an add-on (passed via props/url), not just overlap detection */}
                      {(addOnFor || previousDocument) && (
                        <div className="flex items-center gap-2 mt-2">
                          <input
                            type="checkbox"
                            id="usePreviousDoc"
                            checked={usePreviousDoc}
                            onChange={(e) => {
                              setUsePreviousDoc(e.target.checked);
                              if (e.target.checked) {
                                setDocumentFile(null);
                                setError("");
                              }
                            }}
                            className="w-4 h-4 text-brand rounded focus:ring-brand"
                          />
                          <label htmlFor="usePreviousDoc" className="text-sm text-slate-700 dark:text-slate-300">
                            Reuse document from previous trip?
                          </label>
                        </div>
                      )}

                      {usePreviousDoc && previousDocument && (
                        <div className="flex items-center gap-2 p-2 bg-slate-100 dark:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-600">
                          <FileText size={16} className="text-brand" />
                          <span className="text-xs text-slate-600 dark:text-slate-300 truncate max-w-[200px]">
                            {previousDocument}
                          </span>
                          <span className="text-xs text-green-600 ml-auto font-medium">Linked</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* ✅ --- CAB BOOKING OPTION --- */}
                <div className="flex items-start gap-3 p-3 bg-brand/10 dark:bg-brand-hover/20 border border-brand/20 dark:border-brand-hover/40 rounded-lg">
                  {duplicateInfo?.cabBooking ? (
                    <div className="w-full flex items-center gap-3">
                      <CheckCircle size={20} className="text-brand dark:text-brand-light flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-brand dark:text-brand-light">
                          Transfer Included
                        </p>
                        <p className="text-xs text-brand/80 dark:text-brand-light/80">
                          Station/Airport transfer is already active for this trip.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <input
                        type="checkbox"
                        id="cabBooking"
                        checked={cabBooking}
                        onChange={(e) => setCabBooking(e.target.checked)}
                        className="mt-1 w-4 h-4 text-brand rounded focus:ring-brand cursor-pointer"
                      />
                      <label htmlFor="cabBooking" className="text-sm cursor-pointer flex-1">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                          Add Station/Airport Transfer
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">
                          Includes pick-up & drop-off via private cab.
                        </span>
                        <span className="text-brand dark:text-brand-light font-bold text-sm block mt-1">
                          + {formatRupee(CAB_PRICE)}
                        </span>
                      </label>
                    </>
                  )}
                </div>

                {/* ✅ --- END CAB BOOKING OPTION --- */}

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Special Requests
                  </label>
                  <textarea
                    name="requests"
                    rows="3"
                    value={bookingDetails.requests}
                    onChange={handleChange}
                    className="w-full p-3 !py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 text-sm"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isValidating}
                  className={cn(
                    "w-full text-base font-semibold mt-4 !py-2.5 shadow-lg whitespace-nowrap",
                    isValidating && "opacity-70 cursor-not-allowed"
                  )}
                >
                  {duplicateInfo ? (
                    <>
                      <Plus className="mr-2 w-5 h-5" />
                      Add {bookingDetails.guests} Guests to Existing Trip
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 w-5 h-5" />
                      {isValidating ? "Verifying..." : "Proceed to Payment"}
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div >



    </div >
  );
};

export default PackageDetailsPage;