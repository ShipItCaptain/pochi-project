const notFound = (req, res, next) => {
  const err = new Error(`Not Found — ${req.originalUrl}`);
  err.statusCode = 404;
  next(err);
};

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  if (statusCode >= 500) {
    console.error(`[${new Date().toISOString()}] ${statusCode} ${err.message}`);
  }

  res.status(statusCode).json({
    error: err.message || 'Internal Server Error',
  });
};

module.exports = { notFound, errorHandler };
