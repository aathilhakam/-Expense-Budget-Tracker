export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.path}` });
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  if (error.name === 'ValidationError') {
    return res.status(400).json({ message: error.message });
  }
  if (error.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid resource identifier.' });
  }
  if (error.code === 11000) {
    return res.status(409).json({ message: 'A record with those details already exists.' });
  }

  console.error(error);
  return res.status(500).json({ message: 'An unexpected server error occurred.' });
}
