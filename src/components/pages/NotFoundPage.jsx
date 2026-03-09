// src/components/pages/NotFoundPage.jsx

import React from "react";
import { Link } from "react-router-dom";
import { Compass } from "lucide-react"; // Optional: nice travel-themed icon

const NotFoundPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 text-center px-6">
      <div className="flex items-center justify-center mb-6">
        <Compass className="w-12 h-12 text-blue-600 animate-spin-slow" />
      </div>

      <h1 className="text-6xl font-extrabold text-gray-800 mb-4">404</h1>

      <p className="text-lg text-gray-600 mb-8">
        Oops! The page you’re looking for doesn’t exist or has been moved.
      </p>

      <Link
        to="/"
        className="px-6 py-3 bg-blue-600 text-white text-lg rounded-xl shadow-md hover:bg-blue-700 transition-all"
      >
        Go Back Home
      </Link>
    </div>
  );
};

export default NotFoundPage;
