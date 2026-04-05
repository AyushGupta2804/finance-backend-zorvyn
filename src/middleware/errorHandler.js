// Custom application error
class AppError extends Error {
  constructor(message, statusCode = 500, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// 404 handler
const notFoundHandler = (req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
};

// Global error handler
const errorHandler = (err, req, res, next) => {
  // Default to 500 if statusCode not set
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // MySQL duplicate entry
  if (err.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    message = 'A record with this value already exists';
  }

  // MySQL foreign key constraint
  if (err.code === 'ER_ROW_IS_REFERENCED_2') {
    statusCode = 400;
    message = 'Cannot delete this record because it is referenced by other data';
  }

  // Joi validation errors
  if (err.isJoi) {
    statusCode = 422;
    message = 'Validation failed';
  }

  if (process.env.NODE_ENV !== 'test') {
    console.error(`[${statusCode}] ${message}`, err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(err.errors && { errors: err.errors }),
    ...(process.env.NODE_ENV === 'development' && !err.isOperational && { stack: err.stack }),
  });
};

module.exports = { AppError, notFoundHandler, errorHandler };
