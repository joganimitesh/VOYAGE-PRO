import React from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";

/**
 * A precise, animated star rating display component.
 * It uses a "mask" to show partial stars and animates in two stages:
 * 1. Background stars pop in (staggered).
 * 2. Foreground "fill" animates in.
 */
const StarDisplay = ({ rating = 5, size = 20 }) => {
  const starArray = [1, 2, 3, 4, 5];

  // Calculate the percentage width for the filled stars
  const filledWidth = (rating / 5) * 100;

  // Variants for the container to stagger the background stars
  const starContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08, // Each star appears 80ms after the last
        delayChildren: 0.1, // Wait 100ms before starting
      },
    },
  };

  // Variants for each individual background star
  const starVariants = {
    hidden: { opacity: 0, scale: 0.5, y: 10 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 12 },
    },
  };

  // Variants for the foreground (fill) mask
  const fillVariants = {
    hidden: { width: "0%" },
    visible: {
      width: `${filledWidth}%`,
      transition: {
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1], // Smooth ease-out-quint
        delay: 0.6, // Starts after all stars have popped in
      },
    },
  };

  return (
    <motion.div
      className="relative flex gap-1"
      variants={starContainerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.5 }}
    >
      {/* 1. Background (Empty) Stars - Staggered */}
      {starArray.map((i) => (
        <motion.div key={`empty-${i}`} variants={starVariants}>
          <Star
            size={size}
            className="text-slate-200 dark:text-slate-600 flex-shrink-0"
            fill="currentColor"
          />
        </motion.div>
      ))}

      {/* 2. Foreground (Filled) Stars - Animated Mask */}
      <motion.div
        className="absolute top-0 left-0 flex gap-1 overflow-hidden"
        variants={fillVariants}
      >
        {starArray.map((i) => (
          <Star
            key={`filled-${i}`}
            size={size}
            className="text-yellow-400 flex-shrink-0"
            fill="currentColor"
          />
        ))}
      </motion.div>
    </motion.div>
  );
};

export default StarDisplay;
