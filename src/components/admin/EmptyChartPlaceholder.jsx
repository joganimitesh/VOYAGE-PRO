// src/components/admin/EmptyChartPlaceholder.jsx

import React from "react";
import { motion } from "framer-motion";
import { BarChart2 } from "lucide-react";

const EmptyChartPlaceholder = ({ message }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="
        h-[300px] w-full flex flex-col items-center justify-center
        bg-slate-50 dark:bg-slate-800/50
        border-2 border-dashed border-slate-200 dark:border-slate-700
        rounded-xl p-4
      "
    >
      <BarChart2
        size={40}
        className="text-slate-400 dark:text-slate-600 mb-4"
      />
      <p className="text-slate-500 dark:text-slate-400 font-semibold">
        {message}
      </p>
      <p className="text-sm text-slate-400 dark:text-slate-500">
        Try adjusting the date filter
      </p>
    </motion.div>
  );
};

export default EmptyChartPlaceholder;
