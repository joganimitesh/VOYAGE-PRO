// src/components/ui/Button.jsx
import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../utils/helpers";

const Button = ({
  children,
  className,
  variant = "primary",
  icon: Icon,
  ...props
}) => {
  // ✅ --- FIX 1: Added Tailwind transform/transition for hover ---
  const baseClasses =
    "px-8 py-3 font-semibold rounded-lg flex items-center justify-center gap-2 shadow-lg group transform transition-all duration-200 hover:-translate-y-0.5";
  // ✅ --- END: FIX ---

  const variants = {
    primary: "bg-brand text-white hover:bg-brand-hover hover:shadow-glow-brand",
    secondary:
      "bg-white text-brand hover:bg-slate-100 hover:shadow-glow-white",
    ghost: "bg-transparent shadow-none text-slate-700 hover:bg-slate-100",
  };

  return (
    // ✅ --- FIX 2: Removed whileHover and whileTap ---
    <motion.button
      whileTap={{ scale: 0.95 }} // Keep tap, but remove hover
      className={cn(baseClasses, variants[variant] || variants.primary, className)}
      {...props}
    >
      {/* ✅ --- END: FIX --- */}
      {Icon && !props.disabled && <Icon className="w-5 h-5" />}
      {children}
    </motion.button>
  );
};

export default Button;
