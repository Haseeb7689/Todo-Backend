import express from "express";
export const router = express.Router();
import { register, login } from "../controllers/auth.controllers";

export const authRouter = express.Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
