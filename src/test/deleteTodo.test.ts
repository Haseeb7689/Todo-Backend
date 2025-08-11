// src/test/deleteTodo.test.ts
import request from "supertest";
import express from "express";

const mFindUnique = jest.fn();
const mDelete = jest.fn();
const mPrismaClient = { todo: { findUnique: mFindUnique, delete: mDelete } };

// We declare the variable first so we can use the *same reference* in tests
let MockPrismaClientKnownRequestError: any;

// Mock prisma module BEFORE importing controller
jest.mock("../generated/prisma", () => {
  MockPrismaClientKnownRequestError = class extends Error {
    code: string;
    constructor(message: string, code: string) {
      super(message);
      this.code = code;
      Object.setPrototypeOf(this, new.target.prototype);
    }
  };
  return {
    PrismaClient: jest.fn(() => mPrismaClient),
    Prisma: {
      PrismaClientKnownRequestError: MockPrismaClientKnownRequestError,
    },
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

// Import AFTER mocks
import { deleteTodo } from "../controllers/todo.controllers";
import { Prisma } from "../generated/prisma";

describe("DELETE /todos/:id", () => {
  let app: express.Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      (req as any).userId = 1;
      next();
    });
    app.delete("/todos/:id", deleteTodo);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mFindUnique.mockReset();
    mDelete.mockReset();
  });

  it("should return 400 if id is invalid", async () => {
    (isUuid as jest.Mock).mockReturnValue(false);
    const res = await request(app).delete("/todos/invalid-id");
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid Todo ID");
  });

  it("should return 403 if todo not found or not owned by user", async () => {
    (isUuid as jest.Mock).mockReturnValue(true);
    mFindUnique.mockResolvedValue(null);
    const res = await request(app).delete("/todos/uuid-123");
    expect(res.status).toBe(403);
    expect(res.body.message).toBe("You are not authorized to delete this todo");
  });

  it("should delete todo successfully", async () => {
    (isUuid as jest.Mock).mockReturnValue(true);
    mFindUnique.mockResolvedValue({ id: "uuid-123", userId: 1 });
    mDelete.mockResolvedValue({ id: "uuid-123", userId: 1 });
    const res = await request(app).delete("/todos/uuid-123");
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Todo Deleted Successfully");
    expect(logger.info).toHaveBeenCalledWith("Todo Deleted Successfully", {
      id: "uuid-123",
    });
  });

  it("should return 500 for any other error", async () => {
    (isUuid as jest.Mock).mockReturnValue(true);
    mFindUnique.mockResolvedValue({ id: "uuid-123", userId: 1 });
    mDelete.mockRejectedValue(new Error("DB failed"));
    const res = await request(app).delete("/todos/uuid-123");
    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Failed To Delete");
    expect(logger.error).toHaveBeenCalledWith("Failed to Delete", {
      error: expect.any(Error),
    });
  });
});
