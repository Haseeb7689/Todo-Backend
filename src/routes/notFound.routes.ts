import { Router } from "express";
import { handleNotFound } from "../controllers/notFound.controllers";

export const notFoundRouter = Router();

notFoundRouter.use(handleNotFound);
