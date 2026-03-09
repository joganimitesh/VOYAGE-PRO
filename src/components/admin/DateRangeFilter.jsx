// src/components/admin/DateRangeFilter.jsx

import React, { useState } from "react";
import { cn } from "../../utils/helpers";
import Button from "../ui/Button";

const filterOptions = [
  { label: "1 Week", value: "1W" },
  { label: "1 Month", value: "1M" },
  { label: "1 Year", value: "1Y" },
  { label: "All Time", value: "All" },
];

const DateRangeFilter = ({ onFilterChange }) => {
  const [activeFilter, setActiveFilter] = useState("All");

  const getDates = (filter) => {
    const endDate = new Date();
    let startDate = new Date();

    switch (filter) {
      case "1W":
        startDate.setDate(endDate.getDate() - 7);
        break;
      case "1M":
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case "1Y":
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      case "All":
        startDate = new Date("2000-01-01");
        break;
      default:
        startDate = new Date("2000-01-01");
    }

    // Return null if 'All' is selected so we don't send query params
    if (filter === "All") {
      return { startDate: null, endDate: null };
    }

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };
  };

  const handleFilterClick = (value) => {
    setActiveFilter(value);
    const { startDate, endDate } = getDates(value);
    onFilterChange({ startDate, endDate });
  };

  return (
    <div className="flex items-center justify-center bg-white dark:bg-slate-800 p-3 rounded-xl shadow-md border dark:border-slate-700 mb-10">
      <div className="flex p-1 bg-slate-100 dark:bg-slate-700 rounded-lg">
        {filterOptions.map((opt) => (
          <Button
            key={opt.value}
            onClick={() => handleFilterClick(opt.value)}
            className={cn(
              "px-4 py-1.5 text-sm rounded-md shadow-none",
              activeFilter === opt.value
                ? "bg-brand text-white shadow-md"
                : "bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
            )}
            whileHover={{}}
            whileTap={{}}
          >
            {opt.label}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default DateRangeFilter;
