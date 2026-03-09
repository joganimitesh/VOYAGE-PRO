import React, { useState } from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { cn } from "../../utils/helpers";

/**
 * Animated, interactive star rating component for forms.
 * Features staggered load-in and bouncy, springy hover/tap physics.
 */
const StarRating = ({ rating, onRatingChange }) => {
  const [hoverRating, setHoverRating] = useState(0);

  // Animation variants for the container to stagger children
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05, // Each star animates in 50ms after the last
      },
    },
  };

  // Animation variants for each individual star
  const starVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.8 },
    visible: { opacity: 1, y: 0, scale: 1 },
  };

  return (
    <motion.div
      className="flex justify-center gap-2"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {[1, 2, 3, 4, 5].map((starIndex) => {
        const currentRating = hoverRating || rating;
        return (
          <motion.div
            key={starIndex}
            variants={starVariants} // Staggered load-in animation
            className="cursor-pointer"
            onClick={() => onRatingChange(starIndex)}
            onHoverStart={() => setHoverRating(starIndex)}
            onHoverEnd={() => setHoverRating(0)}
            whileHover={{
              scale: 1.3,
              y: -5,
              rotate: 5,
              transition: { type: "spring", stiffness: 400, damping: 10 },
            }}
            whileTap={{ scale: 0.8, rotate: -10 }}
          >
            <Star
              size={32}
              className={cn(
                "transition-colors duration-100",
                starIndex <= currentRating
                  ? "text-yellow-400 fill-yellow-400"
                  : "text-slate-300 dark:text-slate-600"
              )}
            />
          </motion.div>
        );
      })}
    </motion.div>
  );
};

export default StarRating;
