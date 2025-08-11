// src/test/updateTodo.test.ts
import request from "supertest";
import express from "express";

const mFindUnique = jest.fn();
const mFindFirst = jest.fn();
const mUpdate = jest.fn();
const mPrismaClient = {
  todo: {
    findUnique: mFindUnique,
    findFirst: mFindFirst,
    update: mUpdate,
  },
};

jest.mock("../generated/prisma", () => {
  return {
    PrismaClient: jest.fn(() => mPrismaClient),
  };
});

jest.mock("uuid", () => ({
  validate: jest.fn(),
}));
import { validate as isUuid } from "uuid";

jest.mock("../utils/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
}));
import logger from "../utils/logger";

import { updateTodo } from "../controllers/todo.controllers";

describe("PUT /todos/:id", () => {
  let app: express.Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      (req as any).userId = 1;
      next();
    });
    app.put("/todos/:id", updateTodo);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mFindUnique.mockReset();
    mFindFirst.mockReset();
    mUpdate.mockReset();
  });

  it("should return 400 if id is invalid", async () => {
    (isUuid as jest.Mock).mockReturnValue(false);
    const res = await request(app)
      .put("/todos/invalid-id")
      .send({ title: "test" });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid Todo ID");
  });

  it("should return 403 if todo not found or not owned by user", async () => {
    (isUuid as jest.Mock).mockReturnValue(true);
    mFindUnique.mockResolvedValue(null);
    const res = await request(app)
      .put("/todos/uuid-123")
      .send({ title: "test" });
    expect(res.status).toBe(403);
    expect(res.body.message).toBe("You are not authorized to update this todo");
  });

  it("should return 400 if no changes detected", async () => {
    (isUuid as jest.Mock).mockReturnValue(true);
    mFindUnique.mockResolvedValue({
      id: "uuid-123",
      userId: 1,
      title: "old title",
      completed: false,
    });
    const res = await request(app)
      .put("/todos/uuid-123")
      .send({ title: "old title", completed: false });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("No changes detected");
  });

  it("should return 409 if duplicate title exists", async () => {
    (isUuid as jest.Mock).mockReturnValue(true);
    mFindUnique.mockResolvedValue({
      id: "uuid-123",
      userId: 1,
      title: "old title",
      completed: false,
    });
    mFindFirst.mockResolvedValue({
      id: "other-id",
      userId: 1,
      title: "new title",
      completed: false,
    });
    const res = await request(app)
      .put("/todos/uuid-123")
      .send({ title: "new title" });
    expect(res.status).toBe(409);
    expect(res.body.message).toBe(
      "Another incomplete todo with this title already exists"
    );
  });

  it("should update todo successfully", async () => {
    (isUuid as jest.Mock).mockReturnValue(true);
    mFindUnique.mockResolvedValue({
      id: "uuid-123",
      userId: 1,
      title: "old title",
      completed: false,
    });
    mFindFirst.mockResolvedValue(null);
    mUpdate.mockResolvedValue({
      id: "uuid-123",
      userId: 1,
      title: "new title",
      completed: false,
    });
    const res = await request(app)
      .put("/todos/uuid-123")
      .send({ title: "new title" });
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Todo Updated Successfully");
    expect(logger.info).toHaveBeenCalledWith("Todo Updated Successfully", {
      id: undefined,
      todos: {
        id: "uuid-123",
        userId: 1,
        title: "new title",
        completed: false,
      },
    });
  });

  it("should return 500 if update throws an error", async () => {
    (isUuid as jest.Mock).mockReturnValue(true);
    mFindUnique.mockResolvedValue({
      id: "uuid-123",
      userId: 1,
      title: "old title",
      completed: false,
    });
    mFindFirst.mockResolvedValue(null);
    mUpdate.mockRejectedValue(new Error("DB failed"));
    const res = await request(app)
      .put("/todos/uuid-123")
      .send({ title: "new title" });
    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Failed To Update");
    expect(logger.error).toHaveBeenCalledWith("Failed to Update", {
      error: expect.any(Error),
    });
  });
});
