import React from "react";
import { cn } from "../../utils/helpers";

const InputField = ({
  label,
  icon: Icon,
  iconRight,
  error,
  className,
  ...props
}) => (
  <div className="w-full">
    {label && (
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
        {label}
      </label>
    )}

    <div className="relative">
      {Icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icon className="w-5 h-5 text-slate-400" />
        </div>
      )}

      <input
        {...props}
        className={cn(
          "w-full mt-1 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand transition",
          "dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200 dark:placeholder-slate-400",
          error ? "border-red-500 ring-red-500" : "",
          Icon ? "pl-10" : "pl-4",
          iconRight ? "pr-16" : "pr-4", // ✅ Add padding for the right icon
          className
        )}
      />

      {/* ✅ Right-side icon */}
      {iconRight && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          {iconRight}
        </div>
      )}
    </div>

    {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
  </div>
);

export default InputField;
