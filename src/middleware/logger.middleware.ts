import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger";

export const loggerMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.info({
    message: "Request received",
    method: req.method,
    url: req.originalUrl,
  });
  next();
};
