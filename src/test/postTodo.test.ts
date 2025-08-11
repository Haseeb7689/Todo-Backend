import request from "supertest";
import express from "express";

const mFindFirst = jest.fn();
const mCreate = jest.fn();
const mPrismaClient = { todo: { findFirst: mFindFirst, create: mCreate } };

jest.mock("../generated/prisma", () => {
  return {
    PrismaClient: jest.fn(() => mPrismaClient),
  };
});

jest.mock("../utils/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
}));
import logger from "../utils/logger";

import { postTodo } from "../controllers/todo.controllers";

describe("POST /todos", () => {
  let app: express.Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    app.use((req, _res, next) => {
      (req as any).userId = 1;
      next();
    });
    app.post("/todos", postTodo);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mFindFirst.mockReset();
    mCreate.mockReset();
  });

  it("should return 400 if title is missing", async () => {
    const res = await request(app).post("/todos").send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Todo Title is required");
  });

  it("should return 409 if todo with same title exists and is not completed", async () => {
    mFindFirst.mockResolvedValue({
      id: 1,
      title: "Existing Todo",
      completed: false,
      userId: 1,
    });

    const res = await request(app)
      .post("/todos")
      .send({ title: "Existing Todo" });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe(
      "Todo with this title already exists and is not completed"
    );
  });

  it("should create and return a new todo", async () => {
    mFindFirst.mockResolvedValue(null);
    mCreate.mockResolvedValue({
      id: 1,
      title: "New Todo",
      userId: 1,
      createdAt: new Date(),
    });

    const res = await request(app).post("/todos").send({ title: "New Todo" });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe("Todo Created Successfully");
    expect(res.body.todo).toMatchObject({
      id: 1,
      title: "New Todo",
      userId: 1,
    });
    expect(logger.info).toHaveBeenCalledWith("Todos Created Successfully", {
      id: 1,
      title: "New Todo",
      userId: 1,
    });
  });

  it("should return 500 if prisma throws an error", async () => {
    mFindFirst.mockRejectedValue(new Error("DB connection failed"));

    const res = await request(app)
      .post("/todos")
      .send({ title: "Failing Todo" });

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Failed To Add");
    expect(logger.error).toHaveBeenCalledWith("Failed to Add", {
      error: expect.any(Error),
    });
  });
});
