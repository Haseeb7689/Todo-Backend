import { PrismaClient } from "../generated/prisma";
import { Request, Response } from "express";
import { PrismaClientKnownRequestError } from "../generated/prisma/runtime/library";
import logger from "../utils/logger";
import { validate as isUuid } from "uuid";
const prisma = new PrismaClient();

export const getTodo = async (req: Request, res: Response) => {
  const userId = (req as any).userId;

  try {
    const todos = await prisma.todo.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    if (todos.length === 0) {
      logger.info("No todos found");
      return res.status(200).json({ message: "No todos found", todos: [] });
    }

    logger.info("Todos Fetched Successfully", {
      count: todos.length,
      preview: todos
        .slice(0, 3)
        .map((todo) => ({ id: todo.id, title: todo.title })),
    });
    res.status(200).json({ message: "Todos Fetched Successfully", todos });
  } catch (error) {
    logger.error("Failed to fetch todos", { error });
    res.status(500).json({ message: "Failed to fetch todos" });
  }
};

export const postTodo = async (req: Request, res: Response) => {
  const data = req.body;
  const userId = (req as any).userId;

  if (!data || !data.title) {
    return res.status(400).json({ message: "Todo Title is required" });
  }
  try {
    const existing = await prisma.todo.findFirst({
      where: {
        title: data.title,
        completed: false,
        userId: userId,
      },
    });
    if (existing) {
      return res.status(409).json({
        message: "Todo with this title already exists and is not completed",
      });
    }

    const newTodo = await prisma.todo.create({
      data: {
        title: data.title,
        userId: userId,
      },
    });
    logger.info("Todos Created Successfully", {
      id: newTodo.id,
      title: newTodo.title,
      userId: newTodo.userId,
    });
    return res
      .status(201)
      .json({ message: "Todo Created Successfully", todo: newTodo });
  } catch (error) {
    logger.error("Failed to Add", { error });
    res.status(500).json({ message: "Failed To Add" });
  }
};

export const deleteTodo = async (req: Request, res: Response) => {
  const id = req.params.id;
  const userId = (req as any).userId;

  if (!id || !isUuid(id)) {
    return res.status(400).json({ message: "Invalid Todo ID" });
  }
  try {
    const todo = await prisma.todo.findUnique({
      where: { id },
    });

    if (!todo || todo.userId !== userId) {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this todo" });
    }

    const deletedTodo = await prisma.todo.delete({
      where: {
        id: id,
      },
    });
    logger.info("Todo Deleted Successfully", { id: id });
    return res
      .status(200)
      .json({ message: "Todo Deleted Successfully", todos: deletedTodo });
  } catch (error) {
    logger.error("Failed to Delete", { error });

    if (
      error instanceof PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return res
        .status(404)
        .json({ message: "No record was found for delete" });
    }

    res.status(500).json({ message: "Failed To Delete" });
  }
};

export const updateTodo = async (req: Request, res: Response) => {
  const data = req.body;
  const id = req.params.id;
  const userId = (req as any).userId;
  if (!id || !isUuid(id)) {
    return res.status(400).json({ message: "Invalid Todo ID" });
  }
  try {
    const existing = await prisma.todo.findUnique({
      where: { id: id },
    });
    if (!existing || existing.userId !== userId) {
      return res
        .status(403)
        .json({ message: "You are not authorized to update this todo" });
    }

    const noChange =
      (data.title === undefined || data.title === existing.title) &&
      (data.completed === undefined || data.completed === existing.completed);

    if (noChange) {
      return res.status(400).json({ message: "No changes detected" });
    }

    if (data.title) {
      const duplicate = await prisma.todo.findFirst({
        where: {
          title: data.title,
          completed: false,
          userId: userId,
          NOT: { id: id },
        },
      });
      if (duplicate) {
        return res.status(409).json({
          message: "Another incomplete todo with this title already exists",
        });
      }
    }

    const updatedTodo = await prisma.todo.update({
      where: { id: id },
      data: {
        title: data.title ?? undefined,
        completed: data.completed ?? undefined,
      },
    });
    logger.info("Todo Updated Successfully", {
      id: data.id,
      todos: updatedTodo,
    });

    return res
      .status(200)
      .json({ message: "Todo Updated Successfully", todos: updatedTodo });
  } catch (error) {
    logger.error("Failed to Update", { error });
    res.status(500).json({ message: "Failed To Update" });
  }
};
