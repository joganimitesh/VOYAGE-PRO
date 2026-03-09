const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  // Only log full stack traces for real server errors, not 404s
  if (statusCode === 404) {
    console.warn(`⚠️ 404 Not Found: ${req.originalUrl}`);
  } else {
    console.error("🔥 Error Handler Caught:", err);
  }

  res.status(statusCode).json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
};

module.exports = { notFound, errorHandler };
