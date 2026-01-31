import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger.js";
import type { ErrorResponse } from "../types/api.js";

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response<ErrorResponse>,
  next: NextFunction
) {
  logger.error({ err, path: req.path }, "Request error");
  
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      details: err.details,
    });
  }
  
  // Generic error
  res.status(500).json({
    error: "Internal server error",
    code: "INTERNAL_ERROR",
  });
}
