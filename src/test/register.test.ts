import request from "supertest";
import express from "express";
import { register } from "../controllers/auth.controllers";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

jest.mock("bcryptjs");
jest.mock("jsonwebtoken");
jest.mock("@prisma/client", () => {
  const mPrismaClient = {
    user: { create: jest.fn() },
  };
  return { PrismaClient: jest.fn(() => mPrismaClient) };
});

const prisma = new PrismaClient() as jest.Mocked<PrismaClient>;

describe("POST /register", () => {
  let app: express.Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.post("/register", register);
  });

  it("should register a new user successfully", async () => {
    (bcrypt.hash as jest.Mock).mockResolvedValue("hashed_password");
    (prisma.user.create as jest.Mock).mockResolvedValue({
      id: 1,
      email: "test@example.com",
      password: "hashed_password",
    } as any);
    (jwt.sign as jest.Mock).mockReturnValue("mock_token");

    const res = await request(app)
      .post("/register")
      .send({ email: "test@example.com", password: "123456" });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user).toEqual({
      id: 1,
      email: "test@example.com",
      token: "mock_token",
    });

    expect(bcrypt.hash).toHaveBeenCalledWith("123456", 10);
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: { email: "test@example.com", password: "hashed_password" },
    });
    expect(jwt.sign).toHaveBeenCalled();
  });

  it("should return 400 if user already exists", async () => {
    (bcrypt.hash as jest.Mock).mockResolvedValue("hashed_password");
    (prisma.user.create as jest.Mock).mockRejectedValue(
      new Error("Unique constraint failed")
    );

    const res = await request(app)
      .post("/register")
      .send({ email: "existing@example.com", password: "123456" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Email already exists or invalid input");
  });
});
