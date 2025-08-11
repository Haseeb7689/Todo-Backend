import { Request, Response } from "express";

export const test = async (req: Request, res: Response) => {
  res
    .status(200)
    .json({ success: true, message: "My name is test", data: null });
};
