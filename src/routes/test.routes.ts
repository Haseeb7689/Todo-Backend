import express from "express";
import { test } from "./../controllers/test.controllers";

export const router = express.Router();

router.get("/test", test);
