import { Request, Response } from "express";

export const handleNotFound = (_req: Request, res: Response) => {
  res.status(404).json({ message: "Route not found" });
};
