// src/components/pages/ContactPage.jsx

import React, { useState } from "react";
import apiClient from "../../api/apiClient";
import { motion } from "framer-motion";
import { MapPin, Mail, Phone, Clock, Send } from "lucide-react";
import { cn } from "../../utils/helpers";
import Button from "../ui/Button"; // ✅ ADDED

const ContactPage = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(false);
    setLoading(true);

    try {
      const res = await apiClient.post("/contact/add", form);
      if (res.data?.success) {
        setSuccess(true);
        setForm({ name: "", email: "", subject: "", message: "" });
      } else {
        alert("Failed to send message.");
      }
    } catch (err) {
      console.error(err);
      alert("Server error while sending message.");
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-28 pb-20 px-6">
      <div className="max-w-6xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
          Get In Touch
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-lg">
          Have questions or ready to book your next adventure? We're here to
          help!
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={cn(
          "max-w-6xl mx-auto bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 grid grid-cols-1 md:grid-cols-2 gap-8"
        )}
      >
        {/* --- LEFT: Contact Info --- */}
        <div className="space-y-6 flex flex-col justify-center">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
            Contact Information
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Fill out the form, or use our contact details below.
          </p>

          <div className="space-y-5 mt-6">
            {[
              {
                icon: MapPin,
                title: "Our Office",
                info: "123 Voyage Avenue, Wanderlust City, Surat",
              },
              { icon: Mail, title: "Email Us", info: "hello@voyage.com" },
              { icon: Phone, title: "Call Us", info: "+91 (261) 567-8901" },
              {
                icon: Clock,
                title: "Business Hours",
                info: "Mon - Fri: 9am - 6pm",
              },
            ].map(({ icon: Icon, title, info }) => (
              <div key={title} className="flex items-start space-x-3">
                <div className="bg-brand/10 dark:bg-brand-hover/20 p-3 rounded-full">
                  <Icon className="text-brand" size={20} />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white">
                    {title}
                  </h4>
                  <p className="text-slate-600 dark:text-slate-400">{info}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* --- RIGHT: Map + Form --- */}
        <div className="space-y-6">
          <div className="rounded-xl overflow-hidden shadow-md border border-slate-200 dark:border-slate-700">
            <iframe
              title="Voyage Travel Office"
              src="https://maps.google.com/maps?width=600&height=400&hl=en&q=Surat&t=&z=13&ie=UTF8&iwloc=B&output=embed"
              width="100%"
              height="250"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
            ></iframe>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {success && (
              <p className="text-green-600 bg-green-50 dark:bg-green-900/40 dark:text-green-300 p-3 rounded-md text-center">
                Message sent successfully!
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                name="name"
                placeholder="Your Name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900/40 outline-none focus:ring-2 focus:ring-brand"
              />
              <input
                type="email"
                name="email"
                placeholder="Your Email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900/40 outline-none focus:ring-2 focus:ring-brand"
              />
            </div>

            <input
              type="text"
              name="subject"
              placeholder="Subject"
              value={form.subject}
              onChange={handleChange}
              required
              className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900/40 outline-none focus:ring-2 focus:ring-[#00897B]"
            />

            <textarea
              name="message"
              placeholder="Your Message"
              value={form.message}
              onChange={handleChange}
              required
              rows="4"
              className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900/40 outline-none focus:ring-2 focus:ring-[#00897B]"
            ></textarea>

            {/* ✅ FIX 1: Replaced motion.button with <Button> for consistent animation */}
            <div className="flex justify-center sm:justify-start">
              <Button
                type="submit"
                disabled={loading}
                className="bg-brand hover:bg-brand-hover"
                icon={Send}
              >
                {loading ? "Sending..." : "Send Message"}
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default ContactPage;
