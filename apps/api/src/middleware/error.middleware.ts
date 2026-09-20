import { Request, Response, NextFunction } from "express";

export const globalErrorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  // A route may have opted into public caching before it threw; never cache an error.
  res.removeHeader("Cache-Control");
  const statusCode = err.statusCode || 500;
  const message    = err.isOperational ? err.message : "An unexpected error occurred";

  res.status(statusCode).json({
    status:  statusCode >= 500 ? "error" : "fail",
    message,
  });
};
