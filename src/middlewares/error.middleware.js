function notFoundMiddleware(req, res, next) {
  const error = new Error('Ruta no encontrada');
  error.statusCode = 404;
  next(error);
}

function errorMiddleware(error, req, res, next) {
  const statusCode = error.statusCode || error.status || 500;
  const isInternalError = statusCode >= 500;

  if (isInternalError) {
    console.error(error);
  }

  res.status(statusCode).json({
    message: isInternalError ? 'Error interno del servidor' : error.message,
  });
}

module.exports = {
  notFoundMiddleware,
  errorMiddleware,
};
