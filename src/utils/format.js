// src/utils/format.js

/**
 * Format a number as Indian Rupee currency (e.g., ₹12,345)
 * @param {number|string} amount - The numeric value to format
 * @returns {string} - Formatted string with ₹ symbol
 */
export function formatRupee(amount) {
    if (amount === null || amount === undefined || amount === "") return "₹0";
    const num = Number(amount);
    if (isNaN(num)) return "₹0";
    return `₹${num.toLocaleString("en-IN")}`;
  }
  
  /**
   * Format a date into a readable format (e.g., 05 Nov 2025)
   * @param {string|Date} dateStr - The date string or Date object
   * @returns {string} - Formatted date string
   */
  export function formatDate(dateStr) {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "Invalid Date";
  
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }
  
  /**
   * Truncate a long string and append "..."
   * @param {string} text - The string to truncate
   * @param {number} maxLength - Max allowed characters
   * @returns {string} - Truncated string
   */
  export function truncateText(text, maxLength = 50) {
    if (!text) return "";
    return text.length > maxLength ? text.slice(0, maxLength) + "..." : text;
  }
  
  /**
   * Capitalize the first letter of a string
   * @param {string} str - The string to capitalize
   * @returns {string} - Capitalized string
   */
  export function capitalize(str) {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  