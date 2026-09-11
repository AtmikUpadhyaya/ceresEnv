import { ErrorRequestHandler, RequestHandler } from 'express';

export const asyncHandler =
  (handler: RequestHandler): RequestHandler =>
  (req, res, next) =>
    Promise.resolve(handler(req, res, next)).catch(next);

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    message: 'Route not found',
    path: req.originalUrl,
  });
};

export const globalErrorHandler: ErrorRequestHandler = (
  error,
  req,
  res,
  _next,
) => {
  if (res.headersSent) return;
  res.status(500).json({ message: 'Internal server error' });
};
