import request from "supertest";
import express from "express";

const mFindMany = jest.fn();
const mPrismaClient = { todo: { findMany: mFindMany } };

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

import { getTodo } from "../controllers/todo.controllers";

describe("GET /todos", () => {
  let app: express.Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      (req as any).userId = 1;
      next();
    });
    app.get("/todos", getTodo);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mFindMany.mockReset();
  });

  it("should return todos when found", async () => {
    mFindMany.mockResolvedValue([
      { id: 1, title: "Todo 1", createdAt: new Date(), userId: 1 },
      { id: 2, title: "Todo 2", createdAt: new Date(), userId: 1 },
    ]);

    const res = await request(app).get("/todos");

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Todos Fetched Successfully");
    expect(res.body.todos).toHaveLength(2);
    expect(logger.info).toHaveBeenCalledWith(
      "Todos Fetched Successfully",
      expect.objectContaining({
        count: 2,
        preview: [
          { id: 1, title: "Todo 1" },
          { id: 2, title: "Todo 2" },
        ],
      })
    );
  });

  it("should return empty array with message if no todos", async () => {
    mFindMany.mockResolvedValue([]);

    const res = await request(app).get("/todos");

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("No todos found");
    expect(res.body.todos).toEqual([]);
    expect(logger.info).toHaveBeenCalledWith("No todos found");
  });

  it("should return 500 if prisma throws an error", async () => {
    mFindMany.mockRejectedValue(new Error("DB connection failed"));

    const res = await request(app).get("/todos");

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Failed to fetch todos");
    expect(logger.error).toHaveBeenCalledWith("Failed to fetch todos", {
      error: expect.any(Error),
    });
  });
});
