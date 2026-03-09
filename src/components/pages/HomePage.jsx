import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Globe,
  Users2,
  Leaf,
  CheckCircle,
  ArrowRight,
  Mail,
} from "lucide-react";
import Button from "../ui/Button";
import PackageCard from "../ui/PackageCard";
import StarRating from "../ui/StarRating";
import StarDisplay from "../ui/StarDisplay";
import AIChatPopup from "../chat/AIChatPopup"; // ✅ Re-added for Home Page
import heroImage from "../../assets/hero-section.jpg";

/* ===============================
🏠 Home Page
=============================== */
const HomePage = ({
  packages,
  testimonials,
  handleAddTestimonial,
  onViewDetails,
  currentUser,
  isUserAuthenticated,
  handleSavePackage,
  handleUnsavePackage,
  handleLikePackage,
  handleUnlikePackage,
}) => {
  const [feedbackData, setFeedbackData] = useState({
    name: "",
    email: "",
    feedback: "",
    rating: 5,
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const navigate = useNavigate();

  /* --- Prefill feedback form for logged-in users --- */
  useEffect(() => {
    if (isUserAuthenticated && currentUser) {
      setFeedbackData({
        name: currentUser.name || "",
        email: currentUser.email || "",
        feedback: "",
        rating: 5,
      });
    } else {
      setFeedbackData({ name: "", email: "", feedback: "", rating: 5 });
    }
  }, [currentUser, isUserAuthenticated]);

  const handleRatingChange = (newRating) => {
    setFeedbackData((prev) => ({ ...prev, rating: newRating }));
  };

  const handleFeedbackSubmit = (e) => {
    e.preventDefault();
    if (feedbackData.name && feedbackData.feedback) {
      handleAddTestimonial(feedbackData);
      setFeedbackData((prev) => ({ ...prev, feedback: "", rating: 5 }));
      setIsSubmitted(true);
      setTimeout(() => setIsSubmitted(false), 3000);
    }
  };

  const buttonContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.4 },
    },
  };

  const buttonItemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: "easeOut" },
    },
  };

  return (
    <>
      {/* --- Hero Section --- */}
      <section className="relative h-screen text-white flex items-center justify-center overflow-hidden">
        {/* ... (Hero background) ... */}
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 bg-cover bg-center animate-ken-burns"
            style={{
              backgroundImage: `url(${heroImage})`,
            }}
          ></div>
          <div className="absolute inset-0 bg-black/60"></div>
        </div>

        {/* ... (Hero content) ... */}
        <div className="relative container mx-auto px-6 text-center z-20">
          <motion.h1
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, type: "spring" }}
            className="text-6xl md:text-8xl font-extrabold leading-tight mb-4 text-shadow-lg"
          >
            Your Journey Begins Here
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto text-slate-200 text-shadow"
          >
            Discover breathtaking destinations and create unforgettable
            memories.
          </motion.p>
          <motion.div
            variants={buttonContainerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <motion.div variants={buttonItemVariants}>
              <Button
                variant="primary"
                className="text-lg px-8 py-4 w-full sm:w-auto"
                onClick={() => navigate("/packages")}
                icon={ArrowRight}
              >
                Explore Packages
              </Button>
            </motion.div>
            <motion.div variants={buttonItemVariants}>
              <Button
                variant="secondary"
                className="text-lg px-8 py-4 w-full sm:w-auto"
                onClick={() => navigate("/contact")}
                icon={Mail}
              >
                Contact Us
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* --- Top Destinations --- */}
      <section className="py-24 bg-white dark:bg-slate-900">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-4xl font-bold text-center mb-4 text-slate-800 dark:text-slate-100">
              Top Destinations
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 text-center mb-16 max-w-2xl mx-auto">
              Handpicked by our travel experts for an experience of a lifetime.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {(packages || []).slice(0, 3).map((pkg, index) => (
              <PackageCard
                key={pkg._id || index}
                pkg={pkg}
                index={index}
                onViewDetails={onViewDetails}
                // ✅ --- START: Pass all props ---
                currentUser={currentUser}
                handleSavePackage={handleSavePackage}
                handleUnsavePackage={handleUnsavePackage}
                handleLikePackage={handleLikePackage}
                handleUnlikePackage={handleUnlikePackage}
              // ✅ --- END: Pass all props ---
              />
            ))}
          </div>
        </div>
      </section>

      {/* --- Why Choose Voyage --- */}
      <section className="py-24 bg-slate-50 dark:bg-slate-800">
        {/* ... (This section remains the same) ... */}
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-4xl font-bold text-center mb-4 text-slate-800 dark:text-slate-100">
              Why Choose Voyage Pro?
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 text-center mb-16 max-w-2xl mx-auto">
              We don't just sell trips — we craft experiences that last a
              lifetime, with a personal touch.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            {[
              {
                icon: Globe,
                title: "Expert-Curated Itineraries",
                desc: "Every destination is handpicked and every itinerary is designed by travel experts.",
              },
              {
                icon: Users2,
                title: "Personalized Service",
                desc: "From first call to your flight home, we provide 24/7 support and personalized attention.",
              },
              {
                icon: Leaf,
                title: "Sustainable Travel",
                desc: "We’re committed to responsible tourism that respects local culture and protects nature.",
              },
            ].map(({ icon: Icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.2 }}
                className="p-6"
              >
                <div className="mx-auto bg-brand/10 text-brand rounded-full h-20 w-20 flex items-center justify-center mb-6">
                  <Icon size={40} />
                </div>
                <h3 className="text-xl font-bold mb-2 dark:text-slate-100">
                  {title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- Testimonials --- */}
      <section className="py-24 bg-white dark:bg-slate-900">
        {/* ... (This section remains the same) ... */}
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-4xl font-bold text-center mb-4 text-slate-800 dark:text-slate-100">
              What Our Travelers Say
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 text-center mb-16 max-w-2xl mx-auto">
              Real stories from travelers who explored the world with us.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {(testimonials || []).map((t, i) => (
              <motion.div
                key={t._id || i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-slate-50 dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col items-center text-center hover:-translate-y-2 transition-transform duration-300"
              >
                <StarDisplay rating={t.rating || 5} size={20} />
                <p className="text-slate-600 dark:text-slate-300 italic my-6 text-base">
                  "{t.feedback}"
                </p>
                <div className="w-12 h-0.5 bg-brand/20 mx-auto"></div>
                <h4 className="font-semibold text-slate-800 dark:text-slate-100 mt-5 uppercase tracking-wide">
                  {t.name}
                </h4>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- Feedback Form --- */}
      <section className="py-24 bg-slate-50 dark:bg-slate-800">
        {/* ... (This section remains the same) ... */}
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-brand rounded-3xl p-12 text-white text-center shadow-2xl shadow-brand/30 relative overflow-hidden"
          >
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full"></div>
            <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-white/10 rounded-full"></div>
            <div className="relative z-10">
              <h2 className="text-4xl font-bold mb-4">Share Your Story</h2>
              <p className="text-lg text-brand-light/90 mb-8 max-w-2xl mx-auto">
                Your feedback inspires us — and helps other travelers plan their
                dream journey.
              </p>
              <AnimatePresence>
                {isSubmitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex flex-col items-center justify-center h-48"
                  >
                    <CheckCircle size={64} className="text-white mb-4" />
                    <p className="text-2xl font-semibold">
                      Thank you for your feedback!
                    </p>
                  </motion.div>
                ) : (
                  <motion.form
                    onSubmit={handleFeedbackSubmit}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="max-w-xl mx-auto"
                  >
                    <div className="mb-6">
                      <label className="block text-lg font-semibold text-white mb-3">
                        Your Rating
                      </label>
                      <StarRating
                        rating={feedbackData.rating}
                        onRatingChange={handleRatingChange}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <input
                        type="text"
                        placeholder="Your Name"
                        value={feedbackData.name}
                        onChange={(e) =>
                          setFeedbackData({
                            ...feedbackData,
                            name: e.target.value,
                          })
                        }
                        className="w-full bg-white/20 border border-white/30 rounded-lg px-5 py-3 text-white placeholder-brand-light focus:outline-none focus:ring-2 focus:ring-white disabled:opacity-75 disabled:cursor-not-allowed"
                        required
                        disabled={isUserAuthenticated}
                      />
                      <input
                        type="email"
                        placeholder="Your Email"
                        value={feedbackData.email}
                        onChange={(e) =>
                          setFeedbackData({
                            ...feedbackData,
                            email: e.target.value,
                          })
                        }
                        className="w-full bg-white/20 border border-white/30 rounded-lg px-5 py-3 text-white placeholder-brand-light focus:outline-none focus:ring-2 focus:ring-white disabled:opacity-75 disabled:cursor-not-allowed"
                        required
                        disabled={isUserAuthenticated}
                      />
                    </div>
                    <textarea
                      placeholder="Your Feedback"
                      value={feedbackData.feedback}
                      onChange={(e) =>
                        setFeedbackData({
                          ...feedbackData,
                          feedback: e.target.value,
                        })
                      }
                      rows="4"
                      className="w-full bg-white/20 border border-white/30 rounded-2xl px-5 py-3 mb-6 text-white placeholder-brand-light focus:outline-none focus:ring-2 focus:ring-white transition"
                      required
                    ></textarea>
                    <Button
                      variant="secondary"
                      type="submit"
                      className="w-full md:w-auto"
                    >
                      Submit Feedback
                    </Button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </section>


      {/* 🤖 AI Chat Popup (Home Page Only) */}
      <AIChatPopup currentUser={currentUser} />
    </>
  );
};

export default HomePage;