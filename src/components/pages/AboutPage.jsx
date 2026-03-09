// src/components/pages/AboutPage.jsx

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Target,
  Building,
  Heart,
  ShieldCheck,
  Globe,
  Users,
  Compass,
} from "lucide-react";
import { formatRupee } from "../../utils/format";
import apiClient from "../../api/apiClient";
import { cn, getImageUrl } from "../../utils/helpers";

const AboutPage = () => {
  const [teamMembers, setTeamMembers] = useState([]);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const { data } = await apiClient.get("/team");
        setTeamMembers(data.data || []);
      } catch (error) {
        console.error("Failed to fetch team", error);
      }
    };
    fetchTeam();
  }, []);

  return (
    <div className="pt-32 pb-24 bg-white dark:bg-slate-900 min-h-screen">
      <div className="container mx-auto px-6">
        {/* --- Heading --- */}
        <h1 className="text-5xl font-extrabold text-center mb-6 text-slate-800 dark:text-slate-100">
          About Voyage Pro
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-300 text-center mb-16 max-w-3xl mx-auto">
          Voyage Pro isn’t just a travel company — it’s a community of dreamers,
          explorers, and storytellers. Every journey we plan is designed to
          connect you with people, places, and moments that stay with you for a
          lifetime.
        </p>

        {/* --- Mission & Story --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center mb-24">
          <div>
            <img
              src="https://images.unsplash.com/photo-1522199755839-a2bacb67c546?q=80&w=2072&auto=format&fit=crop"
              alt="Our Story"
              className="rounded-2xl shadow-2xl"
            />
          </div>

          <div>
            <h2 className="text-3xl font-bold mb-4 text-brand flex items-center">
              <Target className="mr-3" /> Our Mission
            </h2>
            <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
              To craft immersive travel experiences that go beyond sightseeing.
              We aim to inspire, to connect, and to bring the joy of exploration
              to every traveler — responsibly and passionately.
            </p>

            <h2 className="text-3xl font-bold mb-4 text-brand flex items-center">
              <Building className="mr-3" /> Our Story
            </h2>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              What began in 2010 as a small team of travel lovers is now a
              trusted name in personalized experiences. From mountain treks to
              serene island escapes, we’ve helped over 20,000 travelers find
              their path — and themselves.
            </p>
          </div>
        </div>

        {/* --- Our Values --- */}
        <div className="mb-24">
          <h2 className="text-4xl font-bold text-center mb-12 text-slate-800 dark:text-slate-100">
            Our Values
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {[
              {
                icon: (
                  <Heart size={40} className="mx-auto text-brand mb-4" />
                ),
                title: "Passion",
                text: "We are travelers first — our love for discovery shapes every itinerary, ensuring authenticity in every experience.",
              },
              {
                icon: (
                  <ShieldCheck
                    size={40}
                    className="mx-auto text-brand mb-4"
                  />
                ),
                title: "Quality",
                text: "From boutique stays to expert guides — we focus on quality at every step, so you can focus on the joy of your journey.",
              },
              {
                icon: (
                  <Globe size={40} className="mx-auto text-brand mb-4" />
                ),
                title: "Responsibility",
                text: "We travel responsibly — respecting local cultures and protecting the natural world that makes travel possible.",
              },
            ].map((val, i) => (
              <motion.div
                key={val.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-slate-50 dark:bg-slate-800 p-8 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700"
              >
                {val.icon}
                <h3 className="text-xl font-bold mb-2 text-slate-800 dark:text-slate-100">
                  {val.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-300">
                  {val.text}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* --- Stats Section --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center mb-24">
          {[
            {
              icon: <Users className="text-brand mx-auto mb-3" size={42} />,
              number: "20K+",
              label: "Happy Travelers",
            },
            {
              icon: <Compass className="text-brand mx-auto mb-3" size={42} />,
              number: "150+",
              label: "Destinations",
            },
            {
              icon: <Heart className="text-brand mx-auto mb-3" size={42} />,
              number: formatRupee(20000),
              label: "Starting Package Price",
            },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700"
            >
              {stat.icon}
              <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                {stat.number}
              </h3>
              <p className="text-slate-500 dark:text-slate-400">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>

        {/* --- Team Section --- */}
        <h2 className="text-4xl font-bold text-center mb-12 text-slate-800 dark:text-slate-100">
          Meet Our Team
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {(teamMembers || []).map((member, i) => (
            <motion.div
              key={member._id || i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group"
            >
              <div className="relative overflow-hidden rounded-2xl shadow-lg">
                <img
                  src={getImageUrl(member.image)}
                  alt={member.name}
                  className="w-full h-80 object-cover rounded-2xl transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 text-left text-white">
                  <h3 className="text-xl font-semibold">{member.name}</h3>
                  <p className="text-brand-light">{member.title}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
