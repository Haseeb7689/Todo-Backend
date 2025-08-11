import { Router } from "express";
import { handleNotFound } from "../controllers/404page.controllers";

export const page404 = Router();

page404.all("*", handleNotFound);
