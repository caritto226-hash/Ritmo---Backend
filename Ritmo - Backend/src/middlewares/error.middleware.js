// Errores de MySQL que provienen de datos del cliente: nunca deben responder 500.
const mysqlClientErrors = {
  ER_DUP_ENTRY: { statusCode: 409, message: 'El registro ya existe' },
  ER_DATA_TOO_LONG: { statusCode: 400, message: 'Uno de los campos supera la longitud permitida' },
  ER_WARN_DATA_OUT_OF_RANGE: { statusCode: 400, message: 'Uno de los valores numéricos está fuera del rango permitido' },
  ER_TRUNCATED_WRONG_VALUE: { statusCode: 400, message: 'Uno de los valores no tiene un formato válido' },
  ER_TRUNCATED_WRONG_VALUE_FOR_FIELD: { statusCode: 400, message: 'Uno de los valores no tiene un formato válido' },
};

// Errores del lector de JSON de Express: se traducen sin exponer el mensaje interno del parser.
const bodyParserErrors = {
  'entity.parse.failed': 'El cuerpo de la petición no es un JSON válido',
  'entity.too.large': 'El cuerpo de la petición supera el tamaño permitido',
};

function notFoundMiddleware(req, res, next) {
  const error = new Error('Ruta no encontrada');
  error.statusCode = 404;
  next(error);
}

function errorMiddleware(error, req, res, next) {
  const mysqlError = mysqlClientErrors[error.code];

  if (mysqlError) {
    console.warn(`[${error.code}] ${req.method} ${req.originalUrl}`);
    return res.status(mysqlError.statusCode).json({ message: mysqlError.message });
  }

  const statusCode = error.statusCode || error.status || 500;
  const isInternalError = statusCode >= 500;

  if (isInternalError) {
    console.error(error);
  }

  return res.status(statusCode).json({
    message: isInternalError
      ? 'Error interno del servidor'
      : bodyParserErrors[error.type] || error.message,
  });
}

module.exports = {
  notFoundMiddleware,
  errorMiddleware,
};
