import express from "express";
import {
  deleteTodo,
  getTodo,
  postTodo,
  updateTodo,
} from "./../controllers/todo.controllers";
import { authMiddleware } from "../middleware/auth.middleware";

export const router = express.Router();

router.get("/todos", authMiddleware, getTodo);
router.post("/todo", authMiddleware, postTodo);
router.delete("/delete/:id", authMiddleware, deleteTodo);
router.patch("/update/:id", authMiddleware, updateTodo);
